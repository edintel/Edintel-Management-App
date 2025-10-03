import React from "react";
import {
  Calendar,
  CheckCircle,
  UserPlus,
  Play,
  AlertTriangle,
  Lock,
  FileCheck,
} from "lucide-react";
import Card from "../../../../../../../components/common/Card";
import Button from "../../../../../../../components/common/Button";
import { usePostVentaManagement } from "../../../../../context/postVentaManagementContext";
import {
  TICKET_ACTIONS,
  getAvailableActions,
} from "../../../permissions/ticketActionPermissions";

// Helper functions for status-specific UI elements
const getUpdateStatusLabel = (currentState) => {
  switch (currentState) {
    case "Iniciada":
    case "Técnico asignado":
      return "Confirmar Asignación";
    case "Confirmado por técnico":
      return "Iniciar Trabajo";
    case "Trabajo iniciado":
      return "Actualizar Estado"; // Genérico porque tiene múltiples opciones
    case "Trabajo Parcial":
      return "Finalizar Trabajo";
    case "Finalizada":
      return "Cerrar Ticket";
    default:
      return "Actualizar Estado";
  }
};

const getUpdateStatusIcon = (currentState) => {
  switch (currentState) {
    case "Iniciada":
    case "Técnico asignado":
      return CheckCircle;
    case "Confirmado por técnico":
      return Play;
    case "Trabajo iniciado":
      return FileCheck;
    case "Trabajo Parcial":
      return AlertTriangle;
    case "Finalizada":
      return Lock;
    default:
      return CheckCircle;
  }
};

const getUpdateStatusVariant = (currentState) => {
  switch (currentState) {
    case "Iniciada":
    case "Técnico asignado":
      return "warning";
    case "Confirmado por técnico":
    case "Trabajo iniciado":
      return "info";
    case "Trabajo Parcial":
      return "warning";
    case "Finalizada":
      return "success";
    default:
      return "primary";
  }
};

const getNextStatus = (currentState) => {
  switch (currentState) {
    case "Iniciada":
    case "Técnico asignado":
      return "Confirmado por técnico";
    case "Confirmado por técnico":
      return "Trabajo iniciado";
    case "Trabajo iniciado":
      return null; // Se maneja en el modal con múltiples opciones
    case "Trabajo Parcial":
      return "Finalizada";
    case "Finalizada":
      return "Cerrada";
    default:
      return currentState;
  }
};

const ActionsPanel = ({
  ticket,
  onAssignTech,
  onUpdateStatus,
  onScheduleTicket,
  className = "",
}) => {
  const { userRole } = usePostVentaManagement();

  if (!ticket) return null;

  const availableActions = getAvailableActions(ticket, userRole);

  // Configuration for each action type
  const actionConfig = {
    [TICKET_ACTIONS.ASSIGN_TECH]: {
      label: "Asignar Técnico",
      icon: UserPlus,
      onClick: () => onAssignTech(ticket),
      variant: "secondary",
    },
    [TICKET_ACTIONS.UPDATE_STATUS]: {
      label: getUpdateStatusLabel(ticket.state),
      icon: getUpdateStatusIcon(ticket.state),
      onClick: () => {
        // Para "Trabajo iniciado", el modal manejará las múltiples opciones
        if (ticket.state === "Trabajo iniciado") {
          onUpdateStatus(ticket.id); // Solo pasar el ID, el modal manejará el resto
        } else {
          onUpdateStatus(ticket.id, getNextStatus(ticket.state));
        }
      },
      variant: getUpdateStatusVariant(ticket.state),
    },
    [TICKET_ACTIONS.SCHEDULE_DATE]: {
      label: "Programar Fecha",
      icon: Calendar,
      onClick: () => onScheduleTicket(ticket),
      variant: "primary",
    },
  };

  if (availableActions.length === 0) {
    return (
      <Card className={className}>
        <div className="flex items-center gap-2 text-gray-500">
          <AlertTriangle className="h-5 w-5" />
          <span>No hay acciones disponibles en el estado actual</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="grid gap-3">
        {availableActions.map((action) => {
          const config = actionConfig[action];
          if (!config) return null;

          return (
            <Button
              key={action}
              variant={config.variant}
              onClick={config.onClick}
              startIcon={<config.icon className="h-4 w-4" />}
              fullWidth
            >
              {config.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default ActionsPanel;