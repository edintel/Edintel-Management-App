// src/modules/extraHours/utils/permissions.helper.js

/**
 * Helper de permisos para el módulo de Horas Extras
 * Centraliza toda la lógica de permisos para consistencia
 */

/**
 * Verifica si el usuario puede editar una solicitud
 * @param {Object} request - Solicitud de horas extras
 * @param {string} userEmail - Email del usuario actual
 * @param {Object} userDepartmentRole - Rol y departamento del usuario
 * @returns {boolean}
 */
export const canEditRequest = (request, userEmail, userDepartmentRole) => {
  if (!request || !userEmail || !userDepartmentRole) return false;

  const role = userDepartmentRole.role;
  const isOwner = request.createdBy?.email === userEmail;

  // Administradores SIEMPRE pueden editar
  if (role === 'Administrador') {
    return true;
  }

  // Verificar si la solicitud está rechazada
  const estaRechazada = request.revisadoAsistente === false ||
    request.aprobadoJefatura === false ||
    request.aprobadoRH === false;

  // Verificar si está pendiente (no revisada por AsistenteJefatura)
  const estaPendiente = request.revisadoAsistente === null;

  // El colaborador (creador) puede editar si:
  // 1. Fue rechazada en cualquier etapa (puede corregir y reenviar)
  // 2. Está pendiente (aún no revisada por AsistenteJefatura)
  if (isOwner && (estaRechazada || estaPendiente)) {
    return true;
  }

  // AsistenteJefatura y Jefatura NO pueden editar solicitudes de otros
  return false;
};

/**
 * Verifica si el usuario puede eliminar una solicitud
 * @param {Object} request - Solicitud de horas extras
 * @param {string} userEmail - Email del usuario actual
 * @param {Object} userDepartmentRole - Rol y departamento del usuario
 * @returns {boolean}
 */
export const canDeleteRequest = (request, userEmail, userDepartmentRole) => {
  if (!request || !userEmail || !userDepartmentRole) return false;

  const role = userDepartmentRole.role;
  const department = userDepartmentRole.department?.departamento;
  const isOwner = request.createdBy?.email === userEmail;

  // Administradores SIEMPRE pueden eliminar
  if (role === 'Administrador') {
    return true;
  }

  // Usuarios de Ingeniería (cualquier rol) pueden eliminar solicitudes de su departamento
  if (department === 'Ingeniería' || department === 'Ingenieria') {
    return request.departamento === department;
  }

  // El colaborador (creador) puede eliminar solo si NO ha sido revisada
  if (isOwner && role === 'Colaborador') {
    return request.revisadoAsistente !== true && request.revisadoAsistente !== false;
  }

  return false;
};

/**
 * Verifica si el usuario puede aprobar/rechazar en esta etapa
 * @param {Object} request - Solicitud de horas extras
 * @param {Object} userDepartmentRole - Rol y departamento del usuario
 * @returns {boolean}
 */
export const canApproveRequest = (request, userDepartmentRole) => {
  if (!request || !userDepartmentRole) return false;

  const role = userDepartmentRole.role;
  const department = userDepartmentRole.department?.departamento;

  // Colaboradores nunca aprueban
  if (role === 'Colaborador') return false;

  // AsistenteJefatura: puede revisar si aún no ha sido revisada (pendiente)
  if (role === 'AsistenteJefatura') {
    // Verificar que sea de su departamento
    if (request.departamento !== department) return false;

    // Solo si está pendiente (ni true ni false)
    return request.revisadoAsistente !== true && request.revisadoAsistente !== false;
  }

  // Jefatura: puede aprobar si fue revisada por asistente Y aún no aprobó jefatura
  if (role === 'Jefatura') {
    // Verificar que sea de su departamento
    if (request.departamento !== department) return false;

    // Solo si asistente ya revisó Y jefatura está pendiente
    return request.revisadoAsistente === true &&
      request.aprobadoJefatura !== true &&
      request.aprobadoJefatura !== false;
  }

  // Administrador (RH): puede aprobar si jefatura aprobó Y RH está pendiente
  if (role === 'Administrador') {
    return request.aprobadoJefatura === true &&
      request.aprobadoRH !== true &&
      request.aprobadoRH !== false;
  }

  return false;
};

/**
 * Obtiene el tipo de aprobación según el rol
 * @param {string} role - Rol del usuario
 * @returns {string|null} - Tipo de aprobación
 */
export const getApprovalTypeByRole = (role) => {
  switch (role) {
    case 'AsistenteJefatura':
      return 'asistente';
    case 'Jefatura':
      return 'jefatura';
    case 'Administrador':
      return 'rh';
    default:
      return null;
  }
};

/**
 * Verifica si una solicitud está completamente aprobada (lista para pago)
 * @param {Object} request - Solicitud de horas extras
 * @returns {boolean}
 */
export const isFullyApproved = (request) => {
  if (!request) return false;

  return request.revisadoAsistente === true &&
    request.aprobadoJefatura === true &&
    request.aprobadoRH === true;
  // RevisadoConta no se considera para "aprobada" ya que es solo visualización
};

/**
 * Verifica si una solicitud fue rechazada en alguna etapa
 * @param {Object} request - Solicitud de horas extras
 * @returns {boolean}
 */
export const isRejected = (request) => {
  if (!request) return false;

  return request.revisadoAsistente === false ||
    request.aprobadoJefatura === false ||
    request.aprobadoRH === false;
  //  request.revisadoConta === false;
};

/**
 * Obtiene el estado descriptivo de una solicitud
 * @param {Object} request - Solicitud de horas extras
 * @returns {Object} - {status: string, label: string, color: string}
 */
export const getRequestStatus = (request) => {
  if (!request) {
    return { status: 'unknown', label: 'Desconocido', color: 'gray' };
  }

  // Rechazada en alguna etapa
  if (isRejected(request)) {
    return { status: 'rejected', label: 'Rechazada', color: 'red' };
  }

  // Completamente aprobada
  if (isFullyApproved(request)) {
    return { status: 'approved', label: 'Aprobada', color: 'green' };
  }

  // En proceso de aprobación
  if (request.aprobadoJefatura === true && request.aprobadoRH !== true && request.aprobadoRH !== false) {
    return { status: 'in_rh', label: 'En RH', color: 'blue' };
  }

  if (request.revisadoAsistente === true && request.aprobadoJefatura !== true && request.aprobadoJefatura !== false) {
    return { status: 'in_jefatura', label: 'En Jefatura', color: 'blue' };
  }

  // Pendiente de revisión inicial
  return { status: 'pending', label: 'Pendiente', color: 'yellow' };
};

/**
 * Verifica si el usuario puede ver la solicitud
 * @param {Object} request - Solicitud de horas extras
 * @param {string} userEmail - Email del usuario actual
 * @param {Object} userDepartmentRole - Rol y departamento del usuario
 * @returns {boolean}
 */
export const canViewRequest = (request, userEmail, userDepartmentRole) => {
  if (!request || !userEmail || !userDepartmentRole) return false;

  const role = userDepartmentRole.role;
  const department = userDepartmentRole.department?.departamento;
  const isOwner = request.createdBy?.email === userEmail;

  // El creador siempre puede ver su solicitud
  if (isOwner) return true;

  // Administradores ven TODAS las solicitudes
  if (role === 'Administrador') return true;

  // AsistenteJefatura y Jefatura ven las de su departamento
  if (role === 'AsistenteJefatura' || role === 'Jefatura') {
    return request.departamento === department;
  }

  return false;
};

/**
 * Obtiene el mensaje de ayuda sobre por qué no se puede editar
 * @param {Object} request - Solicitud de horas extras
 * @param {string} userEmail - Email del usuario actual
 * @param {Object} userDepartmentRole - Rol y departamento del usuario
 * @returns {string|null}
 */
export const getEditRestrictionMessage = (request, userEmail, userDepartmentRole) => {
  if (!request || !userEmail || !userDepartmentRole) {
    return 'No tienes permisos para editar esta solicitud.';
  }

  const role = userDepartmentRole.role;
  const isOwner = request.createdBy?.email === userEmail;

  if (role === 'Administrador') {
    return null; // Administradores siempre pueden editar
  }

  if (isOwner && role === 'Colaborador') {
    // Verificar si fue rechazada - puede editar para corregir
    const estaRechazada = request.revisadoAsistente === false ||
      request.aprobadoJefatura === false ||
      request.aprobadoRH === false;

    if (estaRechazada) {
      return null; // Puede editar solicitudes rechazadas para corregir
    }

    // Si fue aprobada, no puede editar
    if (request.revisadoAsistente === true) {
      return 'No puedes editar esta solicitud porque ya fue aprobada y está en proceso.';
    }

    return null; // Puede editar (está pendiente)
  }

  if (!isOwner) {
    return 'Solo el creador de la solicitud puede editarla.';
  }

  return 'No tienes permisos para editar esta solicitud.';
};