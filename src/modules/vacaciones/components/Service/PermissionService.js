class PermissionService {
  constructor(baseService) {
    this.baseService = baseService;
    this.roles = [];
    this.departments = [];
  }

  async initialize(roles, departments) {
    this.roles = roles || [];
    this.departments = departments || [];
  }

  getUserRoles(userEmail) {
    if (!userEmail) return [];

    return this.roles
      .filter(role => role.empleado?.email === userEmail)
      .map(role => {
        const department = this.departments.find(
          dept => dept.id === role.departamentoId?.toString()
        );
        return {
          departmentId: role.departamentoId,
          department: department || null,
          roleType: role.rol || 'Colaborador',
        };
      });
  }

  getUserHighestRole(userEmail) {
    if (!userEmail) return 'Colaborador';
    const userRoles = this.getUserRoles(userEmail);
    for (const r of ['Gerencia General', 'Gerencia', 'Jefatura']) {
      if (userRoles.some(role => role.roleType === r)) return r;
    }
    return 'Colaborador';
  }

  hasRole(userEmail, roleType) {
    return this.getUserRoles(userEmail).some(r => r.roleType === roleType);
  }

  isAdmin(userEmail) {
    return this.hasRole(userEmail, 'Administrador');
  }

  isJefatura(userEmail) {
    return this.hasRole(userEmail, 'Jefatura');
  }

  canSeeDepartmentRequests(userEmail) {
    return this.getUserRoles(userEmail).some(r =>
      ['Jefatura', 'Gerencia', 'Gerencia General', 'Administrador'].includes(r.roleType)
    );
  }

  getUserPrimaryDepartment(userEmail) {
    const userRoles = this.getUserRoles(userEmail);
    if (userRoles.length === 0) return null;
    const adminRole = userRoles.find(r => r.roleType === 'Administrador');
    return adminRole ? adminRole.department : userRoles[0].department;
  }

  // Verifica si puede aprobar en la etapa correspondiente
  canApprove(userEmail, approvalType) {
    const userRoles = this.getUserRoles(userEmail);

    switch (approvalType) {
      case 'jefatura':
        return userRoles.some(r =>
          ['Jefatura', 'Gerencia', 'Gerencia General'].includes(r.roleType)
        );
      case 'rh':
        return userRoles.some(r => r.roleType === 'Administrador');
      default:
        return false;
    }
  }

  canEditRequest(userEmail, request) {
    const userRoles = this.getUserRoles(userEmail);
    const isOwner = request.createdBy?.email === userEmail;
    const isAdmin = userRoles.some(r => r.roleType === 'Administrador');

    if (isAdmin) return true;

    const isRejected = request.aprobadoJefatura === false || request.aprobadoRH === false;
    const isPending = request.aprobadoJefatura === null;

    if (isOwner && (isRejected || isPending)) return true;

    return false;
  }

  canDeleteRequest(userEmail) {
    return this.isAdmin(userEmail);
  }

  canViewRequest(userEmail, request) {
    const userRoles = this.getUserRoles(userEmail);

    if (request.createdBy?.email === userEmail) return true;

    // Administrador y GerenciaGeneral ven todas las solicitudes
    if (userRoles.some(r => ['Administrador', 'Gerencia General'].includes(r.roleType))) return true;

    // Jefatura y Gerencia ven solicitudes de su departamento
    return userRoles.some(r =>
      ['Jefatura', 'Gerencia'].includes(r.roleType) &&
      r.department?.departamento === request.departamento
    );
  }

  getDepartmentForUser(userEmail) {
    const userRole = this.roles.find(r => r.empleado?.email === userEmail);
    if (!userRole?.departamentoId) return null;
    return this.departments.find(d => d.id === userRole.departamentoId.toString());
  }
}

export default PermissionService;
