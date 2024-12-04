// src/modules/postVentaManagement/components/Tickets/modals/DeleteTicketModal/index.js
import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Button from '../../../../../../components/common/Button';
import TentativeDate from '../../components/common/TentativeDate';

const DeleteTicketModal = ({
  isOpen,
  onClose,
  onConfirm,
  ticket,
  processing = false,
  error = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header with warning icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-error/10 rounded-full">
            <AlertTriangle className="h-6 w-6 text-error" />
          </div>
          <h2 className="text-lg font-semibold">Confirmar Eliminación</h2>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-error/10 text-error rounded-lg">
            {error}
          </div>
        )}

        {/* Warning message */}
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            ¿Está seguro que desea eliminar la ST "{ticket?.stNumber}"?
          </p>
          <p className="text-sm text-error">
            Esta acción no se puede deshacer. Se eliminarán todos los archivos y registros asociados.
          </p>
        </div>

        {/* Ticket details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Tipo</dt>
              <dd className="text-sm font-medium">{ticket?.type}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Estado</dt>
              <dd className="text-sm font-medium">{ticket?.state}</dd>
            </div>
            {ticket?.tentativeDate && (
              <div>
                <dt className="text-sm text-gray-500">Fecha Tentativa</dt>
                <dd className="text-sm font-medium">
                  <TentativeDate date={ticket.tentativeDate} />
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            variant="error"
            onClick={() => onConfirm(ticket.id)}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTicketModal;