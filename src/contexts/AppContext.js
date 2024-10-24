import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import GraphService from "../services/GraphService";

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const { instance, accounts } = useMsal();
  const [graphService, setGraphService] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [expenseReports, setExpenseReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [periodReports, setPeriodReports] = useState([]);
  const [departmentWorkers, setDepartmentWorkers] = useState([]);
  const [userDepartmentRole, setUserDepartmentRole] = useState(null);
  const [periodUserReports, setPeriodUserReports] = useState([]);

  useEffect(() => {
    const newGraphService = new GraphService(instance);
    setGraphService(newGraphService);
  }, [instance, accounts]);

  useEffect(() => {
    async function fetchData() {
      if (!graphService || accounts.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const [periodsData, expenseReportsData, departmentsData, rolesData] = await Promise.all([
          graphService.getPeriods(),
          graphService.getExpenseReports(),
          graphService.getDepartments(),
          graphService.getRoles()
        ]);

        setPeriods(periodsData);
        setExpenseReports(expenseReportsData);
        setDepartments(departmentsData);
        setRoles(rolesData);

        const mappedPeriodReports = graphService.mapPeriodReports(periodsData, expenseReportsData);
        const mappedDepartmentWorkers = graphService.mapDepartmentWorkers(departmentsData, rolesData);
        const mappedPeriodUserReports = graphService.createPeriodUserReportsMapping(periodsData, expenseReportsData, rolesData);

        const currentUserEmail = accounts[0]?.username;
        const userDeptRole = graphService.getUserDepartmentRole(currentUserEmail, departmentsData, rolesData);

        setPeriodReports(mappedPeriodReports);
        setDepartmentWorkers(mappedDepartmentWorkers);
        setUserDepartmentRole(userDeptRole);
        setPeriodUserReports(mappedPeriodUserReports);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(`An error occurred while fetching data: ${error.message}`);
        setLoading(false);
      }
    }

    if (graphService) {
      fetchData();
    }
  }, [graphService, accounts]);

  const getCurrentUserReports = () => {
    if (!accounts[0]?.username || !expenseReports) return [];
    return graphService.filterReportsByEmail(expenseReports, accounts[0].username);
  };

  const value = {
    graphService,
    periods,
    expenseReports,
    departments,
    roles,
    loading,
    error,
    
    periodReports,
    departmentWorkers,
    userDepartmentRole,
    periodUserReports,
    
    getCurrentUserReports,
    
    currentUser: accounts[0]?.username
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}