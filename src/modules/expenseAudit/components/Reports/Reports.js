import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import Card from "../../../../components/common/Card";
import Table from "../../../../components/common/Table";
import Button from "../../../../components/common/Button";
import DateRangePicker from "../../../../components/common/DateRangePicker";
import ExpenseSummary from "./ExpenseSummary";
import PrintSummary from "./PrintSummary";
import { Filter, Search, Users, FileDown, Printer, Copy, XCircle, X, Check } from "lucide-react";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";

const Reports = () => {
  const { expenseReports, departmentWorkers, loading, reportFilters, setReportFilters } = useExpenseAudit();
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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
    {
      key: "createdBy",
      header: "Solicitante",
      render: (value) => value?.name || "N/A",
    },
    { key: "rubro", header: "Rubro" },
    {
      key: "monto",
      header: "Monto",
      render: (value) =>
        value.toLocaleString("es-CR", {
          style: "currency",
          currency: "CRC",
        }),
    },
    { key: "st", header: "ST" },
    {
      key: "fondosPropios", header: "F. Propios", render: (value) => {
        if (value) {
          return "Si";
        } else {
          return "No";
        }
      }
    },
    {
      key: "status",
      header: "Estado",
      render: (_, row) => {
        if (
          row.aprobacionAsistente === "No aprobada" ||
          row.aprobacionJefatura === "No aprobada" ||
          row.aprobacionContabilidad === "No aprobada"
        ) {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
              No aprobada
            </span>
          );
        }
        if (row.aprobacionContabilidad === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
              Aprobado
            </span>
          );
        }
        if (
          row.aprobacionJefatura === "Aprobada" &&
          row.aprobacionContabilidad === "Pendiente"
        ) {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
              En Contabilidad
            </span>
          );
        }
        if (
          row.aprobacionAsistente === "Aprobada" &&
          row.aprobacionJefatura === "Pendiente"
        ) {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
              En Jefatura
            </span>
          );
        }
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            Pendiente
          </span>
        );
      },
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isStatusOpen && !event.target.closest('.status-dropdown')) {
        setIsStatusOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStatusOpen]);

  const getSelectedStatusDisplay = () => {
    if (selectedStatuses.length === 0) return "Todos los estados";
    if (selectedStatuses.length === 1) return selectedStatuses[0];
    return `${selectedStatuses.length} estados seleccionados`;
  };

  useEffect(() => {
    if (location.state?.preserveFilters && Filter) {
      setSearchTerm(reportFilters.searchTerm || "");
      setDateRange({
        startDate: reportFilters.startDate || null,
        endDate: reportFilters.endDate || null
      });
      setSelectedPerson(reportFilters.selectedPerson || "");
      setSelectedStatuses(reportFilters.selectedStatuses || []);
    }
  }, [location.state?.preserveFilters, reportFilters]);
  
  // Add filter saving effect:
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setReportFilters({
          searchTerm,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          selectedPerson,
          selectedStatuses
      });
    }, 300);
  
    return () => clearTimeout(timeoutId);
  }, [searchTerm, dateRange, selectedPerson, selectedStatuses, setReportFilters]);

  const handleRowClick = (expense) => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(expense.id), {
      state: { from: location },
    });
  };

  const handleStatusToggle = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

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
  };

  const filteredExpenses = expenseReports.filter((expense) => {
    // Date range filter
    if (dateRange.startDate && dateRange.endDate) {
      const expenseDate = new Date(expense.fecha.toISOString().split("T")[0]);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      if (!(expenseDate >= startDate && expenseDate <= endDate)) return false;
    }

    if (selectedPerson && expense.createdBy.email !== selectedPerson)
      return false;

    if (selectedStatuses.length > 0) {
      const status = getExpenseStatus(expense);
      if (!selectedStatuses.includes(status)) return false;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        expense.rubro.toLowerCase().includes(search) ||
        expense.st.toLowerCase().includes(search) ||
        expense.createdBy.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const people = (departmentWorkers.reduce((acc, dept) => {
    dept.workers.forEach((worker) => {
      if (
        worker.empleado &&
        !acc.some((p) => p.email === worker.empleado.email)
      ) {
        acc.push(worker.empleado);
      }
    });
    return acc;
  }, [])).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );;

  const resetFilters = () => {
    setDateRange({ startDate: null, endDate: null });
    setSelectedPerson("");
    setSelectedStatuses([]);
    setSearchTerm("");
  };

  const handleCopyTable = () => {
    const rows = filteredExpenses.map((expense) => ({
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
  };

  const handleExportCSV = () => {
    const rows = filteredExpenses.map((expense) => ({
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
      dateRange.startDate && dateRange.endDate
        ? `reporte_gastos_${dateRange.startDate}_${dateRange.endDate}.csv`
        : "reporte_gastos.csv";
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getDateRangeLabel = () => {
    if (!dateRange.startDate || !dateRange.endDate) return "Todos los gastos";
    return `Gastos del ${new Date(
      dateRange.startDate
    ).toLocaleDateString()} al ${new Date(
      dateRange.endDate
    ).toLocaleDateString()}`;
  };

  return (
    <>
      {/* Print Summary - Hidden during normal view, shown only when printing */}
      <PrintSummary
        expenses={filteredExpenses}
        dateRange={dateRange}
        selectedPerson={selectedPerson}
        people={people}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
            <p className="text-sm text-gray-500 mt-1">
              {getDateRangeLabel()} • {filteredExpenses.length} gastos
              encontrados
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

        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 p-4">
            <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar por rubro, ST o solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-sm"
              />
            </div>

            <div className="flex-1">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onStartDateChange={(date) =>
                  setDateRange((prev) => ({ ...prev, startDate: date }))
                }
                onEndDateChange={(date) =>
                  setDateRange((prev) => ({ ...prev, endDate: date }))
                }
                className="w-full"
              />
            </div>

            <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
              <Users size={16} className="text-gray-400 mr-2" />
              <select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-sm"
              >
                <option value="">Todos los solicitantes</option>
                {people.map((person) => (
                  <option key={person.id} value={person.email}>
                    {person.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 relative status-dropdown">
              <div className="flex-1 relative">
                <div
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 cursor-pointer"
                >
                  <div className="flex items-center">
                    <Filter size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm truncate">
                      {getSelectedStatusDisplay()}
                    </span>
                  </div>
                  <X
                    size={16}
                    className={`transform transition-transform ${isStatusOpen ? "rotate-45" : "rotate-0"
                      }`}
                  />
                </div>

                {isStatusOpen && (
                  <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border max-h-64 overflow-y-auto">
                    {[
                      "Aprobada por Asistente",
                      "Aprobada por Jefatura",
                      "Aprobada por Contabilidad",
                      "No aprobada"
                    ].map((status) => (
                      <div
                        key={status}
                        onClick={() => handleStatusToggle(status)}
                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="text-sm font-medium">{status}</span>
                        {selectedStatuses.includes(status) && (
                          <Check size={16} className="text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="small"
              startIcon={<XCircle size={16} />}
              onClick={resetFilters}
              className="md:self-center"
            >
              Limpiar filtros
            </Button>
          </div>
        </Card>

        <ExpenseSummary expenses={filteredExpenses} />

        <Card>
          <div className="print:shadow-none">
            <Table
              columns={columns}
              data={filteredExpenses}
              onRowClick={handleRowClick}
              isLoading={loading}
              emptyMessage={
                <div className="flex flex-col items-center justify-center py-12">
                  <FileDown size={48} className="text-gray-400 mb-4" />
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