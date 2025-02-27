import { useState, useMemo, useCallback } from 'react';
import { useExpenseAudit } from '../../../context/expenseAuditContext';

export const useReportList = () => {
  const { expenseReports, loading, departmentWorkers } = useExpenseAudit();
  
  // Selection state
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateRange: { startDate: null, endDate: null },
    selectedPerson: '',
    selectedStatuses: []
  });

  // Handle selection of all expenses
  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedExpenses(filteredExpenses.map(expense => expense.id));
    } else {
      setSelectedExpenses([]);
    }
  }, [filteredExpenses]);

  // Handle selection of a single expense
  const handleSelectExpense = useCallback((expenseId, isSelected) => {
    setSelectedExpenses(prev => {
      if (isSelected) {
        return [...prev, expenseId];
      } else {
        return prev.filter(id => id !== expenseId);
      }
    });
  }, []);

  // Determine if all expenses are selected
  const areAllSelected = useMemo(() => {
    return filteredExpenses.length > 0 && selectedExpenses.length === filteredExpenses.length;
  }, [filteredExpenses, selectedExpenses]);

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return expenseReports.filter((expense) => {
      // Date range filter
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        const expenseDate = new Date(expense.fecha.toISOString().split('T')[0]);
        const startDate = new Date(filters.dateRange.startDate);
        const endDate = new Date(filters.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Include end date fully
        
        if (!(expenseDate >= startDate && expenseDate <= endDate)) {
          return false;
        }
      }
      
      // Person filter
      if (filters.selectedPerson && expense.createdBy.email !== filters.selectedPerson) {
        return false;
      }
      
      // Status filter
      if (filters.selectedStatuses.length > 0) {
        const status = getExpenseStatus(expense);
        if (!filters.selectedStatuses.includes(status)) {
          return false;
        }
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        return (
          expense.rubro.toLowerCase().includes(search) ||
          expense.st.toLowerCase().includes(search) ||
          expense.createdBy.name.toLowerCase().includes(search) ||
          expense.id.toString().includes(search)
        );
      }
      
      return true;
    });
  }, [expenseReports, filters]);

  // Get people for filters (all employees)
  const people = useMemo(() => {
    return departmentWorkers.reduce((acc, dept) => {
      dept.workers.forEach((worker) => {
        if (
          worker.empleado &&
          !acc.some((p) => p.email === worker.empleado.email)
        ) {
          acc.push(worker.empleado);
        }
      });
      return acc;
    }, []).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [departmentWorkers]);

  // Helper function to get expense status
  const getExpenseStatus = (expense) => {
    if (
      expense.aprobacionAsistente === "No aprobada" ||
      expense.aprobacionJefatura === "No aprobada" ||
      expense.aprobacionContabilidad === "No aprobada"
    ) {
      return "No aprobada";
    }
    if (expense.aprobacionContabilidad === "Aprobada") {
      return "Aprobada por Contabilidad";
    }
    if (
      expense.aprobacionJefatura === "Aprobada" &&
      expense.aprobacionContabilidad === "Pendiente"
    ) {
      return "Aprobada por Jefatura";
    }
    if (
      expense.aprobacionAsistente === "Aprobada" &&
      expense.aprobacionJefatura === "Pendiente"
    ) {
      return "Aprobada por Asistente";
    }
    return "Pendiente";
  };

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      dateRange: { startDate: null, endDate: null },
      selectedPerson: '',
      selectedStatuses: []
    });
  }, []);

  // Utility functions for export/print
  const getSelectedExpensesData = useCallback(() => {
    return selectedExpenses.length > 0
      ? filteredExpenses.filter(expense => selectedExpenses.includes(expense.id))
      : filteredExpenses;
  }, [filteredExpenses, selectedExpenses]);

  return {
    // Data
    filteredExpenses,
    people,
    selectedExpenses,
    areAllSelected,
    
    // State
    filters,
    loading,
    
    // Actions
    setFilters,
    handleSelectAll,
    handleSelectExpense,
    resetFilters,
    getSelectedExpensesData
  };
};

export default useReportList;