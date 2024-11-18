// src/modules/postVentaManagement/components/Tickets/hooks/useTicketActions.js
import { useState, useCallback } from "react";
import { usePostVentaManagement } from "../../../context/postVentaManagementContext";
import { MODAL_TYPES } from "../modals";

export const useTicketActions = () => {
  const { service, loadPostVentaData, roles } = usePostVentaManagement();

  // Modal state
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const openModal = useCallback((type, ticket = null) => {
    setCurrentModal({ type });
    setSelectedTicket(ticket);
    setError(null);
  }, []);

  const closeModal = useCallback(() => {
    setCurrentModal(null);
    setSelectedTicket(null);
    setError(null);
    setProcessing(false);
  }, []);

  const handleAssignTechnicians = useCallback(
    async (ticketId, technicians) => {
      setProcessing(true);
      setError(null);
      try {
        // First, assign technicians to the ticket
        await service.assignTechnicians(ticketId, technicians);
  
        // If the ticket has a calendar event, update its attendees
        if (selectedTicket?.calendarEventId && selectedTicket?.tentativeDate) {
          // Get technician details for all assigned techs
          const techDetails = await Promise.all(
            technicians.map(async (techId) => {
              const techRole = roles.find(
                role => role.employee?.LookupId.toString() === techId.toString()
              );
              return {
                email: techRole?.employee?.Email,
                name: techRole?.employee?.LookupValue
              };
            })
          );
  
          // Filter out any undefined entries and update calendar event
          const validAttendees = techDetails.filter(tech => tech.email && tech.name);
          await service.updateCalendarEventAttendees(
            service.groupId,
            selectedTicket.calendarEventId,
            validAttendees
          );
        }
  
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    },
    [service, selectedTicket, roles, closeModal, loadPostVentaData]
  );

  const handleUpdateStatus = useCallback(
    async (ticketId, newStatus, files = null) => {
      if (!ticketId || !newStatus) return;

      setProcessing(true);
      setError(null);

      try {
        // If we're finalizing the ticket and have files
        if (newStatus === "Finalizada" && files) {
          // Upload service ticket
          if (files.serviceTicket) {
            await service.uploadServiceTicket(ticketId, files.serviceTicket);

            // If this is a preventive ticket, upload report
            if (selectedTicket?.type === "Preventiva" && files.report) {
              await service.uploadServiceReport(ticketId, files.report);
            }
          }
        }

        // Update ticket status
        await service.updateTicketStatus(ticketId, newStatus);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        console.error("Error updating ticket:", err);
        setError(err.message || "Error al actualizar el ticket");
      } finally {
        setProcessing(false);
      }
    },
    [service, closeModal, loadPostVentaData, selectedTicket]
  );

  const createCalendarEvent = async (ticket, newDate, technicians) => {
    // Get site details for event content
    const siteDetails = await service.client
      .api(`/sites/${service.siteId}/lists/${service.config.lists.sites}/items/${ticket.siteId}`)
      .expand('fields')
      .get();

    // Get building details
    const buildingDetails = await service.client
      .api(`/sites/${service.siteId}/lists/${service.config.lists.buildings}/items/${siteDetails.fields.EdificioIDLookupId}`)
      .expand('fields')
      .get();

    // Get company details
    const companyDetails = await service.client
      .api(`/sites/${service.siteId}/lists/${service.config.lists.companies}/items/${buildingDetails.fields.EmpresaIDLookupId}`)
      .expand('fields')
      .get();

    // Create attendees list from technicians
    const attendees = technicians.map(tech => ({
      email: tech.Email,
      name: tech.LookupValue
    }));

    // Create event content
    const eventTitle = `ST ${ticket.stNumber} - ${companyDetails.fields.Title} / ${buildingDetails.fields.Title}`;
    const eventBody = `
      <h3>Detalles del Servicio</h3>
      <p><strong>ST:</strong> ${ticket.stNumber}</p>
      <p><strong>Tipo:</strong> ${ticket.type}</p>
      <p><strong>Empresa:</strong> ${companyDetails.fields.Title}</p>
      <p><strong>Edificio:</strong> ${buildingDetails.fields.Title}</p>
      <p><strong>Sitio:</strong> ${siteDetails.fields.Title}</p>
      ${siteDetails.fields.Ubicaci_x00f3_n ? `<p><strong>Ubicación:</strong> ${siteDetails.fields.Ubicaci_x00f3_n}</p>` : ''}
    `;
    // Create calendar event
    return await service.createCalendarEvent(
      service.groupId,
      eventTitle,
      newDate,
      attendees,
      eventBody
    );
  };

  const handleConfirmDate = useCallback(
    async (ticketId, newDate) => {
      if (!ticketId || !newDate) return;

      setProcessing(true);
      setError(null);

      try {
        const ticket = selectedTicket;
        let eventId = ticket.calendarEventId;

        // If there's an existing event, update it
        if (eventId) {
          await service.updateCalendarEventDate(
            service.groupId,
            eventId,
            newDate
          );
        } 
        // If no existing event and ticket has technicians, create new event
        else if (ticket.technicians?.length > -1) {
          eventId = await createCalendarEvent(ticket, newDate, ticket.technicians);
        }

        // Update ticket with new date and event ID
        await service.updateSTDate(ticketId, newDate, eventId);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        console.error("Error updating date:", err);
        setError(err.message || "Error al actualizar la fecha");
      } finally {
        setProcessing(false);
      }
    },
    [service, selectedTicket, closeModal, loadPostVentaData]
  );


  const handleEditTicket = useCallback(
    async (ticketId, data) => {
      if (!ticketId) return;

      setProcessing(true);
      setError(null);
      try {
        await service.updateTicket(ticketId, data);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    },
    [service, closeModal, loadPostVentaData]
  );

  const handleDeleteTicket = useCallback(async () => {
    if (!selectedTicket?.id) return;

    setProcessing(true);
    setError(null);
    try {
      await service.deleteTicket(selectedTicket.id);
      await loadPostVentaData();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [service, selectedTicket, closeModal, loadPostVentaData]);
  

  const handleFileDownload = useCallback(
    async (itemId, fileName) => {
      if (!itemId) return;

      try {
        const fileMetadata = await service.client
          .api(
            `/sites/${service.siteId}/drives/${service.driveId}/items/${itemId}`
          )
          .get();

        const { url, token } = await service.getImageContent(
          service.siteId,
          service.driveId,
          itemId
        );

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Error downloading file");

        const fileExtension = fileMetadata.name.split(".").pop();
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${fileName}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error("Error downloading file:", error);
        setError("Error downloading file");
      }
    },
    [service]
  );

  // Helper functions for determining modal state
  const isStatusOrScheduleModal = useCallback(() => {
    return (
      currentModal?.type === MODAL_TYPES.UPDATE_STATUS ||
      currentModal?.type === MODAL_TYPES.SCHEDULE_DATE
    );
  }, [currentModal]);

  return {
    // Modal state
    currentModal,
    selectedTicket,
    processing,
    error,

    // Modal handlers
    openModal,
    closeModal,
    isStatusOrScheduleModal,

    // Action handlers
    handleAssignTechnicians,
    handleUpdateStatus,
    handleConfirmDate,
    handleEditTicket,
    handleDeleteTicket,
    handleFileDownload,
  };
};

