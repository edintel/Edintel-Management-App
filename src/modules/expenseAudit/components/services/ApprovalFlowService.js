/**
 * ApprovalFlowService - Manages expense approval workflows
 * 
 * This service is responsible for:
 * - Determining the current approval state of an expense
 * - Checking if a user can approve an expense
 * - Providing the next appropriate approval type
 */
class ApprovalFlowService {
  constructor(permissionService) {
    this.permissionService = permissionService;
  }

  /**
   * Get the current approval state of an expense
   * @param {Object} expense - The expense object
   * @returns {Object} Object containing approval state information
   */
  getApprovalState(expense) {
    return {
      needsAssistantApproval: this._needsAssistantApproval(expense),
      needsBossApproval: this._needsBossApproval(expense),
      needsContabilidadApproval: this._needsContabilidadApproval(expense),
      currentState: this._getCurrentState(expense),
      isFullyApproved: this._isFullyApproved(expense),
      isRejected: this._isRejected(expense)
    };
  }

  /**
   * Check if a user can approve an expense
   * @param {Object} expense - The expense object
   * @param {string} userEmail - The email of the user
   * @returns {boolean} True if user can approve the expense
   */
  canApprove(expense, userEmail) {
    const userRoles = this.permissionService.getUserRoles(userEmail);
    const approvalState = this.getApprovalState(expense);
    
    // If it's already fully approved or rejected, no one can approve
    if (approvalState.isFullyApproved || approvalState.isRejected) {
      return false;
    }
    
    // Check if user is in Contabilidad department
    const isContabilidad = this.permissionService.isInContabilidadDepartment(userEmail);
    
    // If in Contabilidad, check if expense is ready for Contabilidad approval
    if (isContabilidad) {
      // Contabilidad assistants can approve if it's pending assistant approval
      const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
      if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
        return true;
      }
      
      // Contabilidad bosses can approve if it's pending boss approval and has assistant approval
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      if (isBoss && expense.aprobacionJefatura === 'Pendiente' && 
          expense.aprobacionAsistente === 'Aprobada') {
        return true;
      }
      
      return false;
    }
    
    // For regular departments, check the creator's department
    const creatorRole = this.permissionService.roles.find(role => 
      role.empleado?.email === expense.createdBy.email
    );
    
    if (!creatorRole) return false;
    
    // Check if user is in same department as creator
    const isInCreatorDepartment = userRoles.some(role => 
      role.departmentId?.toString() === creatorRole.departmentId?.toString()
    );
    
    if (!isInCreatorDepartment) return false;
    
    // Department has assistants - normal flow
    const departmentHasAssistants = this.permissionService.departmentHasAssistants(
      creatorRole.departmentId
    );
    
    // If user is assistant and expense needs assistant approval
    if (userRoles.some(role => role.roleType === 'Asistente') && 
        (expense.aprobacionAsistente === 'Pendiente' || 
         expense.aprobacionAsistente === 'No aprobada')) {
      return true;
    }
    
    // If user is boss
    if (userRoles.some(role => role.roleType === 'Jefe')) {
      // If department has no assistants or assistant has approved
      if (!departmentHasAssistants || expense.aprobacionAsistente === 'Aprobada') {
        return expense.aprobacionJefatura === 'Pendiente' || 
               expense.aprobacionJefatura === 'No aprobada';
      }
    }
    
    return false;
  }

  /**
   * Get next approval type needed for an expense
   * @param {Object} expense - The expense object
   * @param {string} userEmail - The email of the user
   * @returns {string|null} The next approval type or null
   */
  getNextApprovalType(expense, userEmail) {
    const userRoles = this.permissionService.getUserRoles(userEmail);
    
    // Check if user is in Contabilidad
    const isContabilidad = this.permissionService.isInContabilidadDepartment(userEmail);
    
    if (isContabilidad) {
      const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
      if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
        return 'accounting_assistant';
      }
      
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      if (isBoss && expense.aprobacionJefatura === 'Pendiente' && 
          expense.aprobacionAsistente === 'Aprobada') {
        return 'accounting_boss';
      }
      
      return null;
    }
    
    // For regular departments
    const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
    
    const isBoss = userRoles.some(role => role.roleType === 'Jefe');
    if (isBoss && expense.aprobacionJefatura === 'Pendiente' && 
        (expense.aprobacionAsistente === 'Aprobada' || 
         !this._needsAssistantApproval(expense))) {
      const result = 'boss';
      return result;
    }
    return null;
  }

  /**
   * Check if expense requires assistant approval
   * @private
   * @param {Object} expense - The expense object
   * @returns {boolean} True if assistant approval is needed
   */
  _needsAssistantApproval(expense) {
    // Get creator's department
    const creatorRole = this.permissionService.roles.find(role => 
      role.empleado?.email === expense.createdBy.email
    );
    
    if (!creatorRole) return true; // Default to requiring assistant approval
    
    // Check if department has any assistants
    return this.permissionService.departmentHasAssistants(creatorRole.departmentId);
  }

  /**
   * Check if expense requires boss approval
   * @private
   * @param {Object} expense - The expense object
   * @returns {boolean} True if boss approval is needed
   */
  _needsBossApproval(expense) {
    // All expenses need boss approval
    return true;
  }

  /**
   * Check if expense requires Contabilidad approval
   * @private
   * @param {Object} expense - The expense object
   * @returns {boolean} True if Contabilidad approval is needed
   */
  _needsContabilidadApproval(expense) {
    // All approved expenses need Contabilidad final approval
    return true;
  }

  /**
   * Get the current state of an expense in the approval flow
   * @private
   * @param {Object} expense - The expense object
   * @returns {string} The current state
   */
  _getCurrentState(expense) {
    if (expense.aprobacionAsistente === 'No aprobada' || 
        expense.aprobacionJefatura === 'No aprobada' || 
        expense.aprobacionContabilidad === 'No aprobada') {
      return 'rejected';
    }
    
    if (expense.aprobacionContabilidad === 'Aprobada') {
      return 'fully_approved';
    }
    
    if (expense.aprobacionJefatura === 'Aprobada') {
      return 'pending_contabilidad';
    }
    
    if (expense.aprobacionAsistente === 'Aprobada') {
      return 'pending_boss';
    }
    
    return 'pending_assistant';
  }

  /**
   * Check if expense is fully approved
   * @private
   * @param {Object} expense - The expense object
   * @returns {boolean} True if expense is fully approved
   */
  _isFullyApproved(expense) {
    if (!expense) return false;
    
    // An expense is fully approved only when contabilidad has approved it
    return expense.aprobacionContabilidad === 'Aprobada';
  }

  /**
   * Check if expense is rejected
   * @private
   * @param {Object} expense - The expense object
   * @returns {boolean} True if expense is rejected
   */
  _isRejected(expense) {
    if (!expense) return false;
    
    // Check all possible rejection states
    return expense.aprobacionAsistente === 'No aprobada' || 
           expense.aprobacionJefatura === 'No aprobada' || 
           expense.aprobacionContabilidad === 'No aprobada';
  }
}

export default ApprovalFlowService;