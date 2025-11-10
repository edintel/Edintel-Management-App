// src/modules/postVentaManagement/components/Tickets/permissions/ticketActionPermissions.js
export const TICKET_ACTIONS = {
  ASSIGN_TECH: "assign_tech",
  REASSIGN_TECH: "reassign_tech", // Nueva acción
  UPDATE_STATUS: "update_status",
  SCHEDULE_DATE: "schedule_date",
  EDIT: "edit",
  DELETE: "delete",
  CREATE: "create",
  VIEW_SHAREPOINT_LINK: "view_sharepoint_link",
  UPDATE_PARCIAL: "update_parcial"
};

const isAdmin = (userRole) => userRole?.role === "Administrativo";
const isSupervisor = (userRole) => userRole?.role === "Supervisor";
const isCommercial = (userRole) => userRole?.role === "Comercial";
const isAssignedToTicket = (ticket, userRole) => {
  return ticket.technicians?.some(
    (tech) => tech.LookupId === userRole?.employee?.LookupId
  );
};

const SUPERVISOR_EDITABLE_STATES = [
  "Iniciada",
  "Técnico asignado",
  "Confirmado por técnico",
  "Trabajo iniciado",
  "Finalizada",
];

const isInSupervisorEditableState = (ticket) => {
  return SUPERVISOR_EDITABLE_STATES.includes(ticket.state);
};

const canViewSharePointLink = (ticket, userRole) => {
  return isAdmin(userRole) || isSupervisor(userRole);
};

const canEditDelete = (ticket, userRole) => {
  if (isAdmin(userRole)) return true;
  if (isSupervisor(userRole)) {
    return isInSupervisorEditableState(ticket);
  }
  return false;
};

const canCreate = (userRole) => {
  return isAdmin(userRole) || isSupervisor(userRole) || isCommercial(userRole);
};

// Los mismos permisos que ASSIGN_TECH
const canReassignTech = (ticket, userRole) => {
  return isAdmin(userRole) || isSupervisor(userRole);
};

const statePermissions = {
  Iniciada: {
    [TICKET_ACTIONS.ASSIGN_TECH]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole),
    [TICKET_ACTIONS.SCHEDULE_DATE]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole),
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.VIEW_SHAREPOINT_LINK]: (ticket, userRole) =>
      canViewSharePointLink(ticket, userRole),
  },
  "Técnico asignado": {
    [TICKET_ACTIONS.ASSIGN_TECH]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole),
    [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole) || isAssignedToTicket(ticket, userRole),
    [TICKET_ACTIONS.SCHEDULE_DATE]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole),
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.VIEW_SHAREPOINT_LINK]: (ticket, userRole) =>
      canViewSharePointLink(ticket, userRole),
  },
  "Confirmado por técnico": {
    [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole) || isAssignedToTicket(ticket, userRole),
    [TICKET_ACTIONS.SCHEDULE_DATE]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole),
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.VIEW_SHAREPOINT_LINK]: (ticket, userRole) =>
      canViewSharePointLink(ticket, userRole),
  },
  "Trabajo iniciado": {
    [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole) || isAssignedToTicket(ticket, userRole),
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.VIEW_SHAREPOINT_LINK]: (ticket, userRole) =>
      canViewSharePointLink(ticket, userRole),
  },
  "Trabajo Parcial": {
    [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole) || isAssignedToTicket(ticket, userRole),
    [TICKET_ACTIONS.REASSIGN_TECH]: (ticket, userRole) =>
      canReassignTech(ticket, userRole), // Nueva acción para estado parcial
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) => isAdmin(userRole),
    [TICKET_ACTIONS.UPDATE_PARCIAL]: (ticket, userRole) => true,
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) => isAdmin(userRole),
    [TICKET_ACTIONS.VIEW_SHAREPOINT_LINK]: (ticket, userRole) =>
      canViewSharePointLink(ticket, userRole),
  },
  Finalizada: {
    [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole),
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) => isAdmin(userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) => isAdmin(userRole),
    [TICKET_ACTIONS.VIEW_SHAREPOINT_LINK]: (ticket, userRole) =>
      canViewSharePointLink(ticket, userRole),
  },
  Cerrada: {
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) => isAdmin(userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) => isAdmin(userRole),
    [TICKET_ACTIONS.VIEW_SHAREPOINT_LINK]: (ticket, userRole) =>
      canViewSharePointLink(ticket, userRole),
  },
};

// Get available actions for a ticket based on user role and ticket state
export const getAvailableActions = (ticket, userRole) => {
  if (!ticket || !userRole) return [];

  if (!ticket && canCreate(userRole)) {
    return [TICKET_ACTIONS.CREATE];
  }

  const actions = new Set();
  const stateActions = statePermissions[ticket.state] || {};
  Object.entries(stateActions).forEach(([action, check]) => {
    if (check(ticket, userRole)) {
      actions.add(action);
    }
  });

  return Array.from(actions);
};

// Check if a specific action is allowed
export const isActionAllowed = (action, ticket, userRole) => {
  if (action === TICKET_ACTIONS.CREATE) {
    return canCreate(userRole);
  }

  if (!ticket || !userRole) return false;
  const stateActions = statePermissions[ticket.state] || {};
  const check = stateActions[action];
  return check ? check(ticket, userRole) : false;
};

// Get next available status based on current state
export const getNextAvailableStatus = (currentState) => {
  const statusFlow = {
    Iniciada: ["Técnico asignado"],
    "Técnico asignado": ["Confirmado por técnico"],
    "Confirmado por técnico": ["Trabajo iniciado"],
    "Trabajo iniciado": ["Trabajo Parcial", "Finalizada"],
    "Trabajo Parcial": ["Finalizada"],
    Finalizada: ["Cerrada"],
    Cerrada: [],
  };

  return statusFlow[currentState] || [];
};