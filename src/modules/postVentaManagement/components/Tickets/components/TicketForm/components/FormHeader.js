import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../../../../../../../components/common/Button';

const FormHeader = ({ title, onBack, isEditing }) => {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="mr-2"
          onClick={onBack}
          startIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Volver
        </Button>
      </div>
      <h1 className="text-2xl font-bold">
        {isEditing ? 'Editar Ticket' : 'Nuevo Ticket'}
      </h1>
      <p className="text-sm text-gray-500">
        {isEditing ? 'Modifique los datos del ticket' : 'Complete los datos para crear un nuevo ticket'}
      </p>
    </div>
  );
};

export default FormHeader;