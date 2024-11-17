// src/modules/postVentaManagement/components/Tickets/modals/TicketEditModal/index.js
import React from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import TicketEditForm from './TicketEditForm';
import Button from '../../../../../../components/common/Button';
import { usePostVentaManagement } from '../../../../context/postVentaManagementContext';

const TicketEditModal = ({
  isOpen,
  onClose,
  onSubmit,
  ticket,
  processing = false,
  error = null,
}) => {
  const { companies, buildings, sites, systems } = usePostVentaManagement();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            Editar ST {ticket?.stNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6">
          {error && (
            <div className="mb-4 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <TicketEditForm 
            onSubmit={onSubmit}
            companies={companies}
            buildings={buildings}
            sites={sites}
            systems={systems}
            initialData={ticket}
          />
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="ticketForm"
              variant="primary"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketEditModal;