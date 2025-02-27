class ApprovalFlowService {
  constructor(permissionService) {
    this.permissionService = permissionService;
  }

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

  canApprove(expense, userEmail) {
    // Don't allow approval for fully approved or rejected expenses
    if (this._isFullyApproved(expense) || this._isRejected(expense)) {
      return false;
    }

    const userRoles = this.permissionService.getUserRoles(userEmail);
    
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    // CRITICAL FIX: Special case - if user is the creator of the expense
    if (expense.createdBy.email === userEmail) {
      
      // Check if user is a boss
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      if (isBoss && expense.aprobacionJefatura === 'Pendiente') {
        return true;
      }
    }

    // Check if user is from Contabilidad
    const isContabilidad = this.permissionService.isInContabilidadDepartment(userEmail);
    
    if (isContabilidad) {
      // Handle Contabilidad approvals
      const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      
      if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
        return true;
      }

      if (isBoss && expense.aprobacionJefatura === 'Pendiente' &&
          expense.aprobacionAsistente === 'Aprobada') {
        return true;
      }

      return false;
    }

    // Find creator's department
    const creatorRole = this.permissionService.roles.find(role =>
      role.empleado?.email === expense.createdBy.email
    );
    
    if (!creatorRole) {
      return false;
    }

    // Check if user is in the same department as the creator
    const isInCreatorDepartment = userRoles.some(role =>
      role.departmentId?.toString() === creatorRole.departmentId?.toString()
    );
    
    if (!isInCreatorDepartment) {
      return false;
    }

    // Check department configuration
    const departmentHasAssistants = this.permissionService.departmentHasAssistants(
      creatorRole.departmentId
    );

    // Check if user is an assistant
    const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
    
    if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
      return true;
    }

    // Check if user is a boss
    const isBoss = userRoles.some(role => role.roleType === 'Jefe');
    
    if (isBoss) {
      // Boss can approve if department has no assistants and approval is pending
      if (!departmentHasAssistants && expense.aprobacionJefatura === 'Pendiente') {
        return true;
      }
      
      // Boss can approve if assistant has approved and boss approval is pending
      if (expense.aprobacionAsistente === 'Aprobada' && expense.aprobacionJefatura === 'Pendiente') {
        return true;
      }
    }
    return false;
  }

  getNextApprovalType(expense, userEmail) {
    const userRoles = this.permissionService.getUserRoles(userEmail);
    
    if (!userRoles || userRoles.length === 0) {
      return null;
    }

    // CRITICAL FIX: Special case - if user is the creator of the expense
    if (expense.createdBy.email === userEmail) {
      
      // Check if user is a boss
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      if (isBoss && expense.aprobacionJefatura === 'Pendiente') {
        return 'boss';
      }
    }

    // Handle Contabilidad department users
    const isContabilidad = this.permissionService.isInContabilidadDepartment(userEmail);
    
    if (isContabilidad) {
      const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      
      if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
        return 'accounting_assistant';
      }
      
      if (isBoss && expense.aprobacionJefatura === 'Pendiente' &&
          expense.aprobacionAsistente === 'Aprobada') {
        return 'accounting_boss';
      }

      return null;
    }

    // Find creator's role
    const creatorRole = this.permissionService.roles.find(role =>
      role.empleado?.email === expense.createdBy.email
    );
    
    if (!creatorRole) {
      return null;
    }
    
    // Check if user is in the same department as the creator
    const isInCreatorDepartment = userRoles.some(role =>
      role.departmentId?.toString() === creatorRole.departmentId?.toString()
    );
    
    if (!isInCreatorDepartment) {
      return null;
    }
    
    // Check if the creator's department has assistants
    const departmentHasAssistants = this.permissionService.departmentHasAssistants(
      creatorRole.departmentId
    );
    
    // Handle assistant role
    const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
    
    if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
      return 'assistant';
    }
    
    // Handle boss role
    const isBoss = userRoles.some(role => role.roleType === 'Jefe');
    
    if (isBoss) {
      
      // Boss can approve if department has no assistants or if assistant approved
      if (((!departmentHasAssistants) || expense.aprobacionAsistente === 'Aprobada') && 
          expense.aprobacionJefatura === 'Pendiente') {
        return 'boss';
      }
    }
    return null;
  }

  _needsAssistantApproval(expense) {
    const creatorRole = this.permissionService.roles.find(role =>
      role.empleado?.email === expense.createdBy.email
    );
    if (!creatorRole || !creatorRole.departmentId) return true;
    
    return this.permissionService.departmentHasAssistants(creatorRole.departmentId);
  }

  _needsBossApproval(expense) {
    return true; // All expenses need boss approval
  }

  _needsContabilidadApproval(expense) {
    return true; // All expenses need contabilidad approval
  }

  _getCurrentState(expense) {
    if (!expense) return 'unknown';
    
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

  _isFullyApproved(expense) {
    if (!expense) return false;
    return expense.aprobacionContabilidad === 'Aprobada';
  }

  _isRejected(expense) {
    if (!expense) return false;
    return expense.aprobacionAsistente === 'No aprobada' ||
           expense.aprobacionJefatura === 'No aprobada' ||
           expense.aprobacionContabilidad === 'No aprobada';
  }
}

export default ApprovalFlowService;