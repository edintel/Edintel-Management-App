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
    
    // Find user roles by email
    const userRoles = this.roles
      .filter(role => role.empleado?.email === userEmail)
      .map(role => {
        // Find the department for this role
        const department = this.departments.find(dept =>
          dept.id === role.departamentoId?.toString()
        );
        
        return {
          departmentId: role.departamentoId,
          department: department || null,
          roleType: this._determineRoleType(userEmail, department)
        };
      });
    
    return userRoles;
  }

  hasRole(userEmail, roleType) {
    const userRoles = this.getUserRoles(userEmail);
    return userRoles.some(role => role.roleType === roleType);
  }

  hasRoleInDepartment(userEmail, departmentId, roleType = null) {
    const userRoles = this.getUserRoles(userEmail);
    return userRoles.some(role => {
      const departmentMatch = role.departmentId?.toString() === departmentId?.toString();
      return departmentMatch && (roleType ? role.roleType === roleType : true);
    });
  }

  departmentHasAssistants(departmentId) {
    if (!departmentId) return false;
    
    // Find the department by ID
    const department = this.departments.find(dept => dept.id === departmentId.toString());
    
    if (!department) {
      console.warn(`Department with ID ${departmentId} not found`);
      return false;
    }
    
    // Check if the department has any assistants
    return department.asistentes &&
           Array.isArray(department.asistentes) &&
           department.asistentes.length > 0;
  }

  isInContabilidadDepartment(userEmail) {
    // Check if user is in any department with "contabilidad" in the name
    return this.getUserRoles(userEmail).some(role =>
      role.department &&
      role.department.departamento.toLowerCase().includes('contabilidad')
    );
  }

  getCreatorDepartment(creatorEmail) {
    // Find the creator's role
    const creatorRole = this.roles.find(role => role.empleado?.email === creatorEmail);
    
    if (!creatorRole || !creatorRole.departamentoId) {
      return null;
    }
    
    // Find the department by ID
    return this.departments.find(dept => dept.id === creatorRole.departamentoId.toString());
  }

  _determineRoleType(userEmail, department) {
    if (!department) return null;
    
    // Check if user is a boss in this department
    if (department.jefes && department.jefes.some(jefe => jefe.email === userEmail)) {
      return 'Jefe';
    }
    
    // Check if user is an assistant in this department
    if (department.asistentes && department.asistentes.some(asistente => asistente.email === userEmail)) {
      return 'Asistente';
    }
    
    // Default role
    return 'Empleado';
  }
  
  // Debug method to get information about a user's permissions
  getUserPermissionDebug(userEmail) {
    const userRoles = this.getUserRoles(userEmail);
    const hasJefeRole = this.hasRole(userEmail, 'Jefe');
    const hasAsistenteRole = this.hasRole(userEmail, 'Jefe');
    const isInContabilidad = this.isInContabilidadDepartment(userEmail);
    
    return {
      email: userEmail,
      roles: userRoles,
      isJefe: hasJefeRole,
      isAsistente: hasAsistenteRole,
      isInContabilidad: isInContabilidad,
      departmentCount: userRoles.length
    };
  }
}

export default PermissionService;