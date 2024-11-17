import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../../../../../components/common/Button';

const HierarchyHeader = ({ onAddCompany }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Jerarquía de Ubicaciones
        </h2>
        <p className="text-sm text-gray-500">
          Gestione empresas, edificios y sitios
        </p>
      </div>
      
      <Button
        variant="primary"
        onClick={onAddCompany}
        startIcon={<Plus className="h-4 w-4" />}
      >
        Agregar Empresa
      </Button>
    </div>
  );
};

export default HierarchyHeader;