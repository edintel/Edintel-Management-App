// src/modules/postVentaManagement/components/Tickets/modals/DeleteTicketModal/index.js
import React, { useState, useEffect } from 'react';
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
  const [reason, setReason] = useState('');

  // Limpiar el motivo cada vez que se abre/cierra el modal
  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmedReason = reason.trim();
  const canDelete = trimmedReason.length > 0 && !processing;

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

        {/* Motivo de eliminación (requerido) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de la eliminación <span className="text-error">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={processing}
            rows={3}
            placeholder="Describa por qué se elimina esta ST..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Este motivo se incluirá en el correo de notificación.
          </p>
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
            onClick={() => onConfirm(trimmedReason)}
            disabled={!canDelete}
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
