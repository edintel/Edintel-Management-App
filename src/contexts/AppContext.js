// src/contexts/AppContext.js
import React, { createContext, useContext, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import ExpenseAuditService from "../services/modules/ExpenseAuditService";
import { expenseAuditConfig } from "../config/sharepoint/expenseAudit.config";

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const { instance, accounts } = useMsal();
  
  const [services, setServices] = useState({
    expense: { service: null, initialized: false, initializing: false },
  });

  const [expenseState, setExpenseState] = useState({
    periods: [],
    expenseReports: [],
    departments: [],
    roles: [],
    periodReports: [],
    departmentWorkers: [],
    userDepartmentRole: null,
    periodUserReports: [],
    loading: false,
    error: null,
  });

  const initializeExpenseService = useCallback(async () => {
    if (!instance || accounts.length === 0) return null;
    if (services.expense.initialized) return services.expense.service;
    if (services.expense.initializing) return null;

    try {
      setServices(prev => ({
        ...prev,
        expense: { ...prev.expense, initializing: true }
      }));

      const expenseService = new ExpenseAuditService(instance, expenseAuditConfig);
      await expenseService.initialize();

      setServices(prev => ({
        ...prev,
        expense: { 
          service: expenseService, 
          initialized: true, 
          initializing: false 
        }
      }));

      return expenseService;
    } catch (error) {
      console.error("Error initializing expense service:", error);
      setServices(prev => ({
        ...prev,
        expense: { 
          service: null, 
          initialized: false, 
          initializing: false,
        }
      }));
      return null;
    }
  }, [instance, accounts, services.expense.initialized, services.expense.initializing, services.expense.service]);

  const loadExpenseData = useCallback(async () => {
    if (expenseState.loading) return;

    const service = await initializeExpenseService();
    if (!service) return;

    setExpenseState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [
        periodsData,
        expenseReportsData,
        departmentsData,
        rolesData
      ] = await Promise.all([
        service.getPeriods(),
        service.getExpenseReports(),
        service.getDepartments(),
        service.getRoles(),
      ]);

      // Create mapped data
      const mappedPeriodReports = service.mapPeriodReports(
        periodsData,
        expenseReportsData
      );

      const mappedDepartmentWorkers = service.mapDepartmentWorkers(
        departmentsData,
        rolesData
      );

      const mappedPeriodUserReports = service.createPeriodUserReportsMapping(
        periodsData,
        expenseReportsData,
        rolesData
      );

      const currentUserEmail = accounts[0]?.username;
      const userDeptRole = service.getUserDepartmentRole(
        currentUserEmail,
        departmentsData,
        rolesData
      );

      setExpenseState({
        periods: periodsData,
        expenseReports: expenseReportsData,
        departments: departmentsData,
        roles: rolesData,
        periodReports: mappedPeriodReports,
        departmentWorkers: mappedDepartmentWorkers,
        userDepartmentRole: userDeptRole,
        periodUserReports: mappedPeriodUserReports,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error loading expense data:", error);
      setExpenseState(prev => ({
        ...prev,
        loading: false,
        error: "Failed to load expense data"
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook for Expense Audit module
export function useExpenseAudit() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useExpenseAudit must be used within AppProvider");
  }

  const { services, expenseState, loadExpenseData } = context;

  // Initialize data if not already loaded
  React.useEffect(() => {
    if (!services.expense && !expenseState.loading && !expenseState.error) {
      loadExpenseData();
    }
  }, [services.expense, expenseState.loading, expenseState.error, loadExpenseData]);

  return {
    service: services.expense,
    ...expenseState,
  };
}