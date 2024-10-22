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

  useEffect(() => {
    const newGraphService = new GraphService(instance);
    setGraphService(newGraphService);
  }, [instance, accounts]);

  useEffect(() => {
    async function fetchData() {
      if (!graphService) return;
      if (accounts.length === 0) {
        console.log("No accounts found, skipping data fetch");
        setLoading(false);
        return;
      }

      try {
        const periodsData = await graphService.getPeriods();
        setPeriods(periodsData);

        const expenseReportsData = await graphService.getExpenseReports();
        console.log("Expense report data:", expenseReportsData);
        setExpenseReports(expenseReportsData);
        const departmentsData = await graphService.getDepartments();
        console.log("Departments data:", departmentsData);
        setDepartments(departmentsData);
        const rolesData = await graphService.getRoles();
        console.log("Roles data:", rolesData);
        setRoles(rolesData);

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

  const value = {
    periods,
    expenseReports,
    departments,
    roles,
    loading,
    error,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
