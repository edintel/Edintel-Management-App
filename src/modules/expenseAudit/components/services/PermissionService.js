/**
 * PermissionService - Handles user permission and role verification
 * 
 * This service is responsible for:
 * - Storing and providing access to user roles across departments
 * - Determining user permissions within the expense audit system
 * - Checking if users can perform specific actions
 */
class PermissionService {
    constructor(baseService) {
      this.baseService = baseService;
      this.roles = [];
      this.departments = [];
    }
  
    /**
     * Initialize the service with roles and departments data
     * @param {Array} roles - The roles data from SharePoint
     * @param {Array} departments - The departments data from SharePoint
     */
    async initialize(roles, departments) {
      this.roles = roles;
      this.departments = departments;
    }
  
    /**
     * Get all roles for a user across departments
     * @param {string} userEmail - The email of the user
     * @returns {Array} Array of user roles with department info
     */
    getUserRoles(userEmail) {
      if (!userEmail) return [];
      
      return this.roles
        .filter(role => role.empleado?.email === userEmail)
        .map(role => {
          const department = this.departments.find(dept => 
            dept.id === role.departamentoId?.toString()
          );
          
          return {
            departmentId: role.departamentoId,
            department: department || null,
            roleType: this._determineRoleType(userEmail, department)
          };
        });
    }
  
    /**
     * Determine if a user has a specific role in any department
     * @param {string} userEmail - The email of the user
     * @param {string} roleType - The role type to check (Jefe, Asistente, Empleado)
     * @returns {boolean} True if user has the role
     */
    hasRole(userEmail, roleType) {
      const userRoles = this.getUserRoles(userEmail);
      return userRoles.some(role => role.roleType === roleType);
    }
  
    /**
     * Check if user has a role in a specific department
     * @param {string} userEmail - The email of the user
     * @param {string} departmentId - The department ID
     * @param {string} roleType - The role type to check (optional)
     * @returns {boolean} True if user has a role in the department
     */
    hasRoleInDepartment(userEmail, departmentId, roleType = null) {
      const userRoles = this.getUserRoles(userEmail);
      
      return userRoles.some(role => {
        const departmentMatch = role.departmentId?.toString() === departmentId?.toString();
        return departmentMatch && (roleType ? role.roleType === roleType : true);
      });
    }
  
    /**
     * Check if department has any assistants
     * @param {string|number} departmentId - The department ID
     * @returns {boolean} True if department has assistants
     */
    departmentHasAssistants(departmentId) {
      if (!departmentId) return false;
      
      const department = this.departments.find(dept => dept.id === departmentId.toString());
      if (!department) return false;
      
      // Check if department has assistant users configured
      return department.asistentes && 
             Array.isArray(department.asistentes) && 
             department.asistentes.length > 0;
    }
  
    /**
     * Check if user is in Contabilidad department
     * @param {string} userEmail - The email of the user
     * @returns {boolean} True if user is in Contabilidad department
     */
    isInContabilidadDepartment(userEmail) {
      return this.getUserRoles(userEmail).some(role => 
        role.department && 
        role.department.departamento.toLowerCase().includes('contabilidad')
      );
    }
  
    /**
     * Get the department of an expense creator
     * @param {string} creatorEmail - The email of the expense creator
     * @returns {Object|null} The creator's department or null
     */
    getCreatorDepartment(creatorEmail) {
      const creatorRole = this.roles.find(role => role.empleado?.email === creatorEmail);
      if (!creatorRole || !creatorRole.departamentoId) return null;
      
      return this.departments.find(dept => dept.id === creatorRole.departamentoId.toString());
    }
  
    /**
     * Determine role type based on department data
     * @private
     * @param {string} userEmail - The email of the user
     * @param {Object} department - The department object
     * @returns {string|null} The role type or null
     */
    _determineRoleType(userEmail, department) {
      if (!department) return null;
      
      if (department.jefes && department.jefes.some(jefe => jefe.email === userEmail)) {
        return 'Jefe';
      }
      
      if (department.asistentes && department.asistentes.some(asistente => asistente.email === userEmail)) {
        return 'Asistente';
      }
      
      return 'Empleado';
    }
  }
  
  export default PermissionService;