// src/contexts/AppContext.js
import React, { createContext, useContext, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import ExpenseAuditService from "../components/services/ExpenseAuditService";
import { expenseAuditConfig } from "../config/expenseAudit.config";

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProviderExpenseAudit({ children }) {
  const { instance, accounts } = useMsal();

  const [services, setServices] = useState({
    expense: { service: null, initialized: false, initializing: false },
  });

  const [expenseState, setExpenseState] = useState({
    expenseReports: [],
    departments: [],
    roles: [],
    departmentWorkers: [],
    userDepartmentRole: null,
    loading: false,
    error: null,
  });

  const updateExpenseReports = useCallback((updaterFn) => {
    setExpenseState((prev) => ({
      ...prev,
      expenseReports:
        typeof updaterFn === "function"
          ? updaterFn(prev.expenseReports)
          : updaterFn,
    }));
  }, []);

  const initializeExpenseService = useCallback(async () => {
    if (!instance || accounts.length === 0) return null;
    if (services.expense.initialized) return services.expense.service;
    if (services.expense.initializing) return null;

    try {
      setServices((prev) => ({
        ...prev,
        expense: { ...prev.expense, initializing: true },
      }));

      const expenseService = new ExpenseAuditService(
        instance,
        expenseAuditConfig
      );
      await expenseService.initialize();

      setServices((prev) => ({
        ...prev,
        expense: {
          service: expenseService,
          initialized: true,
          initializing: false,
        },
      }));

      return expenseService;
    } catch (error) {
      console.error("Error initializing expense service:", error);
      setServices((prev) => ({
        ...prev,
        expense: {
          service: null,
          initialized: false,
          initializing: false,
        },
      }));
      return null;
    }
  }, [
    instance,
    accounts,
    services.expense.initialized,
    services.expense.initializing,
    services.expense.service,
  ]);

  const loadExpenseData = useCallback(async () => {
    if (expenseState.loading) return;

    const service = await initializeExpenseService();
    if (!service) return;

    setExpenseState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [expenseReportsData, departmentsData, rolesData] =
        await Promise.all([
          service.getExpenseReports(),
          service.getDepartments(),
          service.getRoles(),
        ]);

      const mappedDepartmentWorkers = service.mapDepartmentWorkers(
        departmentsData,
        rolesData
      );

      const currentUserEmail = accounts[0]?.username;
      const userDeptRole = service.getUserDepartmentRole(
        currentUserEmail,
        departmentsData,
        rolesData
      );

      setExpenseState({
        expenseReports: expenseReportsData,
        departments: departmentsData,
        roles: rolesData,
        departmentWorkers: mappedDepartmentWorkers,
        userDepartmentRole: userDeptRole,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error loading expense data:", error);
      setExpenseState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load expense data",
      }));
    }
  }, [accounts, initializeExpenseService, expenseState.loading]);

  const value = {
    // Services access
    services: {
      expense: services.expense.service,
    },
    // Module states
    expenseState,
    // Initialization methods
    initializeExpenseService,
    // Data loading methods
    loadExpenseData,
    updateExpenseReports,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useExpenseAudit() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error(
      "useExpenseAudit must be used within AppProviderExpenseAudit"
    );
  }

  const {
    services: { expense: service },
    expenseState: {
      expenseReports,
      departments,
      roles,
      departmentWorkers,
      userDepartmentRole,
      loading,
      error,
    },
    updateExpenseReports,
    loadExpenseData,
  } = context;

  React.useEffect(() => {
    if (!service && !loading && !error) {
      loadExpenseData();
    }
  }, [service, loading, error, loadExpenseData]);

  return {
    service,
    expenseReports,
    departments,
    roles,
    departmentWorkers,
    userDepartmentRole,
    loading,
    error,
    setExpenseReports: updateExpenseReports,
    loadExpenseData,
  };
}
