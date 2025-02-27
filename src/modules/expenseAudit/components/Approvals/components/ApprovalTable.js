import React from 'react';
import Table from '../../../../../components/common/Table';
import { Check } from 'lucide-react';
import { TABLE_COLUMNS } from '../constants';

const ApprovalTable = ({
  expenses,
  loading,
  onRowClick,
  handleApprove,
  handleReject,
  viewMode,
  approvalFlowService,
  service,
  emptyMessage
}) => {
  // This creates a modified copy of columns with handlers injected
  const columnsWithHandlers = TABLE_COLUMNS.map(column => {
    if (column.key === 'actions') {
      return {
        ...column,
        render: (_, row) => column.render(_, row, {
          handleApprove,
          handleReject,
          handleRowClick: onRowClick,
          viewMode,
          approvalFlowService,
          service
        })
      };
    }
    return column;
  });

  // Default empty state based on view mode
  const getDefaultEmptyMessage = () => {
    return (
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
    );
  };

  return (
    <Table
      columns={columnsWithHandlers}
      data={expenses}
      isLoading={loading}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage || getDefaultEmptyMessage()}
    />
  );
};

export default ApprovalTable;