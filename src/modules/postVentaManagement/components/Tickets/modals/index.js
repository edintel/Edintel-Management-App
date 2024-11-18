// src/modules/postVentaManagement/components/Tickets/modals/index.js
export { default as AssignTechnicianModal } from "./AssignTechnicianModal";
export { default as TicketActionsModal } from "./TicketActionsModal";
export { default as TicketEditModal } from "./TicketEditModal";
export { default as DeleteTicketModal } from "./DeleteTicketModal";

// Modal type constants for consistent references
export const MODAL_TYPES = {
  ASSIGN_TECH: "assign-technician",
  EDIT_TICKET: "edit-ticket",
  DELETE_TICKET: "delete-ticket",
  UPDATE_STATUS: "update-status",
  SCHEDULE_DATE: "schedule-date",
};

// Helper functions for modal handling
export const isEditModal = (type) => type === MODAL_TYPES.EDIT_TICKET;
export const isDeleteModal = (type) => type === MODAL_TYPES.DELETE_TICKET;
export const isAssignModal = (type) => type === MODAL_TYPES.ASSIGN_TECH;
export const isStatusModal = (type) => type === MODAL_TYPES.UPDATE_STATUS;
export const isScheduleModal = (type) => type === MODAL_TYPES.SCHEDULE_DATE;

// Status progression map
export const STATUS_FLOW = {
  Iniciada: ["Técnico asignado"],
  "Técnico asignado": ["Confirmado por técnico"],
  "Confirmado por técnico": ["Trabajo iniciado"],
  "Trabajo iniciado": ["Finalizada"],
  Finalizada: ["Cerrada"],
  Cerrada: [],
};

// Status display configurations
export const STATUS_CONFIG = {
  Iniciada: {
    color: "bg-gray-200 text-gray-700",
    icon: "Clock",
  },
  "Técnico asignado": {
    color: "bg-warning/10 text-warning",
    icon: "User",
  },
  "Confirmado por técnico": {
    color: "bg-info/10 text-info",
    icon: "CheckCircle",
  },
  "Trabajo iniciado": {
    color: "bg-info/10 text-info",
    icon: "Play",
  },
  Finalizada: {
    color: "bg-success/10 text-success",
    icon: "CheckSquare",
  },
  Cerrada: {
    color: "bg-success/10 text-success",
    icon: "Lock",
  },
};
