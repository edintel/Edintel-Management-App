import { MODAL_TYPES } from "..";
import { X, AlertCircle } from "lucide-react";
import Button from "../../../../../../components/common/Button"
import DateAssignmentForm from "./DateAssignmentForm"
import StatusUpdateForm from "./StatusUpdateForm"

const TicketActionsModal = ({
  isOpen,
  onClose,
  onUpdateStatus,
  onConfirmDate,
  ticket,
  modalType, // 'UPDATE_STATUS' or 'SCHEDULE_DATE'
  processing = false,
  error = null,
}) => {
  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (modalType) {
      case MODAL_TYPES.UPDATE_STATUS:
        return 'Actualizar Estado';
      case MODAL_TYPES.SCHEDULE_DATE:
        return 'Programar Fecha';
      default:
        return 'Actualizar ST';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">
            {getModalTitle()} - ST {ticket?.stNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Render appropriate form based on modalType */}
        {modalType === MODAL_TYPES.UPDATE_STATUS ? (
          <StatusUpdateForm
            ticket={ticket}
            onSubmit={onUpdateStatus}
            processing={processing}
          />
        ) : (
          <DateAssignmentForm
            ticket={ticket}
            onSubmit={onConfirmDate}
            processing={processing}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={processing}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketActionsModal;