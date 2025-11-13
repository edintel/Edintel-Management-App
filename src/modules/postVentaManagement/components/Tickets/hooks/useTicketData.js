import { useMemo } from "react";
import { usePostVentaManagement } from "../../../context/postVentaManagementContext";

export const useTicketData = ({
  searchTerm = "",
  startDate = "",
  endDate = "",
  selectedState = [],
  selectedUsers = [],
  waitingEquipment = false,
} = {}) => {
  const {
    serviceTickets,
    getSiteDetails,
    companies,
    buildings,
    sites,
    systems,
    roles,
    userRole,
    loading,
    error,
  } = usePostVentaManagement();


  const getTicketsAssignedToMe = useMemo(() => {
    if (!userRole?.employee?.LookupId) return [];

    const myId = userRole.employee.LookupId;

    return serviceTickets.filter((ticket) => {

      const isInitialTech = ticket.technicians.some(
        (tech) => tech.LookupId === myId
      );


      const isReassignedTech = ticket.reassignedTechnicians?.some(
        (tech) => tech.LookupId === myId
      );

      let isInHistory = false;
      if (ticket.reassignmentHistory && Array.isArray(ticket.reassignmentHistory)) {
        isInHistory = ticket.reassignmentHistory.some(entry => {
          if (entry.type === "reassignment") {
            // Verificar en técnicos anteriores y nuevos
            const inPrevious = entry.previousTechnicians?.some(t => t.id === myId);
            const inNew = entry.newTechnicians?.some(t => t.id === myId);
            return inPrevious || inNew;
          }
          return false;
        });
      }

      return isInitialTech || isReassignedTech || isInHistory;
    });
  }, [serviceTickets, userRole]);

  // Filter and sort tickets based on criteria 
  const filteredTickets = useMemo(() => {
    let tickets = [];

    // Get appropriate tickets based on user role
    if (userRole?.role === "Técnico") {
      tickets = getTicketsAssignedToMe;
    } else {
      tickets = serviceTickets;
    }

    // Apply filters
    return tickets
      .filter((ticket) => {
        // Date filter
        if (startDate && endDate) {
          const ticketDate = ticket.tentativeDate
            ? new Date(ticket.tentativeDate).getTime()
            : 0;
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
          if (ticketDate < start || ticketDate > end) return false;
        }

        // Status filter
        if (selectedState.length > 0 && !selectedState.includes(ticket.state)) return false;

        if (selectedUsers.length > 0) {
          const isUserInvolved = selectedUsers.some((userId) => {
            // Verificar asignación inicial
            const isAssignedTech = ticket.technicians.some(
              (tech) => tech.LookupId === userId
            );


            const isReassignedTech = ticket.reassignedTechnicians?.some(
              (tech) => tech.LookupId === userId
            );


            let isInHistory = false;
            if (ticket.reassignmentHistory && Array.isArray(ticket.reassignmentHistory)) {
              isInHistory = ticket.reassignmentHistory.some(entry => {
                if (entry.type === "reassignment") {
                  const inPrevious = entry.previousTechnicians?.some(t => t.id === userId);
                  const inNew = entry.newTechnicians?.some(t => t.id === userId);
                  return inPrevious || inNew;
                }
                return false;
              });
            }

            // Verificar supervisor
            const siteDetails = getSiteDetails(ticket.siteId);
            const isSupervisor = siteDetails?.site?.supervisorId === userId;

            return isAssignedTech || isReassignedTech || isInHistory || isSupervisor;
          });
          if (!isUserInvolved) return false;
        }


        if (waitingEquipment && !ticket.waitingEquiment) {
          return false;
        }

        // Search term filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          const siteDetails = getSiteDetails(ticket.siteId);
          return (
            ticket.stNumber?.toLowerCase().includes(search) ||
            siteDetails?.site?.name?.toLowerCase().includes(search) ||
            siteDetails?.building?.name?.toLowerCase().includes(search) ||
            siteDetails?.company?.name?.toLowerCase().includes(search) ||
            ticket.type?.toLowerCase().includes(search)
          );
        }

        return true;
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
  }, [
    serviceTickets,
    searchTerm,
    startDate,
    endDate,
    selectedState,
    selectedUsers,
    waitingEquipment,
    getSiteDetails,
    getTicketsAssignedToMe,
    userRole?.role,
  ]);

  // Memoize ticket states
  const ticketStates = useMemo(
    () => [
      "Iniciada",
      "Técnico asignado",
      "Confirmado por técnico",
      "Trabajo iniciado",
      "Trabajo Parcial",
      "Finalizada",
      "Cerrada",
    ],
    []
  );

  // Memoize technicians list
  const technicians = useMemo(() => {
    return roles
      .filter((role) => role.role === "Técnico" && role.employee)
      .map((role) => ({
        id: role.employee.LookupId,
        name: role.employee.LookupValue,
        email: role.employee.Email,
      }));
  }, [roles]);

  // Memoize available systems function
  const getAvailableSystems = useMemo(
    () => (siteId) => {
      const site = sites.find((s) => s.id === siteId);
      return site?.systems || [];
    },
    [sites]
  );

  // Memoize location data
  const locationData = useMemo(() => {
    return companies.map((company) => ({
      ...company,
      buildings: buildings
        .filter((building) => building.companyId === company.id)
        .map((building) => ({
          ...building,
          sites: sites.filter((site) => site.buildingId === building.id),
        })),
    }));
  }, [companies, buildings, sites]);

  return {
    filteredTickets,
    getTicketsAssignedToMe,
    ticketStates,
    technicians,
    locationData,
    systems,
    getAvailableSystems,
    getSiteDetails,
    roles,
    loading,
    error,
  };
};