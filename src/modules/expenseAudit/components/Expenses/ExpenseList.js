import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import { useAuth } from "../../../../components/AuthProvider";
import Card from "../../../../components/common/Card";
import Table from "../../../../components/common/Table";
import Button from "../../../../components/common/Button";
import DateRangePicker from "../../../../components/common/DateRangePicker";
import { Plus, Search, FileText } from "lucide-react";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";

const ExpenseList = () => {
  const today = new Date();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    expenseReports,
    loading,
    expenseListFilters,
    setExpenseListFilters
  } = useExpenseAudit();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Restore filters from state if navigating back
  useEffect(() => {
    if (location.state?.preserveFilters && expenseListFilters) {
      setSearchTerm(expenseListFilters.searchTerm || "");
      setStartDate(expenseListFilters.startDate || "");
      setEndDate(expenseListFilters.endDate || "");

      // Restore pagination state if available
      if (expenseListFilters.currentPage) {
        setCurrentPage(expenseListFilters.currentPage);
      }
      if (expenseListFilters.itemsPerPage) {
        setItemsPerPage(expenseListFilters.itemsPerPage);
      }
    }
  }, [location.state?.preserveFilters, expenseListFilters]);

  // Save filters to state when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setExpenseListFilters({
        searchTerm,
        startDate,
        endDate,
        currentPage,
        itemsPerPage
      });
    }, 300);
   

    return () => clearTimeout(timeoutId);
  }, [searchTerm, startDate, endDate, currentPage, itemsPerPage, setExpenseListFilters]);

  

  // Table columns configuration
  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (value) =>
        value.toLocaleDateString("es-CR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    { key: "rubro", header: "Rubro" },
    {
      key: "monto",
      header: "Monto",
      render: (value, row) => `${row.currencySymbol}${value}`

    },
    { key: "st", header: "ST" },
    {
      key: "status",
      header: "Estado",
      render: (_, row) => {
        // Check for rejection first
        if (row.aprobacionAsistente === "No aprobada" ||
          row.aprobacionJefatura === "No aprobada" ||
          row.aprobacionContabilidad === "No aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
              No aprobada
            </span>
          );
        }

        // Check for full approval
        if (row.aprobacionContabilidad === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
              Aprobado
            </span>
          );
        }

        // Check for partially approved statuses
        if (row.aprobacionJefatura === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
              En Contabilidad
            </span>
          );
        }

        if (row.aprobacionAsistente === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
              En Jefatura
            </span>
          );
        }

        // Default to pending
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            Pendiente
          </span>
        );
      },
    },
  ];

  // Filter expenses based on current filters
  const filterExpenses = useCallback(() => {
    return expenseReports
      .filter((expense) => expense.createdBy.email === user?.username)
      .filter((expense) => {
        // Date range filter
        if (startDate && endDate) {
          const expenseDate = expense.fecha.getTime();
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // Include full end date
          if (expenseDate < start || expenseDate > end) return false;
        }

        // Search term filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            expense.rubro.toLowerCase().includes(search) ||
            expense.st.toLowerCase().includes(search)
          );
        }

        return true;
      });
  }, [expenseReports, user?.username, startDate, endDate, searchTerm]);

  const filteredExpenses = filterExpenses();

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredExpenses.length} gastos encontrados
          </p>
        </div>
        <Button
          variant="primary"
          startIcon={<Plus size={16} />}
          onClick={() => navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.NEW)}
        >
          Nuevo Gasto
        </Button>
      </div>
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar por rubro o ST..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when search changes
              }}
              className="w-full bg-transparent border-none focus:outline-none text-sm"
            />
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => {
              setStartDate(date);
              setCurrentPage(1); // Reset to first page when date changes
            }}
            onEndDateChange={(date) => {
              setEndDate(date);
              setCurrentPage(1); // Reset to first page when date changes
            }}
            maxDate={today.toISOString().split("T")[0]}
            className="flex-1"
          />
        </div>
      </Card>
      <Card>
        <Table
          columns={columns}
          data={filteredExpenses}
          isLoading={loading}
          onRowClick={(expense) =>
            navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(expense.id), {
              state: { preserveFilters: true }
            })
          }
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12">
              <FileText size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No se encontraron gastos
              </h3>
              <p className="text-sm text-gray-500">
                Intenta ajustar los filtros o crea un nuevo gasto
              </p>
            </div>
          }
          // Enable pagination
          paginated={true}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          responsive={true}
        />
      </Card>
    </div>
  );
};

export default ExpenseList;