import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Copy, FileDown, Printer, FileText } from "lucide-react";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import SelectionToolbar from "../../../../components/common/SelectionToolbar";
import ReportTable from "./components/ReportTable";
import ReportFilters from "./components/ReportFilters";
import PrintSummary from "./components/PrintSummary";
import ExpenseSummary from "./ExpenseSummary";
import "./Reports.css";
import { getExpenseStatus } from "./constants";

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    expenseReports, 
    loading, 
    departmentWorkers, 
    reportFilters, 
    setReportFilters 
  } = useExpenseAudit();
  
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Restore filters when navigating back
  useEffect(() => {
    if (location.state?.preserveFilters && reportFilters) {
      setSearchTerm(reportFilters.searchTerm || '');
      setStartDate(reportFilters.startDate || '');
      setEndDate(reportFilters.endDate || '');
      setSelectedPerson(reportFilters.selectedPerson || '');
      setSelectedStatuses(reportFilters.selectedStatuses || []);
      
      if (reportFilters.currentPage) {
        setCurrentPage(reportFilters.currentPage);
      }
      if (reportFilters.itemsPerPage) {
        setItemsPerPage(reportFilters.itemsPerPage);
      }
    }
  }, [location.state?.preserveFilters, reportFilters]);

  // Save filters to context when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setReportFilters({
        searchTerm,
        startDate,
        endDate,
        selectedPerson,
        selectedStatuses,
        currentPage,
        itemsPerPage
      });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, startDate, endDate, selectedPerson, selectedStatuses, currentPage, itemsPerPage, setReportFilters]);

  // Memoize filtered expenses - this is the main performance optimization
  const filteredExpenses = useMemo(() => {
    setSelectedExpenses([]);
    const result = expenseReports.filter((expense) => {
      if (startDate && endDate) {
        const expenseDate = expense.fecha.getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
        if (expenseDate < start || expenseDate > end) return false;
      }
      if (selectedPerson && expense.createdBy.email !== selectedPerson) {
        return false;
      }
      if (selectedStatuses.length > 0) {
        const status = getExpenseStatus(expense);
        if (!selectedStatuses.includes(status)) {
          return false;
        }
      }
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          expense.rubro.toLowerCase().includes(search) ||
          expense.st.toLowerCase().includes(search) ||
          expense.createdBy.name.toLowerCase().includes(search) ||
          expense.id.toString().includes(search)
        );
      }
      return true;
    });
    return result;
  }, [expenseReports, searchTerm, startDate, endDate, selectedPerson, selectedStatuses]);

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

  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      // We need to select only visible items (current page)
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const visibleExpenses = filteredExpenses.slice(start, end);
      setSelectedExpenses(visibleExpenses.map(expense => expense.id));
    } else {
      setSelectedExpenses([]);
    }
  }, [filteredExpenses, currentPage, itemsPerPage]);

  const handleSelectExpense = useCallback((expenseId, isSelected) => {
    setSelectedExpenses(prev => {
      if (isSelected) {
        return [...prev, expenseId];
      } else {
        return prev.filter(id => id !== expenseId);
      }
    });
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  const handleStartDateChange = useCallback((date) => {
    setStartDate(date);
    setCurrentPage(1); // Reset to first page when date changes
  }, []);

  const handleEndDateChange = useCallback((date) => {
    setEndDate(date);
    setCurrentPage(1); // Reset to first page when date changes
  }, []);

  const handlePersonChange = useCallback((person) => {
    setSelectedPerson(person);
    setCurrentPage(1); // Reset to first page when person changes
  }, []);

  const handleStatusesChange = useCallback((statuses) => {
    setSelectedStatuses(statuses);
    setCurrentPage(1); // Reset to first page when statuses change
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedPerson('');
    setSelectedStatuses([]);
    setCurrentPage(1); // Reset to first page when filters are reset
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const areAllSelected = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const visibleExpenses = filteredExpenses.slice(start, end);
    
    return visibleExpenses.length > 0 && 
      visibleExpenses.every(expense => selectedExpenses.includes(expense.id));
  }, [filteredExpenses, selectedExpenses, currentPage, itemsPerPage]);

  const getExpensesForExport = useCallback(() => {
    return selectedExpenses.length > 0
      ? filteredExpenses.filter(expense => selectedExpenses.includes(expense.id))
      : filteredExpenses;
  }, [selectedExpenses, filteredExpenses]);

  const handleRowClick = useCallback((expense) => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(expense.id), {
      state: { 
        from: location,
        preserveFilters: true // Add this flag to preserve filters
      },
    });
  }, [navigate, location]);

  const handleCopyTable = useCallback(() => {
    const rows = getExpensesForExport().map((expense) => ({
      Fecha: expense.fecha.toLocaleDateString("es-CR"),
      Solicitante: expense.createdBy.name,
      Rubro: expense.rubro,
      Monto: expense.monto.toLocaleString("es-CR", {
        style: "currency",
        currency: "CRC",
      }),
      ST: expense.st,
      Estado: getExpenseStatus(expense),
    }));
    const headers = ["Fecha", "Solicitante", "Rubro", "Monto", "ST", "Estado"];
    const csv = [
      headers.join("\t"),
      ...rows.map((row) => headers.map((header) => row[header]).join("\t")),
    ].join("\n");
    navigator.clipboard.writeText(csv);
  }, [getExpensesForExport]);

  const handleExportCSV = useCallback(() => {
    const rows = getExpensesForExport().map((expense) => ({
      Fecha: expense.fecha.toLocaleDateString("es-CR"),
      Solicitante: expense.createdBy.name,
      Rubro: expense.rubro,
      Monto: expense.monto,
      ST: expense.st,
      Estado: getExpenseStatus(expense),
    }));
    const headers = ["Fecha", "Solicitante", "Rubro", "Monto", "ST", "Estado"];
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const filename =
      startDate && endDate
        ? `reporte_gastos_${startDate}_${endDate}.csv`
        : "reporte_gastos.csv";
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [startDate, endDate, getExpensesForExport]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const getDateRangeLabel = () => {
    if (!startDate || !endDate) return "Todos los gastos";
    return `Gastos del ${new Date(startDate).toLocaleDateString()} al ${new Date(endDate).toLocaleDateString()}`;
  };

  return (
    <>
      {/* Print view (hidden from normal view) */}
      <PrintSummary
        expenses={getExpensesForExport()}
        dateRange={{ startDate, endDate }}
        selectedPerson={selectedPerson}
        people={people}
        title={selectedExpenses.length > 0 ?
          `Reporte de Gastos (${selectedExpenses.length} seleccionados)` :
          "Reporte de Gastos"}
      />

      {/* Selection toolbar for bulk actions */}
      <SelectionToolbar
        selectedCount={selectedExpenses.length}
        onClearSelection={() => setSelectedExpenses([])}
        actions={[
          {
            label: "Imprimir selección",
            icon: <Printer size={16} />,
            onClick: handlePrint,
            variant: "default"
          },
          {
            label: "Exportar selección",
            icon: <FileDown size={16} />,
            onClick: handleExportCSV,
            variant: "default"
          }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
            <p className="text-sm text-gray-500 mt-1">
              {getDateRangeLabel()} • {filteredExpenses.length} gastos encontrados
              {selectedExpenses.length > 0 && ` (${selectedExpenses.length} seleccionados)`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="small"
              startIcon={<Copy size={16} />}
              onClick={handleCopyTable}
            >
              Copiar
            </Button>
            <Button
              variant="outline"
              size="small"
              startIcon={<FileDown size={16} />}
              onClick={handleExportCSV}
            >
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="small"
              startIcon={<Printer size={16} />}
              onClick={handlePrint}
            >
              Imprimir
            </Button>
          </div>
        </div>

        {/* Filter controls */}
        <ReportFilters
          searchTerm={searchTerm}
          onSearchTermChange={handleSearchChange}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          selectedPerson={selectedPerson}
          onPersonChange={handlePersonChange}
          selectedStatuses={selectedStatuses}
          onStatusesChange={handleStatusesChange}
          people={people}
          onResetFilters={resetFilters}
        />

        {/* Data summary */}
        <ExpenseSummary expenses={getExpensesForExport()} />

        {/* Main data table with built-in pagination */}
        <Card>
          <div className="print:shadow-none">
            <ReportTable
              data={filteredExpenses}
              loading={loading}
              onRowClick={handleRowClick}
              selectedExpenses={selectedExpenses}
              onSelectAll={handleSelectAll}
              onSelectExpense={handleSelectExpense}
              areAllSelected={areAllSelected}
              emptyMessage={
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No se encontraron gastos
                  </h3>
                  <p className="text-sm text-gray-500">
                    Intenta ajustar los filtros para ver más resultados
                  </p>
                </div>
              }
              // Pagination props
              paginated={true}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </Card>
      </div>
    </>
  );
};

export default Reports;