// src/modules/postVentaManagement/components/Tickets/components/TicketList/components/QuickActions.js
import React from "react";
import { UserPlus, Check, Calendar, FileText } from "lucide-react";
import { MODAL_TYPES } from "../../../modals";
import {
  TICKET_ACTIONS,
  isActionAllowed,
} from "../../../permissions/ticketActionPermissions";
import { usePostVentaManagement } from "../../../../context/postVentaManagementContext";

const QuickActions = ({
  ticket,
  onOpenModal,
  onDownloadFile,
  className = "",
}) => {
  const { userRole } = usePostVentaManagement();

  const handleAction = (e, modalType) => {
    e.stopPropagation();
    onOpenModal(modalType, ticket);
  };

  const handleFileDownload = (e, itemId, fileName) => {
    e.stopPropagation();
    onDownloadFile(itemId, fileName);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* File Downloads */}
      {ticket.descriptionId && (
        <button
          onClick={(e) =>
            handleFileDownload(
              e,
              ticket.descriptionId,
              `ST_${ticket.stNumber}_descripcion`
            )
          }
          className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
          title="Descargar descripción"
        >
          <FileText size={16} />
        </button>
      )}

      {/* Action Buttons */}
      {isActionAllowed(TICKET_ACTIONS.ASSIGN_TECH, ticket, userRole) && (
        <button
          onClick={(e) => handleAction(e, MODAL_TYPES.ASSIGN_TECH)}
          className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
          title="Asignar técnico"
        >
          <UserPlus size={16} />
        </button>
      )}

      {isActionAllowed(TICKET_ACTIONS.UPDATE_STATUS, ticket, userRole) && (
        <button
          onClick={(e) => handleAction(e, MODAL_TYPES.UPDATE_STATUS)}
          className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
          title="Actualizar estado"
        >
          <Check size={16} />
        </button>
      )}

      {isActionAllowed(TICKET_ACTIONS.SCHEDULE_DATE, ticket, userRole) && (
        <button
          onClick={(e) => handleAction(e, MODAL_TYPES.SCHEDULE_DATE)}
          className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
          title="Programar fecha"
        >
          <Calendar size={16} />
        </button>
      )}
    </div>
  );
};

export default QuickActions;
