import React, { memo } from 'react';
import Table from '../../../../../components/common/Table';
import Checkbox from '../../../../../components/common/Checkbox';

// Memo-ized status badge component
const StatusBadge = memo(({ status }) => {
  if (status === "No aprobada") {
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
        No aprobada
      </span>
    );
  }
  
  if (status.includes("Contabilidad")) {
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
        Aprobado
      </span>
    );
  }
  
  if (status.includes("Jefatura")) {
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
        En Contabilidad
      </span>
    );
  }
  
  if (status.includes("Asistente")) {
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

// Memoized selection checkbox component
const SelectionCheckbox = memo(({ checked, onChange, stopPropagation = false }) => {
  const handleChange = (isChecked, e) => {
    if (stopPropagation) e.stopPropagation();
    onChange(isChecked);
  };
  
  return (
    <div className="flex justify-center" onClick={stopPropagation ? e => e.stopPropagation() : undefined}>
      <Checkbox
        checked={checked}
        onChange={handleChange}
      />
    </div>
  );
});

const ReportTable = ({
  data,
  loading,
  onRowClick,
  selectedExpenses,
  onSelectAll,
  onSelectExpense,
  areAllSelected,
  emptyMessage,
  // Add pagination props
  paginated = false,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange
}) => {
  // Helper function to determine expense status
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

  const columns = [
    {
      key: 'selection',
      header: () => (
        <SelectionCheckbox
          checked={areAllSelected}
          onChange={onSelectAll}
        />
      ),
      render: (_, row) => (
        <SelectionCheckbox
          checked={selectedExpenses.includes(row.id)}
          onChange={(checked) => onSelectExpense(row.id, checked)}
          stopPropagation={true}
        />
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
        const status = getExpenseStatus(row);
        return <StatusBadge status={status} />;
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
      // Add pagination props
      paginated={paginated}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      onItemsPerPageChange={onItemsPerPageChange}
      responsive={true}
    />
  );
};

// Memo-ize the whole component for extra performance
export default memo(ReportTable);