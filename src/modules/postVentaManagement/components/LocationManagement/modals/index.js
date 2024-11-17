export { default as CompanyModal } from './CompanyModal';
export { default as BuildingModal } from './BuildingModal';
export { default as SiteModal } from './SiteModal';
export { default as DeleteModal } from './DeleteModal';

// Also export type constants that can be used throughout the application
export const MODAL_TYPES = {
  // Company modals
  ADD_COMPANY: 'add-company',
  EDIT_COMPANY: 'edit-company',
  DELETE_COMPANY: 'delete-company',
  
  // Building modals
  ADD_BUILDING: 'add-building',
  EDIT_BUILDING: 'edit-building',
  DELETE_BUILDING: 'delete-building',
  
  // Site modals
  ADD_SITE: 'add-site',
  EDIT_SITE: 'edit-site',
  DELETE_SITE: 'delete-site',
};

// Helper function to determine if a modal type is an edit operation
export const isEditModal = (type) => type.startsWith('edit-');

// Helper function to determine if a modal type is a delete operation
export const isDeleteModal = (type) => type.startsWith('delete-');

// Helper function to get the entity type from a modal type
export const getEntityFromModalType = (type) => {
  if (type.includes('company')) return 'company';
  if (type.includes('building')) return 'building';
  if (type.includes('site')) return 'site';
  return null;
};