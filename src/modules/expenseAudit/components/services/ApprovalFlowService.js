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
    // Quick disqualifiers
    if (this._isFullyApproved(expense) || this._isRejected(expense)) {
      return false;
    }
    
    const userRoles = this.permissionService.getUserRoles(userEmail);
    if (!userRoles || userRoles.length === 0) {
      return false;
    }
  
    // Case 1: User is the creator of the expense
    if (expense.createdBy.email === userEmail) {
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      if (isBoss && expense.aprobacionJefatura === 'Pendiente') {
        const creatorDept = userRoles.find(role => role.department)?.department;
        const hasAssistants = creatorDept &&
          creatorDept.asistentes &&
          creatorDept.asistentes.length > 0;
        if (!hasAssistants || expense.aprobacionAsistente === 'Aprobada') {
          return true;
        }
      }
      return false;
    }
  
    // Case 2: User is in accounting department
    const isContabilidad = this.permissionService.isInContabilidadDepartment(userEmail);
    if (isContabilidad) {
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
  
    // Case 3: User is in same department as expense creator
    const creatorRole = this.permissionService.roles.find(role =>
      role.empleado?.email === expense.createdBy.email
    );
    if (!creatorRole) {
      return false;
    }
  
    const isInCreatorDepartment = userRoles.some(role =>
      role.departmentId?.toString() === creatorRole.departamentoId?.toString()
    );
    if (!isInCreatorDepartment) {
      return false;
    }
  
    // Determine user's role
    const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
    const isBoss = userRoles.some(role => role.roleType === 'Jefe');
    
    // For assistants with pending assistant approval
    if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
      return true;
    }
    
    // For bosses
    if (isBoss) {
      const departmentHasAssistants = this.permissionService.departmentHasAssistants(
        creatorRole.departamentoId
      );
      
      // No assistants in department, boss can approve directly
      if (!departmentHasAssistants && expense.aprobacionJefatura === 'Pendiente') {
        return true;
      }
      
      // Assistant already approved, now boss can approve
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
  
    // Case 1: User is the creator of the expense
    if (expense.createdBy.email === userEmail) {
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      if (isBoss && expense.aprobacionJefatura === 'Pendiente') {
        const creatorDept = userRoles.find(role => role.department)?.department;
        const hasAssistants = creatorDept &&
          creatorDept.asistentes &&
          creatorDept.asistentes.length > 0;
        if (!hasAssistants || expense.aprobacionAsistente === 'Aprobada') {
          return 'boss';
        }
      }
      return null;
    }
  
    // Case 2: User is in accounting department
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
  
    // Case 3: User is in same department as expense creator
    const creatorRole = this.permissionService.roles.find(role =>
      role.empleado?.email === expense.createdBy.email
    );
    if (!creatorRole) {
      return null;
    }
  
    const isInCreatorDepartment = userRoles.some(role =>
      role.departmentId?.toString() === creatorRole.departamentoId?.toString()
    );
    if (!isInCreatorDepartment) {
      return null;
    }
  
    // Determine user's role
    const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
    const isBoss = userRoles.some(role => role.roleType === 'Jefe');
    
    // For assistants with pending assistant approval
    if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
      return 'assistant';
    }
    
    // For bosses
    if (isBoss) {
      const departmentHasAssistants = this.permissionService.departmentHasAssistants(
        creatorRole.departamentoId
      );
      
      // No assistants in department, boss can approve directly
      if (!departmentHasAssistants && expense.aprobacionJefatura === 'Pendiente') {
        return 'boss';
      }
      
      // Assistant already approved, now boss can approve
      if (expense.aprobacionAsistente === 'Aprobada' && expense.aprobacionJefatura === 'Pendiente') {
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
    return true;
  }

  _needsContabilidadApproval(expense) {
    return true;
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