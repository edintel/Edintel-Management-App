import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import Card from "../../../../components/common/Card";
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";
import ApprovalFilters from "./components/ApprovalFilters";
import ApprovalTable from "./components/ApprovalTable";
import useApprovalList from "./hooks/useApprovalList";
import { CheckCircle } from "lucide-react";

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
    bulkApprovalProgress,
    setSearchTerm,
    setViewMode,
    setSelectedPerson,
    setStartDate,
    setEndDate,
    setConfirmDialog,
    handleApprove,
    handleReject,
    handleApproveAll,
    handleConfirmAction,
    canViewApprovals,
  } = useApprovalList();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedPerson, viewMode]);

  const handleRowClick = (expense) => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(expense.id), {
      state: { from: location, preserveFilters: true },
    });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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
        <div className="mb-6 flex items-center justify-between">
          <div>
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

          {/* Botón Aprobar Todas - Solo visible en modo pendiente */}
          {viewMode === "pending" && filteredExpenses.filter(e => approvalEligibility[e.id]).length > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={bulkApprovalProgress.isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {bulkApprovalProgress.isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Aprobando ({bulkApprovalProgress.completed}/{bulkApprovalProgress.total})
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Aprobar Todas ({filteredExpenses.filter(e => approvalEligibility[e.id]).length})
                </>
              )}
            </button>
          )}
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

        {/* Table with built-in pagination */}
        <Card>
          <ApprovalTable
            expenses={filteredExpenses}
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
            // Pagination props
            paginated={true}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => {
          if (!bulkApprovalProgress.isProcessing) {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
          }
        }}
        onConfirm={handleConfirmAction}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </>
  );
};

export default ApprovalList;