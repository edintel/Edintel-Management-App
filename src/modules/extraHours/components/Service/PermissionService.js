
class PermissionService {
  constructor(baseService) {
    this.baseService = baseService;
    this.roles = [];
    this.departments = [];
  }

  /**
   * Initialize the permission service with roles and departments
   * @param {Array} roles - Array of role objects
   * @param {Array} departments - Array of department objects
   */
  async initialize(roles, departments) {
    this.roles = roles || [];
    this.departments = departments || [];
  }

  /**
   * Get all roles for a user across all departments
   * @param {string} userEmail - User email
   * @returns {Array} Array of role objects with department info
   */
  getUserRoles(userEmail) {
    if (!userEmail) return [];

    // Find user roles by email
    const userRoles = this.roles
      .filter((role) => role.empleado?.email === userEmail)
      .map((role) => {
        // Find the department for this role
        const department = this.departments.find(
          (dept) => dept.id === role.departamentoId?.toString()
        );

        return {
          departmentId: role.departamentoId,
          department: department || null,
          roleType: this._determineRoleType(userEmail, department, role.rol),
        };
      });

    return userRoles;
  }

  /**
   * Check if user has a specific role
   * @param {string} userEmail - User email
   * @param {string} roleType - Role type (AsistenteJefatura, Jefatura, Administrador, Colaborador)
   * @returns {boolean}
   */
  hasRole(userEmail, roleType) {
    const userRoles = this.getUserRoles(userEmail);
    return userRoles.some((role) => role.roleType === roleType);
  }

  /**
   * Check if user has a specific role in a specific department
   * @param {string} userEmail - User email
   * @param {number} departmentId - Department ID
   * @param {string} roleType - Role type (optional)
   * @returns {boolean}
   */
  hasRoleInDepartment(userEmail, departmentId, roleType = null) {
    const userRoles = this.getUserRoles(userEmail);
    return userRoles.some((role) => {
      const departmentMatch =
        role.departmentId?.toString() === departmentId?.toString();
      return departmentMatch && (roleType ? role.roleType === roleType : true);
    });
  }

  /**
   * Check if user is an admin (sees ALL requests from ALL departments)
   * @param {string} userEmail - User email
   * @returns {boolean}
   */
  isAdmin(userEmail) {
    return this.hasRole(userEmail, "Administrador");
  }

  /**
   * Check if user is AsistenteJefatura
   * @param {string} userEmail - User email
   * @returns {boolean}
   */
  isAsistenteJefatura(userEmail) {
    return this.hasRole(userEmail, "AsistenteJefatura");
  }

  /**
   * Check if user is Jefatura
   * @param {string} userEmail - User email
   * @returns {boolean}
   */
  isJefatura(userEmail) {
    return this.hasRole(userEmail, "Jefatura");
  }

  /**
   * Check if user can see department requests (AsistenteJefatura, Jefatura, or Administrador)
   * @param {string} userEmail - User email
   * @returns {boolean}
   */
  canSeeDepartmentRequests(userEmail) {
    const userRoles = this.getUserRoles(userEmail);
    return userRoles.some(
      (role) =>
        role.roleType === "AsistenteJefatura" ||
        role.roleType === "Jefatura" ||
        role.roleType === "Administrador"
    );
  }

  /**
   * Get user's primary department
   * @param {string} userEmail - User email
   * @returns {Object|null} Department object
   */
  getUserPrimaryDepartment(userEmail) {
    const userRoles = this.getUserRoles(userEmail);

    if (userRoles.length === 0) return null;

    // Prioritize admin roles
    const adminRole = userRoles.find(
      (role) =>
        role.roleType === "Administrador"
    );

    return adminRole ? adminRole.department : userRoles[0].department;
  }

  /**
   * Check if user can approve requests
   * @param {string} userEmail - User email
   * @param {string} approvalType - Type of approval (asistente, jefatura, rh, conta)
   * @returns {boolean}
   */
  canApprove(userEmail, approvalType) {
    const userRoles = this.getUserRoles(userEmail);

    switch (approvalType) {
      case "asistente":
        // AsistenteJefatura can review (first step)
        return userRoles.some((role) => role.roleType === "AsistenteJefatura");

      case "jefatura":
        // Jefatura can approve (second step)
        return userRoles.some((role) => role.roleType === "Jefatura");

      case "rh":
        // Administrador from RH department can approve (third step)
        return userRoles.some(
          (role) =>
            role.roleType === "Administrador" &&
            role.department?.departamento?.toLowerCase().includes("Recursos Humanos")
        );

      case "conta":
        // Jefatura or Administrador from Contabilidad department can review (final step)
        return userRoles.some(
          (role) =>
            (role.roleType === "Jefatura" || role.roleType === "Administrador") &&
            role.department?.departamento?.toLowerCase().includes("contabilidad")
        );

      default:
        return false;
    }
  }
  /**
   * Check if user can edit a request
   * @param {string} userEmail - User email
   * @param {Object} request - Extra hours request
   * @returns {boolean}
   */
  canEditRequest(userEmail, request) {
    const userRoles = this.getUserRoles(userEmail);

    // Verificar si el usuario es el creador de la solicitud
    const isOwner = request.createdBy?.email === userEmail;

    // Verificar si la solicitud está rechazada en cualquier punto
    const isRejected =
      request.revisadoAsistente === false ||
      request.aprobadoJefatura === false ||
      request.aprobadoRH === false ||
      request.revisadoConta === false;

    // Verificar si la solicitud NO ha sido revisada por AsistenteJefatura
    const isPending = request.revisadoAsistente === null;

    // Verificar si el usuario es Administrador del departamento de Ingeniería
    const isEngineeringAdmin = userRoles.some(
      (role) =>
        role.roleType === "Administrador" &&
        role.department?.departamento === "Ingeniería"
    );

    // REGLA 1: Si la solicitud está rechazada, permitir edición
    if (isRejected) {
      return true;
    }

    // REGLA 2: Si el usuario es Administrador de Ingeniería, permitir edición
    if (isEngineeringAdmin) {
      return true;
    }

    // REGLA 3: Si es el creador Y la solicitud está pendiente (no revisada), permitir edición
    if (isOwner && isPending) {
      return true;
    }

    // En cualquier otro caso, NO permitir edición
    return false;
  }

  /**
   * Check if user can delete a request
   * @param {string} userEmail - User email
   * @param {Object} request - Extra hours request
   * @returns {boolean}
   */
  canDeleteRequest(userEmail, request) {
    // Only Administradores can delete
    return this.isAdmin(userEmail);
  }

  /**
   * Check if user can view a request
   * @param {string} userEmail - User email
   * @param {Object} request - Extra hours request
   * @returns {boolean}
   */
  canViewRequest(userEmail, request) {
    const userRoles = this.getUserRoles(userEmail);

    // User can always view their own requests
    if (request.createdBy?.email === userEmail) {
      return true;
    }

    // Administradores can view ALL requests from ALL departments
    if (userRoles.some((role) => role.roleType === "Administrador")) {
      return true;
    }

    // AsistenteJefatura and Jefatura can view requests from their department
    const canSeeDepartment = userRoles.some(
      (role) =>
        (role.roleType === "AsistenteJefatura" ||
          role.roleType === "Jefatura") &&
        role.department?.departamento === request.departamento
    );

    return canSeeDepartment;
  }

  /**
   * Get the department for a user by email
   * @param {string} userEmail - User email
   * @returns {Object|null} Department object
   */
  getDepartmentForUser(userEmail) {
    const userRole = this.roles.find(
      (role) => role.empleado?.email === userEmail
    );

    if (!userRole || !userRole.departamentoId) {
      return null;
    }

    return this.departments.find(
      (dept) => dept.id === userRole.departamentoId.toString()
    );
  }

  /**
   * Check if department has assistants (SuperAdmins)
   * @param {number} departmentId - Department ID
   * @returns {boolean}
   */
  departmentHasAssistants(departmentId) {
    if (!departmentId) return false;

    const department = this.departments.find(
      (dept) => dept.id === departmentId.toString()
    );

    if (!department) {
      return false;
    }

    return (
      department.asistentes &&
      Array.isArray(department.asistentes) &&
      department.asistentes.length > 0
    );
  }

  /**
   * Determine role type based on user email, department, and rol field
   * @param {string} userEmail - User email
   * @param {Object} department - Department object
   * @param {string} rol - Role from SharePoint (AsistenteJefatura, Jefatura, Administrador, Colaborador)
   * @returns {string|null} Role type
   */
  _determineRoleType(userEmail, department, rol) {
    if (!department) return rol || "Colaborador";

    // Use the rol field from SharePoint - these are the actual role names
    // AsistenteJefatura, Jefatura, Administrador, Colaborador
    return rol || "Colaborador";
  }

  /**
   * Get request approval status summary
   * @param {Object} request - Extra hours request
   * @returns {Object} Status summary
   */
  _getRequestStatusSummary(request) {
    return {
      revisadoAsistente: request.revisadoAsistente,
      aprobadoJefatura: request.aprobadoJefatura,
      aprobadoRH: request.aprobadoRH,
      revisadoConta: request.revisadoConta,
      allApproved:
        request.revisadoAsistente &&
        request.aprobadoJefatura &&
        request.aprobadoRH &&
        request.revisadoConta,
    };
  }

  /**
   * Debug method to get user permission information
   * @param {string} userEmail - User email
   * @returns {Object} Debug information
   */
  getUserPermissionDebug(userEmail) {
    const userRoles = this.getUserRoles(userEmail);
    const isAsistenteJefatura = this.isAsistenteJefatura(userEmail);
    const isJefatura = this.isJefatura(userEmail);
    const isAdmin = this.isAdmin(userEmail);
    const primaryDepartment = this.getUserPrimaryDepartment(userEmail);

    return {
      email: userEmail,
      roles: userRoles,
      isAsistenteJefatura: isAsistenteJefatura,
      isJefatura: isJefatura,
      isAdmin: isAdmin,
      canSeeDepartmentRequests: this.canSeeDepartmentRequests(userEmail),
      primaryDepartment: primaryDepartment,
      departmentCount: userRoles.length,
    };
  }
}

export default PermissionService;