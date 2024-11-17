import React from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { usePostVentaManagement } from '../../../../context/postVentaManagementContext';
import SiteForm from './SiteForm';
import Button from '../../../../../../components/common/Button';

const SiteModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  processing = false,
  error = null,
}) => {
  const { systems, roles } = usePostVentaManagement();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Add overflow-y-auto to allow scrolling and max-h-[90vh] to prevent modal from being too tall */}
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Keep fixed at top */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {initialData ? 'Editar Sitio' : 'Agregar Sitio'}
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

          <SiteForm 
            onSubmit={onSubmit}
            systems={systems}
            roles={roles}
            initialData={initialData}
          />
        </div>

        {/* Footer - Keep fixed at bottom */}
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
              form="siteForm"
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

export default SiteModal;