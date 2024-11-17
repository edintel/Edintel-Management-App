import { Clock, CheckCircle } from "lucide-react";
import Button from "../../../../../../components/common/Button"

const StatusUpdateForm = ({ ticket, onSubmit, processing }) => {
  const getAvailableActions = () => {
    switch (ticket?.state) {
      case 'Iniciada':
        return ['Técnico asignado'];
      case 'Técnico asignado':
        return ['Confirmado por tecnico'];
      case 'Confirmado por tecnico':
        return ['Trabajo iniciado'];
      case 'Trabajo iniciado':
        return ['Finalizada'];
      case 'Finalizada':
        return ['Cerrada'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Status Display */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">
              Estado Actual
            </h3>
            <p className="text-sm text-gray-500">
              {ticket?.state || 'N/A'}
            </p>
          </div>
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Available Status Actions */}
      <div className="space-y-2">
        {getAvailableActions().map(status => (
          <Button
            key={status}
            variant="outline"
            fullWidth
            className="justify-start"
            onClick={() => onSubmit(ticket.id, status)}
            disabled={processing}
            startIcon={<CheckCircle className="h-4 w-4" />}
          >
            {status}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StatusUpdateForm;