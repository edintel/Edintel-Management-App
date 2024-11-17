// src/modules/postVentaManagement/components/Tickets/hooks/useTicketActions.js
import { useState, useCallback } from 'react';
import { usePostVentaManagement } from '../../../context/postVentaManagementContext';
import { MODAL_TYPES } from '../modals';

export const useTicketActions = () => {
  const { service, loadPostVentaData } = usePostVentaManagement();
  
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

  const handleAssignTechnicians = useCallback(async (ticketId, technicians) => {
    setProcessing(true);
    setError(null);
    try {
      await service.assignTechnicians(ticketId, technicians);
      await loadPostVentaData();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [service, closeModal, loadPostVentaData]);

  const handleUpdateStatus = useCallback(async (ticketId, newStatus) => {
    if (!ticketId || !newStatus) return;
    
    setProcessing(true);
    setError(null);
    try {
      await service.updateTicketStatus(ticketId, newStatus);
      await loadPostVentaData();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [service, closeModal, loadPostVentaData]);

  const handleConfirmDate = useCallback(async (ticketId, newDate) => {
    if (!ticketId || !newDate) return;
    
    setProcessing(true);
    setError(null);
    try {
      await service.updateSTDate(ticketId, newDate, selectedTicket?.calendarEventId);
      await loadPostVentaData();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [service, closeModal, loadPostVentaData, selectedTicket]);

  const handleEditTicket = useCallback(async (ticketId, data) => {
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
  }, [service, closeModal, loadPostVentaData]);

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

  const handleFileDownload = useCallback(async (itemId, fileName) => {
    if (!itemId) return;

    try {
      const fileMetadata = await service.client
        .api(`/sites/${service.siteId}/drives/${service.driveId}/items/${itemId}`)
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

      const fileExtension = fileMetadata.name.split('.').pop();
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
      setError('Error downloading file');
    }
  }, [service]);

  // Helper functions for determining modal state
  const isStatusOrScheduleModal = useCallback(() => {
    return currentModal?.type === MODAL_TYPES.UPDATE_STATUS || 
           currentModal?.type === MODAL_TYPES.SCHEDULE_DATE;
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
    handleFileDownload
  };
};

export default useTicketActions;