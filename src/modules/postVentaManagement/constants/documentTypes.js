export const DOCUMENT_TYPES = {
    DESCRIPTION: 'description',
    SERVICE_TICKET: 'serviceTicket',
    REPORT: 'report',
    ADMINISTRATIVE: 'administrative',
    IMAGE: 'image'
  };
  
  export const ADMINISTRATIVE_TYPES = [DOCUMENT_TYPES.ADMINISTRATIVE];
  export const GENERAL_TYPES = [
    DOCUMENT_TYPES.DESCRIPTION,
    DOCUMENT_TYPES.SERVICE_TICKET,
    DOCUMENT_TYPES.REPORT,
    DOCUMENT_TYPES.IMAGE,
  ];
  
  export const isAdministrativeDoc = (type) => ADMINISTRATIVE_TYPES.includes(type);
  export const isGeneralDoc = (type) => GENERAL_TYPES.includes(type);