import React from 'react';
import Table from '../../../../../components/common/Table';
import Checkbox from '../../../../../components/common/Checkbox';

const ReportTable = ({
  data,
  loading,
  onRowClick,
  selectedExpenses,
  onSelectAll,
  onSelectExpense,
  areAllSelected,
  emptyMessage,
}) => {
  // Build columns including selection column
  const columns = [
    {
      key: 'selection',
      header: () => (
        <div className="flex justify-center">
          <Checkbox 
            checked={areAllSelected}
            onChange={onSelectAll}
          />
        </div>
      ),
      render: (_, row) => (
        <div 
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
        >
          <Checkbox 
            checked={selectedExpenses.includes(row.id)}
            onChange={(checked) => onSelectExpense(row.id, checked)}
          />
        </div>
      ),
      className: 'w-10',
    },
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

  return (
    <Table
      columns={columns}
      data={data}
      onRowClick={onRowClick}
      isLoading={loading}
      emptyMessage={emptyMessage}
    />
  );
};

export default ReportTable;