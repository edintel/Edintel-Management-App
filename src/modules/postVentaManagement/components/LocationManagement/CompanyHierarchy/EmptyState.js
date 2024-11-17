import React from 'react';
import { Building } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <Building className="h-12 w-12 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        No hay empresas registradas
      </h3>
      <p className="text-sm text-center">
        Comience agregando una empresa usando el botón "Agregar Empresa" arriba
      </p>
    </div>
  );
};

export default EmptyState;