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
        await service.assignTechnicians(ticketId, technicians);
  
        if (selectedTicket?.calendarEventId && selectedTicket?.tentativeDate) {
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
    async (ticketId, newStatus, files = [], notes = '') => {
      if (!ticketId || !newStatus) return;
  
      setProcessing(true);
      setError(null);
  
      try {
          if (newStatus === "Finalizada" && files) {
            if (files.serviceTicket) {
              await service.uploadServiceTicket(ticketId, files.serviceTicket);
    
              if (selectedTicket?.type === "Preventiva" && files.report) {
                await service.uploadServiceReport(ticketId, files.report);
              }
            }
          }
        
        if (newStatus === "Cerrada" && selectedTicket?.messageId) {
          const ticketDetails = await service.client
            .api(`/sites/${service.siteId}/lists/${service.config.lists.controlPV}/items/${ticketId}`)
            .expand('fields')
            .get();

          const siteDetails = await service.client
            .api(`/sites/${service.siteId}/lists/${service.config.lists.sites}/items/${ticketDetails.fields.SitioIDLookupId}`)
            .expand('fields')
            .get();

          const buildingDetails = await service.client
            .api(`/sites/${service.siteId}/lists/${service.config.lists.buildings}/items/${siteDetails.fields.EdificioIDLookupId}`)
            .expand('fields')
            .get();

          const companyDetails = await service.client
            .api(`/sites/${service.siteId}/lists/${service.config.lists.companies}/items/${buildingDetails.fields.EmpresaIDLookupId}`)
            .expand('fields')
            .get();

          const systemName = (await service.client
            .api(`/sites/${service.siteId}/lists/${service.config.lists.systems}/items/${ticketDetails.fields.SistemaIDLookupId}`)
            .get()).fields.Title

          const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        .header {
            background-color: #00008B;
            color: white;
            padding: 20px;
            border-radius: 6px 6px 0 0;
            margin: -20px -20px 20px -20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 6px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #00008B;
            margin-bottom: 15px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 5px;
        }
        .info-row {
            display: block;
            margin-bottom: 8px;
        }
        .label {
            font-weight: bold;
            color: #555555;
        }
        .value {
            color: #333333;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ST ${ticketDetails.fields.Title} - Cerrada</h1>
        </div>
        
        <div class="section">
            <div class="section-title">Información del Ticket</div>
            <div class="info-row">
                <span class="label">ST:</span>
                <span class="value">${ticketDetails.fields.Title}</span>
            </div>
            <div class="info-row">
                <span class="label">Tipo:</span>
                <span class="value">${ticketDetails.fields.Tipo}</span>
            </div>
            <div class="info-row">
                <span class="label">Sistema Afectado:</span>
                <span class="value">${systemName}</span>
            </div>
            <div class="info-row">
                <span class="label">Estado Final:</span>
                <span class="value">${newStatus}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Ubicación</div>
            <div class="info-row">
                <span class="label">Empresa:</span>
                <span class="value">${companyDetails.fields.Title}</span>
            </div>
            <div class="info-row">
                <span class="label">Edificio:</span>
                <span class="value">${buildingDetails.fields.Title}</span>
            </div>
            <div class="info-row">
                <span class="label">Sitio:</span>
                <span class="value">${siteDetails.fields.Title}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Información de Contacto</div>
            ${siteDetails.fields.Nombrecontacto ? `
            <div class="info-row">
                <span class="label">Contacto:</span>
                <span class="value">${siteDetails.fields.Nombrecontacto}</span>
            </div>
            ` : ''}
            ${siteDetails.fields.Correoelectr_x00f3_nico ? `
            <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${siteDetails.fields.Correoelectr_x00f3_nico}</span>
            </div>
            ` : ''}
            ${siteDetails.fields.N_x00fa_merotelefonico ? `
            <div class="info-row">
                <span class="label">Teléfono:</span>
                <span class="value">${siteDetails.fields.N_x00fa_merotelefonico}</span>
            </div>
            ` : ''}
        </div>

        <div class="section">
            <div class="section-title">Documentos</div>
            ${ticketDetails.fields.Descripci_x00f3_n ? `
            <div class="info-row">
                <span class="label">Descripción:</span>
                <span class="value">
                    <a href="${(await service.createShareLink(service.siteId, ticketDetails.fields.Descripci_x00f3_n, "view", "organization")).webUrl}">Ver documento</a>
                </span>
            </div>
            ` : ''}
            ${ticketDetails.fields.Boleta ? `
            <div class="info-row">
                <span class="label">Boleta de Servicio:</span>
                <span class="value">
                    <a href="${(await service.createShareLink(service.siteId, ticketDetails.fields.Boleta, "view", "organization")).webUrl}">Ver documento</a>
                </span>
            </div>
            ` : ''}
            ${ticketDetails.fields.Informe ? `
            <div class="info-row">
                <span class="label">Informe:</span>
                <span class="value">
                    <a href="${(await service.createShareLink(service.siteId, ticketDetails.fields.Informe, "view", "organization")).webUrl}">Ver documento</a>
                </span>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;

          await service.sendEmail({
            toRecipients: ['andres.villalobos@edintel.com'],
            subject: `CERRAR ST ${ticketDetails.fields.Title} / ${companyDetails.fields.Title} / ${ticketDetails.fields.Tipo} / ${systemName}`,
            content: emailContent,
            headers: [
              {
                name: 'References',
                value: ticketDetails.fields.MessageId
              },
              {
                name: 'In-Reply-To',
                value: ticketDetails.fields.MessageId
              }
            ]
          });
        }

        await service.updateTicketStatus(ticketId, newStatus, notes);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        console.error("Error updating ticket:", err);
        setError(err.message || "Error al actualizar el ticket");
      } finally {
        setProcessing(false);
      }
    },
    [service, selectedTicket, closeModal, loadPostVentaData]
  );

  const handleConfirmDate = useCallback(
    async (ticketId, newDate) => {
      if (!ticketId || !newDate) return;

      setProcessing(true);
      setError(null);

      try {
        const ticket = selectedTicket;
        let eventId = ticket.calendarEventId;

        const createCalendarEvent = async (ticket, newDate, technicians = []) => {
          const siteDetails = await service.client
            .api(`/sites/${service.siteId}/lists/${service.config.lists.sites}/items/${ticket.siteId}`)
            .expand('fields')
            .get();

          const buildingDetails = await service.client
            .api(`/sites/${service.siteId}/lists/${service.config.lists.buildings}/items/${siteDetails.fields.EdificioIDLookupId}`)
            .expand('fields')
            .get();

          const companyDetails = await service.client
            .api(`/sites/${service.siteId}/lists/${service.config.lists.companies}/items/${buildingDetails.fields.EmpresaIDLookupId}`)
            .expand('fields')
            .get();

          const attendees = technicians.map(tech => ({
            email: tech.Email,
            name: tech.LookupValue
          }));

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

          return await service.createCalendarEvent(
            service.groupId,
            eventTitle,
            newDate,
            attendees,
            eventBody
          );
        };

        if (eventId) {
          await service.updateCalendarEventDate(
            service.groupId,
            eventId,
            newDate
          );
        } else {
          eventId = await createCalendarEvent(
            ticket,
            newDate,
            ticket.technicians || []
          );
        }

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

  const handleCreateShareLink = useCallback(async (fileId) => {
    try {
      const shareLink = await service.createShareLink(service.siteId, fileId, "view", "organization");

      // Open link in new tab
      window.open(shareLink.webUrl, '_blank');

    } catch (err) {
      console.error('Error creating share link:', err);
      setError(err.message || 'Error al crear enlace compartido');
    }
  }, [service]);

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
    handleCreateShareLink,
  };
};

