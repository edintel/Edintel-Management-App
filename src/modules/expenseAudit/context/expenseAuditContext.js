import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import ExpenseAuditService from "../components/services/ExpenseAuditService";
import { expenseAuditConfig } from "../config/expenseAudit.config";

/**
 * App Context for the Expense Audit module
 * Provides state and services for expense audit components
 */
const AppContext = createContext();

/**
 * Hook to access the app context
 * @returns {Object} The app context
 */
export function useAppContext() {
  return useContext(AppContext);
}

/**
 * Provider component for the Expense Audit module
 * @param {Object} children - The child components
 */
export function AppProviderExpenseAudit({ children }) {
  const { instance, accounts } = useMsal();
  const [initialized, setInitialized] = useState(false);
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
    approvalFilters: {
      searchTerm: "",
      startDate: "",
      endDate: "",
      selectedPerson: "",
      viewMode: "pending"
    },
    expenseListFilters: {
      searchTerm: "",
      startDate: "",
      endDate: "",
    },
    reportFilters: {
      searchTerm: "",
      startDate: "",
      endDate: "",
      selectedPerson: "",
      selectedStatuses: []
    }
  });

  /**
   * Update expense reports state
   * @param {Function|Array} updaterFn - Function or array to update expense reports
   */
  const updateExpenseReports = useCallback((updaterFn) => {
    setExpenseState((prev) => ({
      ...prev,
      expenseReports:
        typeof updaterFn === "function"
          ? updaterFn(prev.expenseReports)
          : updaterFn,
    }));
  }, []);

  /**
   * Initialize expense service
   * @returns {Object|null} The initialized service or null
   */
  const initializeExpenseService = useCallback(async () => {
    if (!instance || accounts.length === 0) return null;
    if (services.expense.initialized) return services.expense.service;
    if (services.expense.initializing) return null;
    
    try {
      setServices((prev) => ({
        ...prev,
        expense: { ...prev.expense, initializing: true },
      }));
      
      // Create and initialize the service
      const expenseService = new ExpenseAuditService(instance, expenseAuditConfig);
      
      // Important - we must await full initialization of the service and its dependencies
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
        expense: { service: null, initialized: false, initializing: false },
      }));
      return null;
    }
  }, [instance, accounts, services.expense.initialized, services.expense.initializing, services.expense.service]);

  /**
   * Load expense data
   */
  const loadExpenseData = useCallback(async () => {
    if (expenseState.loading) return;
    const service = await initializeExpenseService();
    if (!service) return;
    setExpenseState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [expenseReportsData, departmentsData, rolesData] = await Promise.all([
        service.getExpenseReports(),
        service.getDepartments(),
        service.getRoles(),
      ]);
      const mappedDepartmentWorkers = service.mapDepartmentWorkers(
        departmentsData,
        rolesData
      );
      const currentUserEmail = accounts[0]?.username;
      
      // Get all user roles across departments
      const userRoles = service.permissionService.getUserRoles(currentUserEmail);
      
      // Determine the primary department role
      let userDeptRole = null;
      
      if (userRoles.length > 0) {
        // Prioritize administrative roles (Jefe, Asistente) over Empleado
        const adminRole = userRoles.find(role => 
          role.roleType === 'Jefe' || role.roleType === 'Asistente'
        );
        
        const selectedRole = adminRole || userRoles[0];
        
        userDeptRole = {
          department: selectedRole.department,
          role: selectedRole.roleType
        };
      }
      
      // Filter visible expenses based on user's roles and permissions
      // Filter expenses based on user's role and permissions
      const filteredExpenses = service.filterExpensesByDepartment(
        expenseReportsData, 
        userDeptRole
      );
      
      setExpenseState(prev => ({
        ...prev,
        expenseReports: filteredExpenses,
        departments: departmentsData,
        roles: rolesData,
        departmentWorkers: mappedDepartmentWorkers,
        userDepartmentRole: userDeptRole,
        loading: false,
        error: null,
      }));
      setInitialized(true);
    } catch (error) {
      console.error("Error loading expense data:", error);
      setExpenseState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load expense data",
      }));
      setInitialized(true);
    }
  }, [accounts, initializeExpenseService, expenseState.loading]);

  // Initialize data when not loaded and user is logged in
  useEffect(() => {
    if (!initialized && !expenseState.loading && accounts.length > 0) {
      loadExpenseData();
    }
  }, [initialized, accounts, loadExpenseData, expenseState.loading]);

  // Context value
  const value = {
    services: { expense: services.expense.service },
    expenseState,
    initialized,
    initializeExpenseService,
    loadExpenseData,
    updateExpenseReports,
    setExpenseState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to access expense audit context
 * @returns {Object} Expense audit context
 */
export function useExpenseAudit() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useExpenseAudit must be used within AppProviderExpenseAudit");
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
      approvalFilters,
      reportFilters,
      expenseListFilters
    },
    initialized,
    updateExpenseReports,
    loadExpenseData,
    setExpenseState
  } = context;
  
  return {
    service,
    permissionService: service ? service.permissionService : null,
    approvalFlowService: service ? service.approvalFlowService : null,
    expenseReports,
    departments,
    roles,
    departmentWorkers,
    userDepartmentRole,
    loading,
    error,
    initialized,
    approvalFilters,
    setApprovalFilters: (filters) => setExpenseState(prev => ({ ...prev, approvalFilters: filters })),
    expenseListFilters,
    setExpenseListFilters: (filters) => setExpenseState(prev => ({ ...prev, expenseListFilters: filters })),
    reportFilters,
    setReportFilters: (filters) => setExpenseState(prev => ({ ...prev, reportFilters: filters })),
    setExpenseReports: updateExpenseReports,
    loadExpenseData,
  };
}