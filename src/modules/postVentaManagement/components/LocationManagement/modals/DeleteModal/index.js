import React from 'react';
import { AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../../../../../components/common/Button';

const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
  warning = null,
  processing = false,
  error = null,
}) => {
  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    onConfirm();
  };

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
          <div className="mb-4 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Confirmation message */}
        <p className="text-gray-600 mb-2">
          ¿Está seguro que desea eliminar {itemType} "{itemName}"?
        </p>
        
        {/* Optional warning message */}
        {warning && (
          <p className="text-sm text-error mb-4">
            {warning}
          </p>
        )}

        {/* Actions */}
        <form onSubmit={handleConfirm} className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="error"
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
        </form>
      </div>
    </div>
  );
};

export default DeleteModal;