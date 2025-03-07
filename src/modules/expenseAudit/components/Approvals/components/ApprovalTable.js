// components/Approvals/components/ApprovalTable.js
import React, { memo } from 'react';
import Table from '../../../../../components/common/Table';
import { Check, X, Eye } from 'lucide-react';
import { VIEW_MODES } from '../constants';
import ExpenseStatusBadge from '../../common/ExpenseStatusBadge';

// Extracted action buttons component
const ActionButtons = memo(({ row, handleRowClick, handleApprove, handleReject, canApprove }) => (
  <div className="flex items-center gap-2">
    <button
      className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100"
      onClick={(e) => {
        e.stopPropagation();
        handleRowClick(row);
      }}
      aria-label="Ver detalle"
    >
      <Eye size={16} />
    </button>
    {canApprove && (
      <>
        <button
          className="text-success hover:text-success/90 p-1 rounded-lg hover:bg-success/10"
          onClick={(e) => handleApprove(row.id, e)}
          aria-label="Aprobar"
        >
          <Check size={16} />
        </button>
        <button
          className="text-error hover:text-error/90 p-1 rounded-lg hover:bg-error/10"
          onClick={(e) => handleReject(row.id, e)}
          aria-label="Rechazar"
        >
          <X size={16} />
        </button>
      </>
    )}
  </div>
));

const ApprovalTable = ({
  expenses,
  loading,
  onRowClick,
  handleApprove,
  handleReject,
  viewMode,
  approvalEligibility,
  emptyMessage,
  // Add pagination props
  paginated = false,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  totalItems
}) => {
  // Define table columns with responsive considerations
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
      hiddenOnMobile: false, // Always show
    },
    {
      key: "createdBy",
      header: "Solicitante",
      render: (value) => value?.name || "N/A",
      hiddenOnMobile: false, // Always show
    },
    { 
      key: "rubro", 
      header: "Rubro",
      hiddenOnMobile: false, // Always show
    },
    {
      key: "monto",
      header: "Monto",
      render: (value) =>
        value.toLocaleString("es-CR", {
          style: "currency",
          currency: "CRC",
        }),
      hiddenOnMobile: false, // Show on mobile
    },
    { 
      key: "st", 
      header: "ST",
      hiddenOnMobile: true, // Hide on mobile
    },
    {
      key: "fondosPropios",
      header: "F. Propios",
      render: (value) => value ? "Si" : "No",
      hiddenOnMobile: true, // Hide on mobile
    },
    {
      key: "status",
      header: "Estado",
      render: (_, row) => <ExpenseStatusBadge expense={row} />,
      hiddenOnMobile: false, // Always show
    },
    {
      key: "actions",
      header: "Acciones",
      render: (_, row) => (
        <ActionButtons
          row={row}
          handleRowClick={onRowClick}
          handleApprove={handleApprove}
          handleReject={handleReject}
          canApprove={viewMode === VIEW_MODES.PENDING && approvalEligibility[row.id]}
        />
      ),
      hiddenOnMobile: false, // Always show
    },
  ];

  return (
    <Table
      columns={columns}
      data={expenses}
      isLoading={loading}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage || (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No hay gastos para mostrar
          </h3>
          <p className="text-sm text-gray-500">
            Intenta ajustar los filtros para ver más resultados
          </p>
        </div>
      )}
      className="w-full" // Ensure table takes full width
      responsive={true} // Enable responsive mode
      // Add pagination props
      paginated={paginated}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      onItemsPerPageChange={onItemsPerPageChange}
    />
  );
};

export default memo(ApprovalTable);