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
    // If the expense is already fully approved or rejected, return false
    if (this._isFullyApproved(expense) || this._isRejected(expense)) {
      return false;
    }

    // Get user roles
    const userRoles = this.permissionService.getUserRoles(userEmail);
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    // Creator as boss special case
    if (expense.createdBy.email === userEmail) {
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      if (isBoss && expense.aprobacionJefatura === 'Pendiente') {
        // Boss can approve their own expense if assistant approval is done or not needed
        const creatorDept = userRoles.find(role => role.department)?.department;
        const hasAssistants = creatorDept && 
          creatorDept.asistentes && 
          creatorDept.asistentes.length > 0;
        
        if (!hasAssistants || expense.aprobacionAsistente === 'Aprobada') {
          return true;
        }
      }
      // In all other self-approval cases, return false
      return false;
    }

    // Contabilidad special case
    const isContabilidad = this.permissionService.isInContabilidadDepartment(userEmail);
    if (isContabilidad) {
      const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');

      // Contabilidad assistant can approve if pending
      if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
        return true;
      }

      // Contabilidad boss can approve if assistant is approved
      if (isBoss && expense.aprobacionJefatura === 'Pendiente' &&
          expense.aprobacionAsistente === 'Aprobada') {
        return true;
      }

      return false;
    }

    // Get creator's department
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

    // Check if department has assistants
    const departmentHasAssistants = this.permissionService.departmentHasAssistants(
      creatorRole.departmentId
    );

    // Assistant approval logic
    const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
    if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
      return true;
    }

    // Boss approval logic
    const isBoss = userRoles.some(role => role.roleType === 'Jefe');
    if (isBoss) {
      // If no assistants, boss can approve directly
      if (!departmentHasAssistants && expense.aprobacionJefatura === 'Pendiente') {
        return true;
      }
      
      // If assistant has approved, boss can approve
      if (expense.aprobacionAsistente === 'Aprobada' && expense.aprobacionJefatura === 'Pendiente') {
        return true;
      }
    }

    return false;
  }

  getNextApprovalType(expense, userEmail) {
    // Get user roles
    const userRoles = this.permissionService.getUserRoles(userEmail);
    if (!userRoles || userRoles.length === 0) {
      return null;
    }

    // Creator as boss special case
    if (expense.createdBy.email === userEmail) {
      const isBoss = userRoles.some(role => role.roleType === 'Jefe');
      if (isBoss && expense.aprobacionJefatura === 'Pendiente') {
        // Boss can approve their own expense if assistant approval is done or not needed
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

    // Contabilidad special case
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

    // Get creator's department
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

    // Check if department has assistants
    const departmentHasAssistants = this.permissionService.departmentHasAssistants(
      creatorRole.departmentId
    );

    // Assistant approval logic
    const isAssistant = userRoles.some(role => role.roleType === 'Asistente');
    if (isAssistant && expense.aprobacionAsistente === 'Pendiente') {
      return 'assistant';
    }

    // Boss approval logic
    const isBoss = userRoles.some(role => role.roleType === 'Jefe');
    if (isBoss) {
      // If no assistants, boss can approve directly
      if (!departmentHasAssistants && expense.aprobacionJefatura === 'Pendiente') {
        return 'boss';
      }
      
      // If assistant has approved, boss can approve
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
    return true; // All expenses need boss approval
  }

  _needsContabilidadApproval(expense) {
    return true; // All expenses need Contabilidad approval
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