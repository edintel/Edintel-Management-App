import { useState, useMemo, useCallback } from 'react';
import { useExpenseAudit } from '../../../context/expenseAuditContext';
import { getExpenseStatus } from '../constants';

export const useReportList = () => {
  const { expenseReports, loading, departmentWorkers } = useExpenseAudit();
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateRange: { startDate: null, endDate: null },
    selectedPerson: '',
    selectedStatuses: []
  });
  

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return expenseReports.filter((expense) => {
      // Date range filter
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        const expenseDate = expense.fecha.getTime();
        const start = new Date(filters.dateRange.startDate).getTime();
        const end = new Date(filters.dateRange.endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
        if (expenseDate < start || expenseDate > end) return false;
      }
      if (filters.selectedPerson && expense.createdBy.email !== filters.selectedPerson) {
        return false;
      }
      if (filters.selectedStatuses.length > 0) {
        const status = getExpenseStatus(expense);
        if (!filters.selectedStatuses.includes(status)) {
          return false;
        }
      }
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

  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      dateRange: { startDate: null, endDate: null },
      selectedPerson: '',
      selectedStatuses: []
    });
  }, []);

  const getSelectedExpensesData = useCallback(() => {
    return selectedExpenses.length > 0
      ? filteredExpenses.filter(expense => selectedExpenses.includes(expense.id))
      : filteredExpenses;
  }, [filteredExpenses, selectedExpenses]);

  return {
    filteredExpenses,
    people,
    selectedExpenses,
    areAllSelected,
    filters,
    loading,
    setFilters,
    handleSelectAll,
    handleSelectExpense,
    resetFilters,
    getSelectedExpensesData,
    getExpenseStatus
  };
};

export default useReportList;