import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";
import ApprovalFilters from "./components/ApprovalFilters";
import ApprovalTable from "./components/ApprovalTable";
import useApprovalList from "./hooks/useApprovalList";

const PAGE_SIZE = 50;

const ApprovalList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading: contextLoading,
  } = useExpenseAudit();

  const {
    filteredExpenses,
    people,
    searchTerm,
    viewMode,
    selectedPerson,
    startDate,
    endDate,
    confirmDialog,
    loading,
    approvalEligibility,
    setSearchTerm,
    setViewMode,
    setSelectedPerson,
    setStartDate,
    setEndDate,
    setConfirmDialog,
    handleApprove,
    handleReject,
    handleConfirmAction,
    canViewApprovals,
  } = useApprovalList();

  const [currentPage, setCurrentPage] = useState(1);

  // Calculate paginated expenses
  const paginatedExpenses = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredExpenses.slice(start, end);
  }, [filteredExpenses, currentPage]);

  // Calculate total pages
  const totalPages = React.useMemo(() => {
    return Math.ceil(filteredExpenses.length / PAGE_SIZE);
  }, [filteredExpenses]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedPerson, viewMode]);

  const handleRowClick = (expense) => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(expense.id), {
      state: { from: location, preserveFilters: true },
    });
  };

  if (!canViewApprovals()) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No tienes permisos para ver las aprobaciones
            </h3>
            <p className="text-sm text-gray-500">
              Contacta al administrador si necesitas acceso
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Aprobaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredExpenses.length} gastos{" "}
            {viewMode === "all"
              ? "en el sistema"
              : viewMode === "pending"
                ? "pendientes de aprobación"
                : viewMode === "approved"
                  ? "aprobados"
                  : "rechazados"}
          </p>
        </div>

        {/* Filters */}
        <ApprovalFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedPerson={selectedPerson}
          setSelectedPerson={setSelectedPerson}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          people={people}
          today={new Date()}
        />

        {/* Table */}
        <Card>
          <ApprovalTable
            expenses={paginatedExpenses}
            loading={loading || contextLoading}
            onRowClick={handleRowClick}
            handleApprove={handleApprove}
            handleReject={handleReject}
            viewMode={viewMode}
            approvalEligibility={approvalEligibility}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {viewMode === "all"
                    ? "No hay gastos en el sistema"
                    : viewMode === "pending"
                      ? "No hay gastos pendientes"
                      : viewMode === "approved"
                        ? "No hay gastos aprobados"
                        : "No hay gastos rechazados"}
                </h3>
                <p className="text-sm text-gray-500">
                  {viewMode === "all"
                    ? "No se encontraron registros con los filtros aplicados"
                    : viewMode === "pending"
                      ? "Todos los gastos han sido procesados"
                      : viewMode === "approved"
                        ? "Aún no hay gastos aprobados"
                        : "Aún no hay gastos rechazados"}
                </p>
              </div>
            }
          />

          {/* Pagination */}
          {filteredExpenses.length > PAGE_SIZE && (
            <div className="flex justify-between items-center mt-4 p-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {Math.min(filteredExpenses.length, (currentPage - 1) * PAGE_SIZE + 1)}-
                {Math.min(filteredExpenses.length, currentPage * PAGE_SIZE)} de {filteredExpenses.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm mx-2">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </>
  );
};

export default ApprovalList;