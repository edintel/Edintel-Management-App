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

const TicketList = () => {
  const { systems, roles, loading: contextLoading } = usePostVentaManagement();
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