import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePostVentaManagement } from "../../../../context/postVentaManagementContext";
import { useTicketActions } from "../../hooks/useTicketActions";
import { useTicketData } from "../../hooks/useTicketData";
import { MODAL_TYPES } from "../../modals";
import { Loader } from "lucide-react";
import { POST_VENTA_ROUTES } from "../../../../routes";
import {
  isActionAllowed,
  TICKET_ACTIONS,
} from "../../permissions/ticketActionPermissions";

// Components
import Card from "../../../../../../components/common/Card";
import DetailHeader from "./components/DetailHeader";
import LocationInfo from "./components/LocationInfo";
import TimelineSection from "./components/TimelineSection";
import FilesSection from "./components/FilesSection";
import ActionsPanel from "./components/ActionsPanel";

// Modals
import {
  AssignTechnicianModal,
  TicketActionsModal,
  TicketEditModal,
  DeleteTicketModal,
} from "../../modals";

import ReassignTechModal from '../../modals/AssignTechnicianModal/ReassignTechModal.js'

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    serviceTickets,
    getSiteDetails,
    systems,
    userRole,
    roles,
    service,
    loading: contextLoading,
  } = usePostVentaManagement();

  // Estado para modal de reasignación
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignError, setReassignError] = useState(null);
  const [reassigning, setReassigning] = useState(false);

  const {
    currentModal,
    selectedTicket,
    processing,
    error,
    openModal,
    closeModal,
    handleAssignTechnicians,
    handleUpdateStatus,
    handleConfirmDate,
    handleEditTicket,
    handleDeleteTicket,
    handleFileDownload,
    handleCreateShareLink,
  } = useTicketActions();

  const { technicians } = useTicketData();

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const ticket = serviceTickets.find((t) => t.id === id);
  if (!ticket) {
    navigate(POST_VENTA_ROUTES.TICKETS.LIST);
    return null;
  }

  const siteDetails = getSiteDetails(ticket.siteId);
  const system = systems.find((s) => s.id === ticket.systemId);

  const handleBack = () => {
    navigate(POST_VENTA_ROUTES.TICKETS.LIST);
  };

  // Handler para reasignar técnicos
  const handleReassignTech = async (ticketId, technicianIds) => {
    try {
      setReassigning(true);
      setReassignError(null);

      // Llamar al servicio para reasignar
      await service.reassignTechniciansPartial(ticketId, technicianIds);

      // Cerrar modal
      setIsReassignModalOpen(false);

      // Recargar la página para ver los cambios
      window.location.reload();

    } catch (err) {
      console.error("Error reassigning technicians:", err);
      setReassignError(err.message || "Error al reasignar técnicos");
      // No hacemos throw para que el error se muestre en el modal
    } finally {
      setReassigning(false);
    }
  };

  // Check permissions for edit and delete actions
  const canEdit = isActionAllowed(TICKET_ACTIONS.EDIT, ticket, userRole);
  const canDelete = isActionAllowed(TICKET_ACTIONS.DELETE, ticket, userRole);
  const canViewSharePointLink = isActionAllowed(
    TICKET_ACTIONS.VIEW_SHAREPOINT_LINK,
    ticket,
    userRole
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <DetailHeader
        ticket={ticket}
        onBack={handleBack}
        onEdit={
          canEdit ? () => openModal(MODAL_TYPES.EDIT_TICKET, ticket) : null
        }
        onDelete={
          canDelete
            ? () => openModal(MODAL_TYPES.DELETE_TICKET, ticket)
            : null
        }
        className="mb-6"
        showEditDelete={canEdit || canDelete}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title={"Alcance"}>{ticket.scope}</Card>

          {canViewSharePointLink && (
            <Card title={"Link de SharePoint"}>
              {ticket.link ? (
                <a
                  href={ticket.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {ticket.link}
                </a>
              ) : (
                <span className="text-gray-500">No hay link disponible</span>
              )}
            </Card>
          )}

          <FilesSection
            ticket={ticket}
            onDownload={handleFileDownload}
            onShare={handleCreateShareLink}
            loading={processing}
            userRole={userRole}
          />
          <TimelineSection ticket={ticket} />
        </div>

        <div className="space-y-6">
          <ActionsPanel
            ticket={ticket}
            onAssignTech={() => openModal(MODAL_TYPES.ASSIGN_TECH, ticket)}
            onReassignTech={() => setIsReassignModalOpen(true)}
            onUpdateStatus={(ticketId, newStatus) =>
              openModal(MODAL_TYPES.UPDATE_STATUS, { ...ticket, newStatus })
            }
            onScheduleTicket={() =>
              openModal(MODAL_TYPES.SCHEDULE_DATE, ticket)
            }
            userRole={userRole}
          />
          <LocationInfo
            siteDetails={siteDetails}
            system={system}
            roles={roles}
            ticket={ticket} 
          />
        </div>
      </div>

      {/* Modals */}
      <AssignTechnicianModal
        isOpen={currentModal?.type === MODAL_TYPES.ASSIGN_TECH}
        onClose={closeModal}
        onSubmit={(techIds) =>
          handleAssignTechnicians(selectedTicket?.id, techIds)
        }
        ticket={selectedTicket}
        technicians={technicians}
        processing={processing}
        error={error}
      />

      <ReassignTechModal
        isOpen={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setReassignError(null);
        }}
        ticket={ticket}
        onReassign={handleReassignTech}
        processing={reassigning}
        error={reassignError}
      />

      <TicketActionsModal
        isOpen={
          currentModal?.type === MODAL_TYPES.UPDATE_STATUS ||
          currentModal?.type === MODAL_TYPES.SCHEDULE_DATE
        }
        onClose={closeModal}
        onUpdateStatus={handleUpdateStatus}
        onConfirmDate={handleConfirmDate}
        ticket={selectedTicket || ticket}
        modalType={currentModal?.type}
        processing={processing}
        error={error}
      />

      <TicketEditModal
        isOpen={currentModal?.type === MODAL_TYPES.EDIT_TICKET}
        onClose={closeModal}
        onSubmit={(ticketId, data) => handleEditTicket(ticketId, data)}
        ticket={selectedTicket}
        processing={processing}
        error={error}
      />

      <DeleteTicketModal
        isOpen={currentModal?.type === MODAL_TYPES.DELETE_TICKET}
        onClose={closeModal}
        onConfirm={handleDeleteTicket}
        ticket={selectedTicket}
        processing={processing}
        error={error}
      />
    </div>
  );
};

export default TicketDetails;