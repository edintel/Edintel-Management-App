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
      isRejected: this._isRejected(expense),
    };
  }

  canApprove(expense, userEmail) {
    // Cannot approve if already fully approved or rejected
    if (this._isFullyApproved(expense) || this._isRejected(expense)) {
      return false;
    }

    const userRoles = this.permissionService.getUserRoles(userEmail);
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    // Get creator's department
    const creatorRole = this.permissionService.roles.find(
      (role) => role.empleado?.email === expense.createdBy.email
    );

    if (!creatorRole) {
      return false;
    }

    const creatorDepartmentId = creatorRole.departamentoId?.toString();

    // Check if user is in creator's department
    const isInCreatorDepartment = userRoles.some(
      (role) => role.departmentId?.toString() === creatorDepartmentId
    );

    const isAssistant = userRoles.some((role) => role.roleType === "Asistente");
    const isBoss = userRoles.some((role) => role.roleType === "Jefe");
    const isContabilidad =
      this.permissionService.isInContabilidadDepartment(userEmail);

    // Self approval logic for bosses
    if (expense.createdBy.email === userEmail) {
      if (isBoss && expense.aprobacionJefatura === "Pendiente") {
        // Check if department has assistants or if assistant approval is done
        const hasAssistants =
          this.permissionService.departmentHasAssistants(creatorDepartmentId);
        if (!hasAssistants || expense.aprobacionAsistente === "Aprobada") {
          return true;
        }
      }
      return false;
    }

    // Department Assistant logic
    if (
      isAssistant &&
      isInCreatorDepartment &&
      expense.aprobacionAsistente === "Pendiente"
    ) {
      return true;
    }

    // Department Boss logic
    if (
      isBoss &&
      isInCreatorDepartment &&
      expense.aprobacionJefatura === "Pendiente"
    ) {
      const hasAssistants =
        this.permissionService.departmentHasAssistants(creatorDepartmentId);
      if (!hasAssistants || expense.aprobacionAsistente === "Aprobada") {
        return true;
      }
    }

    // Accounting Department logic (only if we're dealing with someone else's expense)
    if (isContabilidad && !isInCreatorDepartment) {
      // Department approvals must be complete before accounting can approve
      if (expense.aprobacionJefatura === "Aprobada") {
        // For accounting assistant
        if (isAssistant && expense.aprobacionContabilidad === "Pendiente") {
          return true;
        }

        // For accounting boss
        if (isBoss && expense.aprobacionContabilidad === "Pendiente") {
          return true;
        }
      }
    }

    return false;
  }

  getNextApprovalType(expense, userEmail) {
    const userRoles = this.permissionService.getUserRoles(userEmail);
    if (!userRoles || userRoles.length === 0) {
      return null;
    }

    // Get creator's department
    const creatorRole = this.permissionService.roles.find(
      (role) => role.empleado?.email === expense.createdBy.email
    );

    if (!creatorRole) {
      return null;
    }

    const creatorDepartmentId = creatorRole.departamentoId?.toString();

    // Check if user is in creator's department
    const isInCreatorDepartment = userRoles.some(
      (role) => role.departmentId?.toString() === creatorDepartmentId
    );

    const isAssistant = userRoles.some((role) => role.roleType === "Asistente");
    const isBoss = userRoles.some((role) => role.roleType === "Jefe");
    const isContabilidad =
      this.permissionService.isInContabilidadDepartment(userEmail);

    // Self approval logic
    if (expense.createdBy.email === userEmail) {
      if (isBoss && expense.aprobacionJefatura === "Pendiente") {
        // Check if department has assistants or if assistant approval is done
        const hasAssistants =
          this.permissionService.departmentHasAssistants(creatorDepartmentId);
        if (!hasAssistants || expense.aprobacionAsistente === "Aprobada") {
          return "boss";
        }
      }
      return null;
    }

    // Department Assistant logic
    if (
      isAssistant &&
      isInCreatorDepartment &&
      expense.aprobacionAsistente === "Pendiente"
    ) {
      return "assistant";
    }

    // Department Boss logic
    if (
      isBoss &&
      isInCreatorDepartment &&
      expense.aprobacionJefatura === "Pendiente"
    ) {
      const hasAssistants =
        this.permissionService.departmentHasAssistants(creatorDepartmentId);
      if (!hasAssistants || expense.aprobacionAsistente === "Aprobada") {
        return "boss";
      }
    }

    // Accounting Department logic
    if (isContabilidad && !isInCreatorDepartment) {
      // Department approvals must be complete before accounting can approve
      if (expense.aprobacionJefatura === "Aprobada") {
        // For accounting assistant
        if (isAssistant && expense.aprobacionContabilidad === "Pendiente") {
          return "accounting_assistant";
        }

        // For accounting boss
        if (isBoss && expense.aprobacionContabilidad === "Pendiente") {
          return "accounting_boss";
        }
      }
    }

    return null;
  }

  // [Rest of the methods remain unchanged]
  _needsAssistantApproval(expense) {
    const creatorRole = this.permissionService.roles.find(
      (role) => role.empleado?.email === expense.createdBy.email
    );
    if (!creatorRole || !creatorRole.departmentId) return true;
    return this.permissionService.departmentHasAssistants(
      creatorRole.departmentId
    );
  }

  _needsBossApproval(expense) {
    return true;
  }

  _needsContabilidadApproval(expense) {
    return true;
  }

  _getCurrentState(expense) {
    if (!expense) return "unknown";
    if (
      expense.aprobacionAsistente === "No aprobada" ||
      expense.aprobacionJefatura === "No aprobada" ||
      expense.aprobacionContabilidad === "No aprobada"
    ) {
      return "rejected";
    }
    if (expense.aprobacionContabilidad === "Aprobada") {
      return "fully_approved";
    }
    if (expense.aprobacionJefatura === "Aprobada") {
      return "pending_contabilidad";
    }
    if (expense.aprobacionAsistente === "Aprobada") {
      return "pending_boss";
    }
    return "pending_assistant";
  }

  _isFullyApproved(expense) {
    if (!expense) return false;
    return expense.aprobacionContabilidad === "Aprobada";
  }

  _isRejected(expense) {
    if (!expense) return false;
    return (
      expense.aprobacionAsistente === "No aprobada" ||
      expense.aprobacionJefatura === "No aprobada" ||
      expense.aprobacionContabilidad === "No aprobada"
    );
  }
}

export default ApprovalFlowService;
