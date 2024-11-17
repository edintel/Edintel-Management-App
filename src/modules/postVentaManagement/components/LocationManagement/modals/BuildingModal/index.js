import React from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import BuildingForm from './BuildingForm';
import Button from '../../../../../../components/common/Button';

const BuildingModal = ({
  isOpen,
  onClose,
  onSubmit,
  companies,
  initialData = null,
  selectedCompanyId = null,
  processing = false,
  error = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">
            {initialData ? 'Editar Edificio' : 'Agregar Edificio'}
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

        {/* Form */}
        <BuildingForm 
          onSubmit={onSubmit}
          companies={companies}
          initialData={initialData}
          selectedCompanyId={selectedCompanyId}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="buildingForm"
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
  );
};

export default BuildingModal;