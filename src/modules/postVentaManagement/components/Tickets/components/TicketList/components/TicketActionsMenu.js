// src/modules/postVentaManagement/components/Tickets/components/TicketList/components/TicketActionsMenu.js
import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  UserPlus,
  CheckCircle,
  Calendar,
  Pencil,
  Trash2,
  Play,
  Lock,
  FileCheck,
} from "lucide-react";
import { usePostVentaManagement } from "../../../../../context/postVentaManagementContext";
import {
  TICKET_ACTIONS,
  getAvailableActions,
} from "../../../permissions/ticketActionPermissions";
import { MODAL_TYPES } from "../../../modals";

const TicketActionsMenu = ({
  ticket,
  onAssignTech,
  onUpdateStatus,
  onScheduleTicket,
  onEdit,
  onDelete,
}) => {
  const { userRole } = usePostVentaManagement();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const getUpdateStatusLabel = (currentState) => {
    switch (currentState) {
      case "Iniciada":
      case "Técnico asignado":
        return "Confirmar Asignación";
      case "Confirmado por tecnico":
        return "Iniciar Trabajo";
      case "Trabajo iniciado":
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
      case "Finalizada":
        return Lock;
      default:
        return CheckCircle;
    }
  };

  const getUpdateStatusClassName = (currentState) => {
    switch (currentState) {
      case "Iniciada":
      case "Técnico asignado":
        return "text-warning hover:bg-warning/10";
      case "Confirmado por técnico":
      case "Trabajo iniciado":
        return "text-info hover:bg-info/10";
      case "Finalizada":
        return "text-success hover:bg-success/10";
      default:
        return "text-gray-700 hover:bg-gray-50";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const handleAction = (action, e) => {
    e.stopPropagation();
    setIsOpen(false);
    action();
  };

  // Configuration for each action type
  const actionConfig = {
    [TICKET_ACTIONS.ASSIGN_TECH]: {
      label: "Asignar técnico",
      icon: UserPlus,
      onClick: () => onAssignTech(ticket),
      className: "text-gray-700 hover:bg-gray-50",
      modalType: MODAL_TYPES.ASSIGN_TECH,
    },
    [TICKET_ACTIONS.UPDATE_STATUS]: {
      label: getUpdateStatusLabel(ticket.state),
      icon: getUpdateStatusIcon(ticket.state),
      onClick: () => onUpdateStatus(ticket),
      className: getUpdateStatusClassName(ticket.state),
      modalType: MODAL_TYPES.UPDATE_STATUS,
    },
    [TICKET_ACTIONS.SCHEDULE_DATE]: {
      label: "Programar fecha",
      icon: Calendar,
      onClick: () => onScheduleTicket(ticket),
      className: "text-gray-700 hover:bg-gray-50",
      modalType: MODAL_TYPES.SCHEDULE_DATE,
    },
    [TICKET_ACTIONS.EDIT]: {
      label: "Editar",
      icon: Pencil,
      onClick: () => onEdit(ticket),
      className: "text-gray-700 hover:bg-gray-50",
      modalType: MODAL_TYPES.EDIT_TICKET,
    },
    [TICKET_ACTIONS.DELETE]: {
      label: "Eliminar",
      icon: Trash2,
      onClick: () => onDelete(ticket),
      className: "text-error hover:bg-error/10",
      modalType: MODAL_TYPES.DELETE_TICKET,
    },
  };

  const availableActions = getAvailableActions(ticket, userRole);

  if (availableActions.length === 0) return null;

  return (
    <div className="relative flex items-center justify-end">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 w-48 bg-white rounded-lg shadow-lg border overflow-hidden"
          style={{
            top: buttonRef.current.getBoundingClientRect().bottom + 4,
            left: buttonRef.current.getBoundingClientRect().left - 180,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {availableActions.map((action) => {
            const config = actionConfig[action];
            if (!config) return null;

            return (
              <button
                key={action}
                onClick={(e) => handleAction(config.onClick, e)}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${config.className}`}
              >
                <config.icon size={16} />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketActionsMenu;
