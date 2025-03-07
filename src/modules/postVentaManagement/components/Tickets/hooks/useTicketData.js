import { useMemo } from "react";
import { usePostVentaManagement } from "../../../context/postVentaManagementContext";

export const useTicketData = ({
  searchTerm = "",
  startDate = "",
  endDate = "",
  selectedState = [],
  selectedUsers = [],
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

  // Get tickets assigned to current user - memoized
  const getTicketsAssignedToMe = useMemo(() => {
    if (!userRole?.employee?.LookupId) return [];
    return serviceTickets.filter((ticket) =>
      ticket.technicians.some(
        (tech) => tech.LookupId === userRole.employee.LookupId
      )
    );
  }, [serviceTickets, userRole]);

  // Filter and sort tickets based on criteria - memoized
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
        
        // User filter
        if (selectedUsers.length > 0) {
          const isUserInvolved = selectedUsers.some((userId) => {
            const isAssignedTech = ticket.technicians.some(
              (tech) => tech.LookupId === userId
            );
            const siteDetails = getSiteDetails(ticket.siteId);
            const isSupervisor = siteDetails?.site?.supervisorId === userId;
            return isAssignedTech || isSupervisor;
          });
          if (!isUserInvolved) return false;
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