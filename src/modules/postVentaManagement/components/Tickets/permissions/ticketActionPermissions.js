// src/modules/postVentaManagement/components/Tickets/permissions/ticketActionPermissions.js

// Action types constants
export const TICKET_ACTIONS = {
    ASSIGN_TECH: 'assign_tech',
    UPDATE_STATUS: 'update_status',
    SCHEDULE_DATE: 'schedule_date',
    EDIT: 'edit',
    DELETE: 'delete'
  };
  
  // User role checks
  const isAdmin = (userRole) => userRole?.role === 'Administrativo';
  const isSupervisor = (userRole) => userRole?.role === 'Supervisor';
  const isAssignedToTicket = (ticket, userRole) => {
    return ticket.technicians?.some(
      tech => tech.LookupId === userRole?.employee?.LookupId
    );
  };
  
  // Administrative actions that only admins can perform
  const isAdministrativeAction = (action, userRole) => {
    if ([TICKET_ACTIONS.EDIT, TICKET_ACTIONS.DELETE].includes(action)) {
      return isAdmin(userRole);
    }
    return false;
  };
  
  // Check if user can manage ticket (admin or supervisor)
  const canManageTicket = (userRole) => {
    return isAdmin(userRole) || isSupervisor(userRole);
  };
  
  // Define permission checks for each action and state
  const statePermissions = {
    'Iniciada': {
      [TICKET_ACTIONS.ASSIGN_TECH]: (ticket, userRole) => canManageTicket(userRole),
      [TICKET_ACTIONS.SCHEDULE_DATE]: (ticket, userRole) => canManageTicket(userRole)
    },
    'Técnico asignado': {
      [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) => 
        canManageTicket(userRole) || isAssignedToTicket(ticket, userRole),
      [TICKET_ACTIONS.SCHEDULE_DATE]: (ticket, userRole) => 
        canManageTicket(userRole) || isAssignedToTicket(ticket, userRole)
    },
    'Confirmado por tecnico': {
      [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) => 
        canManageTicket(userRole) || isAssignedToTicket(ticket, userRole),
      [TICKET_ACTIONS.SCHEDULE_DATE]: (ticket, userRole) => 
        canManageTicket(userRole) || isAssignedToTicket(ticket, userRole)
    },
    'Trabajo iniciado': {
      [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) => 
        canManageTicket(userRole) || isAssignedToTicket(ticket, userRole)
    },
    'Finalizada': {
      [TICKET_ACTIONS.UPDATE_STATUS]: (ticket, userRole) => canManageTicket(userRole)
    },
    'Cerrada': {
      // No actions available in closed state
    }
  };
  
  // Get available actions for a ticket based on user role and ticket state
  export const getAvailableActions = (ticket, userRole) => {
    if (!ticket || !userRole) return [];
  
    const actions = new Set();
  
    // Add state-specific actions
    const stateActions = statePermissions[ticket.state] || {};
    Object.entries(stateActions).forEach(([action, check]) => {
      if (check(ticket, userRole)) {
        actions.add(action);
      }
    });
  
    // Add administrative actions (independent of state)
    Object.values(TICKET_ACTIONS).forEach(action => {
      if (isAdministrativeAction(action, userRole)) {
        actions.add(action);
      }
    });
  
    return Array.from(actions);
  };
  
  // Check if a specific action is allowed
  export const isActionAllowed = (action, ticket, userRole) => {
    if (!ticket || !userRole) return false;
  
    // Check administrative actions first
    if (isAdministrativeAction(action, userRole)) {
      return true;
    }
  
    // Check state-specific permissions
    const stateActions = statePermissions[ticket.state] || {};
    const check = stateActions[action];
    return check ? check(ticket, userRole) : false;
  };
  
  // Get next available status based on current state
  export const getNextAvailableStatus = (currentState) => {
    const statusFlow = {
      'Iniciada': ['Técnico asignado'],
      'Técnico asignado': ['Confirmado por tecnico'],
      'Confirmado por tecnico': ['Trabajo iniciado'],
      'Trabajo iniciado': ['Finalizada'],
      'Finalizada': ['Cerrada'],
      'Cerrada': []
    };
  
    return statusFlow[currentState] || [];
  };