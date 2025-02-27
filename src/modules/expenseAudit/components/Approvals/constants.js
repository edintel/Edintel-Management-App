import { Check, X, Eye } from 'lucide-react';

export const VIEW_MODES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const VIEW_MODE_LABELS = {
  [VIEW_MODES.PENDING]: 'Pendientes',
  [VIEW_MODES.APPROVED]: 'Aprobados',
  [VIEW_MODES.REJECTED]: 'Rechazados'
};

export const APPROVAL_TYPES = {
  APPROVE: 'approve',
  REJECT: 'reject'
};

export const APPROVAL_STAGES = {
  ASSISTANT: 'assistant',
  BOSS: 'boss',
  ACCOUNTING_ASSISTANT: 'accounting_assistant',
  ACCOUNTING_BOSS: 'accounting_boss'
};

export const APPROVAL_STATUS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'No aprobada'
};

export const TABLE_COLUMNS = [
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
    },
  },
  {
    key: "actions",
    header: "Acciones",
    render: (_, row, { handleApprove, handleReject, handleRowClick, viewMode, approvalFlowService, service }) => (
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
        {approvalFlowService && approvalFlowService.canApprove(
          row,
          service.msalInstance.getAllAccounts()[0]?.username
        ) && viewMode === "pending" && (
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
    ),
  },
];