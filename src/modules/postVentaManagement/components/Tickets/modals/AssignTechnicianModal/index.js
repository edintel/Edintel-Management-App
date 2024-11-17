import React from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import AssignTechnicianForm from './AssignTechnicianForm';
import Button from '../../../../../../components/common/Button';

const AssignTechnicianModal = ({
  isOpen,
  onClose,
  onSubmit,
  ticket,
  technicians,
  processing = false,
  error = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            Asignar Técnicos
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AssignTechnicianForm 
            onSubmit={onSubmit}
            technicians={technicians}
            initialData={ticket}
          />
        </div>

        {/* Footer - Fixed at bottom */}
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
              form="technicianForm"
              variant="primary"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Asignando...
                </>
              ) : (
                'Asignar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTechnicianModal;