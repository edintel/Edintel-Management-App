import React from "react";
import {
  CheckCircle,
  Clock,
  Play,
  Lock,
  UserCheck,
  FileCheck,
} from "lucide-react";
import { cn } from "../../../../../../utils/cn";

const STATUS_CONFIG = {
  Iniciada: {
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
  },
  "Técnico asignado": {
    color: "bg-warning/10 text-warning",
    icon: UserCheck,
  },
  "Confirmado por técnico": {
    color: "bg-info/10 text-info",
    icon: CheckCircle,
  },
  "Trabajo iniciado": {
    color: "bg-info/10 text-info",
    icon: Play,
  },
  Finalizada: {
    color: "bg-success/10 text-success",
    icon: FileCheck,
  },
  Cerrada: {
    color: "bg-success/10 text-success",
    icon: Lock,
  },
};

const TicketStatusBadge = ({ status, size = "default", className }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG["Iniciada"];
  const Icon = config.icon;

  const sizes = {
    small: "text-xs px-2 py-0.5 gap-1",
    default: "text-sm px-3 py-1 gap-1.5",
    large: "text-base px-4 py-1.5 gap-2",
  };

  const iconSizes = {
    small: 12,
    default: 14,
    large: 16,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.color,
        sizes[size],
        className
      )}
    >
      <Icon size={iconSizes[size]} className="flex-shrink-0" />
      <span>{status}</span>
    </span>
  );
};

export default TicketStatusBadge;
