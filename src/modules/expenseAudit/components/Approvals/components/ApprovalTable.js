import React, { memo } from 'react';
import Table from '../../../../../components/common/Table';
import { Check, X, Eye } from 'lucide-react';
import { VIEW_MODES } from '../constants';

// Memo-ized row action buttons component to prevent unnecessary re-renders
const ActionButtons = memo(({ row, handleRowClick, handleApprove, handleReject, canApprove }) => (
  <div className="flex items-center gap-2">
    <button
      className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100"
      onClick={(e) => {
        e.stopPropagation();
        handleRowClick(row);
      }}
    >
      <Eye size={16} />
    </button>
    
    {canApprove && (
      <>
        <button
          className="text-success hover:text-success/90 p-1 rounded-lg hover:bg-success/10"
          onClick={(e) => handleApprove(row.id, e)}
        >
          <Check size={16} />
        </button>
        <button
          className="text-error hover:text-error/90 p-1 rounded-lg hover:bg-error/10"
          onClick={(e) => handleReject(row.id, e)}
        >
          <X size={16} />
        </button>
      </>
    )}
  </div>
));

// Memo-ized status badge component
const StatusBadge = memo(({ row }) => {
  if (row.aprobacionAsistente === "No aprobada" ||
      row.aprobacionJefatura === "No aprobada" ||
      row.aprobacionContabilidad === "No aprobada") {
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
});

// Main table component
const ApprovalTable = ({
  expenses,
  loading,
  onRowClick,
  handleApprove,
  handleReject,
  viewMode,
  approvalEligibility,
  emptyMessage
}) => {
  // Define table columns with optimized rendering
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
      key: "fondosPropios",
      header: "F. Propios",
      render: (value) => value ? "Si" : "No"
    },
    {
      key: "status",
      header: "Estado",
      render: (_, row) => <StatusBadge row={row} />
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
    },
  ];

  // Default empty message based on current view mode
  const getDefaultEmptyMessage = () => {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Check size={48} className="text-success mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          {viewMode === VIEW_MODES.PENDING
            ? "No hay gastos pendientes"
            : viewMode === VIEW_MODES.APPROVED
              ? "No hay gastos aprobados"
              : "No hay gastos rechazados"}
        </h3>
        <p className="text-sm text-gray-500">
          {viewMode === VIEW_MODES.PENDING
            ? "Todos los gastos han sido procesados"
            : viewMode === VIEW_MODES.APPROVED
              ? "Aún no hay gastos aprobados"
              : "Aún no hay gastos rechazados"}
        </p>
      </div>
    );
  };

  return (
    <Table
      columns={columns}
      data={expenses}
      isLoading={loading}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage || getDefaultEmptyMessage()}
    />
  );
};

// Memo-ize the whole component for extra performance
export default memo(ApprovalTable);