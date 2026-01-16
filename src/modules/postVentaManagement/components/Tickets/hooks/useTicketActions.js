// src/modules/postVentaManagement/components/Tickets/hooks/useTicketActions.js
import { useState, useCallback } from "react";
import { usePostVentaManagement } from "../../../context/postVentaManagementContext";
import { MODAL_TYPES } from "../modals";
import emailConfig from "../../../../expenseAudit/config/expenseAudit.config";

export const useTicketActions = () => {
  const { service, loadPostVentaData, roles } = usePostVentaManagement();

  // Modal state
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const supportEmail = emailConfig.supportEmail;

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


  const handleReassignTechnicians = useCallback(
  async (ticketId, newTechnicianIds) => {
    setProcessing(true);
    setError(null);
    try {
      const currentTicket = await service.getTicketById(ticketId);

      // Determinar cuáles son los técnicos "anteriores"
      const previousTechIds = currentTicket.reassignedTechnicians?.length > 0
        ? currentTicket.reassignedTechnicians.map(t => t.LookupId)
        : currentTicket.technicians.map(t => t.LookupId);

      // ✅ ACTUALIZADO: Pasar el array de roles como cuarto parámetro
      await service.reassignTechniciansWithHistory(
        ticketId,
        newTechnicianIds,
        previousTechIds,
        roles  // ← AGREGAR ESTE PARÁMETRO
      );

      if (currentTicket.calendarEventId && currentTicket.tentativeDate) {
        const techDetails = await Promise.all(
          newTechnicianIds.map(async (techId) => {
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

        if (validAttendees.length > 0) {
          await service.updateCalendarEventAttendees(
            service.groupId,
            currentTicket.calendarEventId,
            validAttendees
          );
        }
      }

      await loadPostVentaData();
      closeModal();

      console.log('✅ Reasignación completada con éxito');
    } catch (err) {
      console.error("Error al reasignar técnicos:", err);
      setError(err.message || "Error al reasignar técnicos");
    } finally {
      setProcessing(false);
    }
  },
  [service, roles, closeModal, loadPostVentaData]
);
  // VERSIÓN CORREGIDA DE handleUpdateStatus
  // Reemplazar el método completo en useTicketActions.js

  const handleUpdateStatus = useCallback(
    async (ticketId, newStatus, files = null, notes = '') => {
      if (!ticketId || !newStatus) return;

      setProcessing(true);
      setError(null);

      try {
        if ((newStatus === "Finalizada" || newStatus === "Trabajo Parcial") && files) {
          // Upload service tickets
          if (files.serviceTickets?.length > 0) {
            for (const serviceTicket of files.serviceTickets) {
              await service.uploadTicketDocument(
                ticketId,
                serviceTicket.file,
                'serviceTicket',
                serviceTicket.displayName
              );
            }
          }

          // Upload report if exists
          if (files.report) {
            await service.uploadTicketDocument(
              ticketId,
              files.report.file,
              'report',
              files.report.displayName
            );
          }
        }

        if (newStatus === "Cerrada") {
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
            .get()).fields.Title;

          // Get all documents
          const [generalDocs, adminDocs] = await Promise.all([
            service.getGeneralDocuments(ticketId),
            service.getAdminDocuments(ticketId)
          ]);

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
        .notes-section {
            background-color: #fff9e6;
            border-left: 4px solid #ffa500;
            padding: 12px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .notes-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
        }
        .notes-content {
            white-space: pre-wrap;
            color: #555;
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

        ${notes ? `
        <div class="notes-section">
            <div class="notes-title">📝 Notas de Cierre:</div>
            <div class="notes-content">${notes}</div>
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">Documentos</div>
            ${await Promise.all(generalDocs.map(async doc => {
            const shareLink = await service.createShareLink(service.siteId, doc.itemId, "view", "organization");
            return `
              <div class="info-row">
                <span class="label">${doc.documentType === 'serviceTicket' ? 'Boleta de Servicio' :
                doc.documentType === 'report' ? 'Informe' :
                  doc.documentType === 'image' ? 'Imagen' : 'Documento'}:</span>
                <span class="value">
                  <a href="${shareLink.webUrl}">Ver documento</a>
                </span>
              </div>`;
          })).then(links => links.join(''))}
            
            ${await Promise.all(adminDocs.map(async doc => {
            const shareLink = await service.createShareLink(service.admins.siteId, doc.itemId, "view", "organization");
            return `
              <div class="info-row">
                <span class="label">Documento Administrativo:</span>
                <span class="value">
                  <a href="${shareLink.webUrl}">Ver documento</a>
                </span>
              </div>`;
          })).then(links => links.join(''))}
        </div>
    </div>
</body>
</html>`;

           await service.sendEmail({
            toRecipients: [supportEmail],
            subject: `CERRAR ST ${ticketDetails.fields.Title} / ${companyDetails.fields.Title} / ${ticketDetails.fields.Tipo} / ${systemName}`,
            content: emailContent,
          }); 
        }

        
        if (newStatus === "Cerrada") {
          // For closed status, notes should go to closeNotes parameter (4th param)
          await service.updateTicketStatus(ticketId, newStatus, "", notes);
        } else if (newStatus === "Trabajo Parcial" || newStatus === "Finalizada") {
          // For these statuses, notes go to regular notes parameter (3rd param)
          await service.updateTicketStatus(ticketId, newStatus, notes, "");
        } else {
          // For other statuses, no notes needed
          await service.updateTicketStatus(ticketId, newStatus);
        }
        
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        console.error("Error updating ticket:", err);
        setError(err.message || "Error al actualizar el ticket");
      } finally {
        setProcessing(false);
      }
    },
    [service, closeModal, loadPostVentaData, supportEmail]
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

        // Make sure filesToDelete is properly passed
        const transformedData = {
          ...data,
          filesToDelete: data.filesToDelete || [],
          filesToUpload: data.filesToUpload?.map(file => ({
            type: file.type,
            file: file.file?.file || file.file,
            displayName: file.displayName || file.file?.displayName
          }))
        };
        ;
        await service.updateTicket(ticketId, transformedData);
        await loadPostVentaData();
        closeModal();
      } catch (err) {
        console.error("Error editing ticket:", err);
        setError(err.message || "Error al actualizar el ticket");
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


  const handleFileDownload = useCallback(async (file) => {
    if (!file?.itemId) return;

    try {
      const siteId = file.source === 'admin' ? service.admins.siteId : service.siteId;
      const driveId = file.source === 'admin' ? service.admins.driveId : service.driveId;

      // Get download URL
      const { url, token } = await service.getFile(
        siteId,
        driveId,
        file.itemId
      );

      // Download file
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error downloading file");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${file.fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      setError("Error al descargar el archivo");
    }
  }, [service]);

  // Helper functions for determining modal state
  const isStatusOrScheduleModal = useCallback(() => {
    return (
      currentModal?.type === MODAL_TYPES.UPDATE_STATUS ||
      currentModal?.type === MODAL_TYPES.SCHEDULE_DATE
    );
  }, [currentModal]);

  const handleCreateShareLink = useCallback(async (file) => {
    try {
      const siteId = file.source === 'admin' ? service.admins.siteId : service.siteId;
      const shareLink = await service.createShareLink(siteId, file.itemId, "view", "organization");

      // Open link in new tab
      window.open(shareLink.webUrl, '_blank');
    } catch (err) {
      console.error('Error creating share link:', err);
      setError('Error al crear enlace compartido');
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
    handleReassignTechnicians,
  };
};