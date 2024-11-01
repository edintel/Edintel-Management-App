import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExpenseAudit  } from "../../contexts/AppContext";
import { useAuth } from "../AuthProvider";
import Layout from "../layout/Layout";
import Card from "../common/Card";
import Table from "../common/Table";
import Button from "../common/Button";
import ConfirmationDialog from "../common/ConfirmationDialog";
import { Check, X, Eye, Filter, Search, Users } from "lucide-react";
import { useLocation } from "react-router-dom";

const ApprovalList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    expenseReports,
    periods,
    departmentWorkers,
    loading,
    setExpenseReports,
    graphService,
  } = useExpenseAudit();
  const { user } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("pending");

  // Add state for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "approve",
    title: "",
    message: "",
    expenseId: null,
  });

  const getApprovalType = () => {
    const userDept = user?.department?.toLowerCase() || "";
    if (userDept.includes("contabilidad")) return "accounting";
    return user?.role === "Jefe" ? "boss" : "assistant";
  };

  const handleApprove = (id, e) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      type: "approve",
      title: "¿Confirmar aprobación?",
      message: "¿Está seguro que desea aprobar este gasto?",
      expenseId: id,
    });
  };

  const handleReject = (id, e) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      type: "reject",
      title: "¿Confirmar rechazo?",
      message:
        "¿Está seguro que desea rechazar este gasto? Debe proporcionar una nota de revisión.",
      expenseId: id,
    });
  };

  const handleConfirmAction = async (notes = "") => {
    try {
      const type = getApprovalType();
      const status =
        confirmDialog.type === "approve" ? "Aprobada" : "No aprobada";

      await graphService.updateApprovalStatus(
        confirmDialog.expenseId,
        status,
        type,
        notes
      );

      // Update reports in context
      setExpenseReports((prevReports) =>
        prevReports.map((report) =>
          report.id === confirmDialog.expenseId
            ? {
                ...report,
                bloqueoEdicion: true,
                notasRevision: notes,
                aprobacionAsistente:
                  type === "assistant" ? status : report.aprobacionAsistente,
                aprobacionJefatura:
                  type === "boss" ? status : report.aprobacionJefatura,
                aprobacionContabilidad:
                  type === "accounting"
                    ? status
                    : report.aprobacionContabilidad,
              }
            : report
        )
      );

      // Close dialog
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Error updating approval status:", error);
      // You might want to show an error message to the user here
    }
  };

  const canApprove = (expense) => {
    if (!user || !expense || !graphService) return false;
    return graphService.canApprove(expense, user.role);
  };

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
      key: "status",
      header: "Estado",
      render: (_, row) => {
        if (row.aprobacionAsistente === "No aprobada") {
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
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            Pendiente
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Acciones",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="small"
            className="text-gray-600 hover:text-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row);
            }}
          >
            <Eye size={16} />
          </Button>
          {canApprove(row) && viewMode === "pending" && (
            <>
              <Button
                variant="ghost"
                size="small"
                className="text-success hover:text-success/90"
                onClick={(e) => handleApprove(row.id, e)}
              >
                <Check size={16} />
              </Button>
              <Button
                variant="ghost"
                size="small"
                className="text-error hover:text-error/90"
                onClick={(e) => handleReject(row.id, e)}
              >
                <X size={16} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleRowClick = (expense) => {
    navigate(`/expenses/${expense.id}`, {
      state: { from: location },
    });
  };

  const people = departmentWorkers.reduce((acc, dept) => {
    dept.workers.forEach((worker) => {
      if (
        worker.empleado &&
        !acc.some((p) => p.email === worker.empleado.email)
      ) {
        acc.push(worker.empleado);
      }
    });
    return acc;
  }, []);

  const filteredExpenses = expenseReports.filter((expense) => {
    if (selectedPeriod && expense.periodoId !== selectedPeriod) return false;

    if (selectedPerson && expense.createdBy.email !== selectedPerson)
      return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        expense.rubro.toLowerCase().includes(search) ||
        expense.st.toLowerCase().includes(search) ||
        expense.createdBy.name.toLowerCase().includes(search)
      );
    }
    const type = getApprovalType();
    switch (viewMode) {
      case "pending":
        return canApprove(expense);
      case "approved":
        return type === "assistant"
          ? expense.aprobacionAsistente === "Aprobada"
          : type === "boss"
          ? expense.aprobacionJefatura === "Aprobada"
          : expense.aprobacionContabilidad === "Aprobada";
      case "rejected":
        return type === "assistant"
          ? expense.aprobacionAsistente === "No aprobada"
          : type === "boss"
          ? expense.aprobacionJefatura === "No aprobada"
          : expense.aprobacionContabilidad === "No aprobada";
      default:
        return true;
    }
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Aprobaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredExpenses.length} gastos{" "}
            {viewMode === "pending"
              ? "pendientes de aprobación"
              : viewMode === "approved"
              ? "aprobados"
              : "rechazados"}
          </p>
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <div className="flex border-b border-gray-200">
              {["pending", "approved", "rejected"].map((mode) => (
                <button
                  key={mode}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    viewMode === mode
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "pending" && "Pendientes"}
                  {mode === "approved" && "Aprobados"}
                  {mode === "rejected" && "Rechazados"}
                </button>
              ))}
            </div>

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

              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
                <Filter size={16} className="text-gray-400 mr-2" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-sm"
                >
                  <option value="">Todos los periodos</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.periodo}
                    </option>
                  ))}
                </select>
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
            </div>
          </div>
        </Card>

        <Card>
          <Table
            columns={columns}
            data={filteredExpenses}
            isLoading={loading}
            onRowClick={handleRowClick}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-12">
                <Check size={48} className="text-success mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {viewMode === "pending"
                    ? "No hay gastos pendientes"
                    : viewMode === "approved"
                    ? "No hay gastos aprobados"
                    : "No hay gastos rechazados"}
                </h3>
                <p className="text-sm text-gray-500">
                  {viewMode === "pending"
                    ? "Todos los gastos han sido procesados"
                    : viewMode === "approved"
                    ? "Aún no hay gastos aprobados"
                    : "Aún no hay gastos rechazados"}
                </p>
              </div>
            }
          />
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </Layout>
  );
};

export default ApprovalList;
