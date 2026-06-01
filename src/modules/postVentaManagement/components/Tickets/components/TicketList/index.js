import React, { useState, useEffect } from "react";
import { usePostVentaManagement } from "../../../../context/postVentaManagementContext";
import { useTicketData } from "../../hooks/useTicketData";
import { useTicketState } from "../../hooks/useTicketState";
import { useTicketActions } from "../../hooks/useTicketActions";
import { MODAL_TYPES } from "../../modals";
import ListHeader from "./components/ListHeader";
import ListFilters from "./components/ListFilters";
import ListTable from "./components/ListTable";
import {
  AssignTechnicianModal,
  TicketActionsModal,
  TicketEditModal,
  DeleteTicketModal,
} from "../../modals";
import { AlertTriangle, RefreshCw, CheckCircle, ChevronDown, ChevronUp, Mail } from "lucide-react";

const TicketList = () => {
  const { systems, roles, loading: contextLoading, service } = usePostVentaManagement();

  // ── Correo pendiente de reenvío ──────────────────────────────────────────
  const [pendingEmail, setPendingEmail]       = useState(null);
  const [resending, setResending]             = useState(false);
  const [resendSuccess, setResendSuccess]     = useState(false);
  const [resendError, setResendError]         = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pendingSTEmail');
    if (stored) {
      try { setPendingEmail(JSON.parse(stored)); } catch { /* ignorar JSON inválido */ }
    }
  }, []);

  const handleResendEmail = async () => {
    if (!pendingEmail || !service) return;
    setResending(true);
    setResendError(null);
    try {
      await service.sendEmailWithRetry({
        toRecipients: pendingEmail.toRecipients,
        subject: pendingEmail.subject,
        content: pendingEmail.emailContent,
      });
      localStorage.removeItem('pendingSTEmail');
      setResendSuccess(true);
      setTimeout(() => {
        setPendingEmail(null);
        setResendSuccess(false);
      }, 3000);
    } catch (err) {
      const status = err.statusCode || 'N/A';
      const code   = err.graphCode  || 'N/A';
      setResendError(`HTTP ${status} | Graph: ${code} | ${err.message}`);
      // Actualizar el error guardado en localStorage con el nuevo intento
      localStorage.setItem('pendingSTEmail', JSON.stringify({
        ...pendingEmail,
        error: { message: err.message, statusCode: err.statusCode || null, graphCode: err.graphCode || null },
        lastRetry: new Date().toISOString(),
      }));
    } finally {
      setResending(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────
  const {
    searchTerm,
    setSearchTerm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedState,
    setSelectedState,
    selectedUsers,
    setSelectedUsers,
    resetFilters,
    hasActiveFilters,
  } = useTicketState();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [waitingEquipment, setWaitingEquipment] = useState(false);

  const {
    filteredTickets,
    getSiteDetails,
    loading: dataLoading,
  } = useTicketData({
    searchTerm,
    startDate,
    endDate,
    selectedState,
    selectedUsers,
    waitingEquipment,
  });

  const {
    currentModal = null,
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
  } = useTicketActions();

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedState, selectedUsers]);

  const loading = contextLoading || dataLoading;

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page
  };

  useEffect(() => {
    closeModal();
  }, [closeModal]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <ListHeader total={filteredTickets.length} />

      {/* Banner: correo pendiente de reenvío */}
      {pendingEmail && (
        <div className={`rounded-xl border-2 shadow-md overflow-hidden ${resendSuccess ? 'border-green-400' : 'border-orange-400'}`}>
          {resendSuccess ? (
            <div className="flex items-center gap-4 bg-green-50 p-5">
              <CheckCircle size={36} className="shrink-0 text-green-500" />
              <div>
                <p className="text-lg font-bold text-green-900">¡Correo reenviado exitosamente!</p>
                <p className="text-sm text-green-700">La notificación de la ST {pendingEmail.stNumber} fue enviada.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cabecera naranja */}
              <div className="flex items-center gap-3 bg-orange-500 px-5 py-3">
                <AlertTriangle size={28} className="shrink-0 text-white" />
                <p className="text-white font-bold text-base tracking-wide uppercase">
                  ⚠️ Correo no enviado — ST {pendingEmail.stNumber}
                </p>
              </div>

              <div className="bg-orange-50 p-5 space-y-4">
                {/* Descripción + datos */}
                <div className="space-y-1">
                  <p className="text-orange-900 font-semibold">
                    La ST fue creada correctamente, pero el correo de notificación <span className="underline decoration-orange-500">no se envió</span>. Debe reenviarse manualmente.
                  </p>
                  <p className="text-sm text-orange-800"><span className="font-semibold">Destinatario:</span> {pendingEmail.toRecipients?.join(', ')}</p>
                  <p className="text-sm text-orange-800"><span className="font-semibold">Asunto:</span> {pendingEmail.subject}</p>
                  <p className="text-sm text-orange-800"><span className="font-semibold">Falló el:</span> {pendingEmail.timestamp ? new Date(pendingEmail.timestamp).toLocaleString('es-CR') : '—'}</p>
                </div>

                {/* Error técnico siempre visible */}
                <div className="bg-white border border-orange-300 rounded-lg px-4 py-3 space-y-1">
                  <p className="font-bold text-orange-900 text-sm mb-1">Motivo del fallo:</p>
                  <p className="text-sm font-mono text-orange-800 break-all">{pendingEmail.error?.message || 'Error desconocido'}</p>
                  {pendingEmail.error?.statusCode && (
                    <p className="text-sm text-orange-700">
                      <span className="font-semibold">Código HTTP:</span> {pendingEmail.error.statusCode}
                      {pendingEmail.error.statusCode === 429 && <span className="ml-2 text-red-700 font-semibold">(Throttling — demasiadas llamadas seguidas a Microsoft Graph)</span>}
                      {pendingEmail.error.statusCode === 401 && <span className="ml-2 text-red-700 font-semibold">(Token expirado — reenvía ahora para obtener uno nuevo)</span>}
                    </p>
                  )}
                  {pendingEmail.error?.graphCode && (
                    <p className="text-sm text-orange-700"><span className="font-semibold">Código Graph:</span> {pendingEmail.error.graphCode}</p>
                  )}
                </div>

                {/* Error del último intento de reenvío */}
                {resendError && (
                  <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3">
                    <p className="font-bold text-red-900 text-sm mb-1">El reenvío también falló:</p>
                    <p className="text-sm font-mono text-red-800 break-all">{resendError}</p>
                  </div>
                )}

                {/* Botón reenviar */}
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow text-sm"
                >
                  {resending ? (
                    <><RefreshCw size={18} className="animate-spin" />Reenviando (puede tardar unos segundos)...</>
                  ) : (
                    <><Mail size={18} />Reenviar correo ahora</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <ListFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        selectedState={selectedState}
        onStateChange={setSelectedState}
        selectedUsers={selectedUsers}
        onUsersChange={setSelectedUsers}
        roles={roles}
        onResetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
        waitingEquipment={waitingEquipment}
        onWaitingEquipmentChange={setWaitingEquipment}
      />

      {/* Table with pagination */}
      <ListTable
        tickets={filteredTickets}
        getSiteDetails={getSiteDetails}
        onDownloadFile={handleFileDownload}
        onEditTicket={(ticket) => openModal(MODAL_TYPES.EDIT_TICKET, ticket)}
        onDeleteTicket={(ticket) => openModal(MODAL_TYPES.DELETE_TICKET, ticket)}
        onAssignTechnician={(ticket) => openModal(MODAL_TYPES.ASSIGN_TECH, ticket)}
        onUpdateStatus={(ticket) => openModal(MODAL_TYPES.UPDATE_STATUS, ticket)}
        onOpenModal={openModal}
        systems={systems}
        loading={loading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Modals */}
      <AssignTechnicianModal
        isOpen={currentModal?.type === MODAL_TYPES.ASSIGN_TECH}
        onClose={closeModal}
        onSubmit={(techIds) => handleAssignTechnicians(selectedTicket?.id, techIds)}
        ticket={selectedTicket}
        roles={roles}
        processing={processing}
        error={error}
      />
      <TicketActionsModal
        isOpen={currentModal?.type === MODAL_TYPES.UPDATE_STATUS || currentModal?.type === MODAL_TYPES.SCHEDULE_DATE}
        onClose={closeModal}
        onUpdateStatus={handleUpdateStatus}
        onConfirmDate={handleConfirmDate}
        ticket={selectedTicket}
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

export default React.memo(TicketList);