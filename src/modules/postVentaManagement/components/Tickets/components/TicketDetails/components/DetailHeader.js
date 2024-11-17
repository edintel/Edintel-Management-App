import React from 'react';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import Button from '../../../../../../../components/common/Button';
import TicketStatusBadge from '../../common/TicketStatusBadge';

const DetailHeader = ({
  ticket,
  onBack,
  onEdit,
  onDelete,
  className = ''
}) => {
  if (!ticket) return null;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          startIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={onBack}
        >
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            startIcon={<Edit2 className="h-4 w-4" />}
            onClick={() => onEdit(ticket)}
          >
            Editar
          </Button>
          <Button
            variant="error"
            startIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => onDelete(ticket)}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            ST {ticket.stNumber}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <TicketStatusBadge status={ticket.state} />
            <span className="text-gray-500">{ticket.type}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailHeader;