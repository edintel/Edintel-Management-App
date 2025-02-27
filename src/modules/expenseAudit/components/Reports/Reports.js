import React, { useCallback } from "react";
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

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { expenseReports, loading, departmentWorkers } = useExpenseAudit();
  
  // State for filters and selection
  const [selectedExpenses, setSelectedExpenses] = React.useState([]);
  const [filters, setFilters] = React.useState({
    searchTerm: '',
    dateRange: { startDate: null, endDate: null },
    selectedPerson: '',
    selectedStatuses: []
  });

  // Filtered expenses based on current filters
  const filteredExpenses = React.useMemo(() => {
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
  const people = React.useMemo(() => {
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

  // Selection handlers
  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedExpenses(filteredExpenses.map(expense => expense.id));
    } else {
      setSelectedExpenses([]);
    }
  }, [filteredExpenses]);

  const handleSelectExpense = useCallback((expenseId, isSelected) => {
    setSelectedExpenses(prev => {
      if (isSelected) {
        return [...prev, expenseId];
      } else {
        return prev.filter(id => id !== expenseId);
      }
    });
  }, []);

  const areAllSelected = React.useMemo(() => {
    return filteredExpenses.length > 0 && selectedExpenses.length === filteredExpenses.length;
  }, [filteredExpenses, selectedExpenses]);

  // Filter handlers
  const handleSearchChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, []);

  const handleDateRangeChange = useCallback((range) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  }, []);

  const handlePersonChange = useCallback((person) => {
    setFilters(prev => ({ ...prev, selectedPerson: person }));
  }, []);

  const handleStatusesChange = useCallback((statuses) => {
    setFilters(prev => ({ ...prev, selectedStatuses: statuses }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      dateRange: { startDate: null, endDate: null },
      selectedPerson: '',
      selectedStatuses: []
    });
  }, []);

  // Navigation handler
  const handleRowClick = useCallback((expense) => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(expense.id), {
      state: { from: location },
    });
  }, [navigate, location]);

  // Action handlers
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
  }, [selectedExpenses, filteredExpenses]);

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
      filters.dateRange.startDate && filters.dateRange.endDate
        ? `reporte_gastos_${filters.dateRange.startDate}_${filters.dateRange.endDate}.csv`
        : "reporte_gastos.csv";
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [selectedExpenses, filteredExpenses, filters.dateRange]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Helper function for status
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

  // Get expenses for export/print - either selected or all filtered
  const getExpensesForExport = useCallback(() => {
    return selectedExpenses.length > 0
      ? filteredExpenses.filter(expense => selectedExpenses.includes(expense.id))
      : filteredExpenses;
  }, [selectedExpenses, filteredExpenses]);

  // Get date range label for display
  const getDateRangeLabel = () => {
    if (!filters.dateRange.startDate || !filters.dateRange.endDate) return "Todos los gastos";
    return `Gastos del ${new Date(
      filters.dateRange.startDate
    ).toLocaleDateString()} al ${new Date(
      filters.dateRange.endDate
    ).toLocaleDateString()}`;
  };

  return (
    <>
      {/* Print Component (hidden except when printing) */}
      <PrintSummary
        expenses={getExpensesForExport()}
        dateRange={filters.dateRange}
        selectedPerson={filters.selectedPerson}
        people={people}
        title={selectedExpenses.length > 0 ? 
          `Reporte de Gastos (${selectedExpenses.length} seleccionados)` : 
          "Reporte de Gastos"}
      />
      
      {/* Selection Toolbar */}
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
        
        {/* Filters */}
        <ReportFilters
          searchTerm={filters.searchTerm}
          onSearchTermChange={handleSearchChange}
          dateRange={filters.dateRange}
          onDateRangeChange={handleDateRangeChange}
          selectedPerson={filters.selectedPerson}
          onPersonChange={handlePersonChange}
          selectedStatuses={filters.selectedStatuses}
          onStatusesChange={handleStatusesChange}
          people={people}
          onResetFilters={resetFilters}
        />
        
        {/* Summary */}
        <ExpenseSummary expenses={getExpensesForExport()} />
        
        {/* Data Table */}
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
            />
          </div>
        </Card>
      </div>
    </>
  );
};

export default Reports;