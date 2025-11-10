import React from "react";
import {
  Clock,
  User,
  CheckCircle,
  Play,
  AlertTriangle,
  CheckSquare,
  Lock,
} from "lucide-react";

const TicketStatusBadge = ({ status, className = "" }) => {
  const getStatusConfig = (status) => {
    const config = {
      "Iniciada": {
        label: "Iniciada",
        className: "bg-gray-200 text-gray-700",
        icon: Clock,
      },
      "Técnico asignado": {
        label: "Técnico asignado",
        className: "bg-yellow-100 text-yellow-800",
        icon: User,
      },
      "Confirmado por técnico": {
        label: "Confirmado",
        className: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
      },
      "Trabajo iniciado": {
        label: "En progreso",
        className: "bg-blue-100 text-blue-800",
        icon: Play,
      },
      "Trabajo Parcial": {
        label: "Trabajo Parcial",
        className: "bg-orange-100 text-orange-800",
        icon: AlertTriangle,
      }, 
      "Reasignación de técnico": {
        label: "Reasignación de técnico",
        className: "bg-orange-100 text-orange-800",
       icon: CheckCircle,
      },
      "Finalizada": {
        label: "Finalizada",
        className: "bg-green-100 text-green-800",
        icon: CheckSquare,
      },
      "Cerrada": {
        label: "Cerrada",
        className: "bg-green-100 text-green-800",
        icon: Lock,
      },
    };

    return config[status] || {
      label: status,
      className: "bg-gray-100 text-gray-600",
      icon: Clock,
    };
  };

  const { label, className: statusClassName, icon: Icon } = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusClassName} ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

export default TicketStatusBadge;