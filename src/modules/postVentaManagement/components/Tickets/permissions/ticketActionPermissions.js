// Action types constants
export const TICKET_ACTIONS = {
  ASSIGN_TECH: "assign_tech",
  UPDATE_STATUS: "update_status",
  SCHEDULE_DATE: "schedule_date",
  EDIT: "edit",
  DELETE: "delete",
};

// User role checks
const isAdmin = (userRole) => userRole?.role === "Administrativo";
const isSupervisor = (userRole) => userRole?.role === "Supervisor";
const isAssignedToTicket = (ticket, userRole) => {
  return ticket.technicians?.some(
    (tech) => tech.LookupId === userRole?.employee?.LookupId
  );
};

// States where supervisors can edit and delete
const SUPERVISOR_EDITABLE_STATES = [
  "Iniciada",
  "Técnico asignado",
  "Confirmado por técnico",
  "Trabajo iniciado",
  "Finalizada",
];

// Check if the ticket is in a supervisor-editable state
const isInSupervisorEditableState = (ticket) => {
  return SUPERVISOR_EDITABLE_STATES.includes(ticket.state);
};

// Check if user can edit/delete based on role and state
const canEditDelete = (ticket, userRole) => {
  // Admins can edit/delete in any state
  if (isAdmin(userRole)) return true;

  // Supervisors can only edit/delete in specific states
  if (isSupervisor(userRole)) {
    return isInSupervisorEditableState(ticket);
  }

  return false;
};

// Define permission checks for each action and state
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
  },
  "Técnico asignado": {
    [TICKET_ACTIONS.ASSIGN_TECH]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole),
    [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) =>
      isAdmin(userRole) ||
      isSupervisor(userRole) ||
      isAssignedToTicket(ticket, userRole),
    [TICKET_ACTIONS.SCHEDULE_DATE]: (ticket, userRole) =>
      isAdmin(userRole) ||
      isSupervisor(userRole) ||
      isAssignedToTicket(ticket, userRole),
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
  },
  "Confirmado por técnico": {
    [TICKET_ACTIONS.ASSIGN_TECH]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole),
    [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) =>
      isAdmin(userRole) ||
      isSupervisor(userRole) ||
      isAssignedToTicket(ticket, userRole),
    [TICKET_ACTIONS.SCHEDULE_DATE]: (ticket, userRole) =>
      isAdmin(userRole) ||
      isSupervisor(userRole) ||
      isAssignedToTicket(ticket, userRole),
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) =>
      canEditDelete(ticket, userRole),
  },
  "Trabajo iniciado": {
    [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) =>
      isAdmin(userRole) ||
      isSupervisor(userRole) ||
      isAssignedToTicket(ticket, userRole),
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) => isAdmin(userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) => isAdmin(userRole),
  },
  Finalizada: {
    [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) =>
      isAdmin(userRole) || isSupervisor(userRole),
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) => isAdmin(userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) => isAdmin(userRole),
  },
  Cerrada: {
    [TICKET_ACTIONS.EDIT]: (ticket, userRole) => isAdmin(userRole),
    [TICKET_ACTIONS.DELETE]: (ticket, userRole) => isAdmin(userRole),
  },
};

// Get available actions for a ticket based on user role and ticket state
export const getAvailableActions = (ticket, userRole) => {
  if (!ticket || !userRole) return [];

  const actions = new Set();

  // Get state-specific actions
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
  if (!ticket || !userRole) return false;

  // Check state-specific permissions
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
    "Trabajo iniciado": ["Finalizada"],
    Finalizada: ["Cerrada"],
    Cerrada: [],
  };

  return statusFlow[currentState] || [];
};
