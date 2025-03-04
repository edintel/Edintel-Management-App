export const VIEW_MODES = {
  ALL: 'all',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const VIEW_MODE_LABELS = {
  [VIEW_MODES.ALL]: 'Todos',
  [VIEW_MODES.PENDING]: 'Pendientes',
  [VIEW_MODES.APPROVED]: 'Aprobados',
  [VIEW_MODES.REJECTED]: 'Rechazados'
};

export const APPROVAL_TYPES = {
  APPROVE: 'approve',
  REJECT: 'reject'
};

export const APPROVAL_STAGES = {
  ASSISTANT: 'assistant',
  BOSS: 'boss',
  ACCOUNTING_ASSISTANT: 'accounting_assistant',
  ACCOUNTING_BOSS: 'accounting_boss'
};

export const APPROVAL_STATUS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'No aprobada'
};