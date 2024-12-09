import React from "react";
import { AlertCircle, X } from "lucide-react";
import Button from "../../../../../../components/common/Button";
import { MODAL_TYPES } from "..";
import DateAssignmentForm from "./DateAssignmentForm";
import StatusUpdateForm from "./StatusUpdateForm";

const TicketActionsModal = ({
  isOpen,
  onClose,
  onUpdateStatus,
  onConfirmDate,
  ticket,
  modalType,
  processing = false,
  error = null,
}) => {
  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (modalType) {
      case MODAL_TYPES.UPDATE_STATUS:
        return "Actualizar Estado";
      case MODAL_TYPES.SCHEDULE_DATE:
        return "Programar Fecha";
      default:
        return "Actualizar ST";
    }
  };

  const handleStatusUpdate = (ticketId, newStatus, files = null, notes = null) => {
    onUpdateStatus(ticketId, newStatus, files, notes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
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

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {modalType === MODAL_TYPES.UPDATE_STATUS ? (
              <StatusUpdateForm
                ticket={ticket}
                onSubmit={handleStatusUpdate}
                processing={processing}
              />
            ) : modalType === MODAL_TYPES.SCHEDULE_DATE ? (
              <DateAssignmentForm
                ticket={ticket}
                onSubmit={onConfirmDate}
                processing={processing}
              />
            ) : null}
          </div>

          {/* Footer - Only show for Schedule Date modal */}
          {modalType !== MODAL_TYPES.UPDATE_STATUS && (
            <div className="border-t p-6">
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose} disabled={processing}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketActionsModal;