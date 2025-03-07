import React, { useEffect, useState, useMemo } from "react";
import { usePostVentaManagement } from "../../../../context/postVentaManagementContext";
import { useTicketData } from "../../hooks/useTicketData";
import { useTicketState } from "../../hooks/useTicketState";
import { useTicketActions } from "../../hooks/useTicketActions";
import { MODAL_TYPES } from "../../modals";
import ListHeader from "./components/ListHeader";
import ListFilters from "./components/ListFilters";
import ListTable from "./components/ListTable";
import Pagination from "./components/Pagination";
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
  
  // Calculate pagination values with useMemo for optimization
  const paginationData = useMemo(() => {
    const totalItems = filteredTickets.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    // Get current page of tickets
    const currentItems = filteredTickets.slice(startIndex, endIndex);
    
    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex,
    };
  }, [filteredTickets, currentPage, itemsPerPage]);
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Removed automatic scroll to top to maintain user's current scroll position
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
      
      {/* Table with current page of tickets */}
      <ListTable
        tickets={paginationData.currentItems}
        getSiteDetails={getSiteDetails}
        onDownloadFile={handleFileDownload}
        onEditTicket={(ticket) => openModal(MODAL_TYPES.EDIT_TICKET, ticket)}
        onDeleteTicket={(ticket) =>
          openModal(MODAL_TYPES.DELETE_TICKET, ticket)
        }
        onAssignTechnician={(ticket) =>
          openModal(MODAL_TYPES.ASSIGN_TECH, ticket)
        }
        onUpdateStatus={(ticket) =>
          openModal(MODAL_TYPES.UPDATE_STATUS, ticket)
        }
        onOpenModal={openModal}
        systems={systems}
        loading={loading}
      />
      
      {/* Pagination Component */}
      {filteredTickets.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginationData.totalPages}
          totalItems={paginationData.totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          startIndex={paginationData.startIndex + 1}
          endIndex={paginationData.endIndex}
        />
      )}
      
      {/* Modals */}
      <AssignTechnicianModal
        isOpen={currentModal?.type === MODAL_TYPES.ASSIGN_TECH}
        onClose={closeModal}
        onSubmit={(techIds) =>
          handleAssignTechnicians(selectedTicket?.id, techIds)
        }
        ticket={selectedTicket}
        roles={roles}
        processing={processing}
        error={error}
      />
      <TicketActionsModal
        isOpen={
          currentModal?.type === MODAL_TYPES.UPDATE_STATUS ||
          currentModal?.type === MODAL_TYPES.SCHEDULE_DATE
        }
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