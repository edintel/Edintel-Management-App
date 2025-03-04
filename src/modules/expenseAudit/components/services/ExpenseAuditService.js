import BaseGraphService from "../../../../services/BaseGraphService";
import PermissionService from "./PermissionService";
import ApprovalFlowService from "./ApprovalFlowService";

/**
 * ExpenseAuditService - Handles expense report operations and approval flows
 * 
 * This service interacts with SharePoint and provides methods for:
 * - Fetching and manipulating expense reports
 * - Managing approval workflows
 * - Handling permissions and user roles
 */
class ExpenseAuditService extends BaseGraphService {
  constructor(msalInstance, config) {
    super(msalInstance);
    this.config = config;
    this.permissionService = new PermissionService(this);
    this.approvalFlowService = new ApprovalFlowService(this.permissionService);
    this.loginRequest = {
      scopes: [
        "User.Read",
        "User.Read.All",
        "Sites.Read.All",
        "Sites.ReadWrite.All",
        "Files.ReadWrite.All",
      ],
    };
  }

  /**
   * Initialize the service and its dependencies
   */
  async initialize() {
    // First get the site and drive IDs
    this.siteId = await this.getSiteId(this.config.siteName);
    this.driveId = this.config.driveId;

    // Now load the roles and departments data
    const [departments, roles] = await Promise.all([
      this.getDepartments(),
      this.getRoles()
    ]);

    // Finally, initialize the permission service with the data
    await this.permissionService.initialize(roles, departments);

  }

  /**
   * Get all expense reports from SharePoint
   * @returns {Array} Array of formatted expense report objects
   */
  async getExpenseReports() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.expenseReports
    );

    return items.map((item) => ({
      id: item.id,
      rubro: item.fields.Rubro,
      comprobante: item.fields.Comprobante || null,
      fecha: new Date(item.fields.Fecha),
      monto: parseFloat(item.fields.Monto) || 0,
      st: item.fields.ST,
      fondosPropios: Boolean(item.fields.Fondospropios),
      motivo: item.fields.Title,
      notasRevision: item.fields.Notasrevision,
      facturaDividida: Boolean(item.fields.FacturaDividida),
      integrantes: item.fields.Integrantes || "",
      bloqueoEdicion: Boolean(item.fields.Bloqueoedici_x00f3_n),
      aprobacionAsistente: item.fields.Aprobaci_x00f3_nAsistente || "Pendiente",
      aprobacionJefatura: item.fields.Aprobaci_x00f3_nJefatura || "Pendiente",
      aprobacionContabilidad: item.fields.Aprobaci_x00f3_nContabilidad || "Pendiente",
      createdBy: {
        name: item.createdBy.user.displayName || "",
        email: item.createdBy.user.email || "",
        id: item.createdBy.user.id || "",
      },
      notas: item.fields.Notas || "",
      IntegrantesV2: Array.isArray(item.fields.IntegrantesV2)
        ? item.fields.IntegrantesV2.map(integrante => ({
          email: integrante.Email,
          displayName: integrante.LookupValue,
          id: integrante.LookupId
        }))
        : [],
    }));
  }

  /**
   * Create a new expense report
   * @param {Object} expenseData - The expense data
   * @param {File} imageFile - The receipt image file
   * @returns {Object} The created expense report
   */
  async createExpenseReport(expenseData, imageFile = null) {
    await this.initializeGraphClient();
    let comprobanteId = null;
    if (imageFile) {
      const accounts = this.msalInstance.getAllAccounts();
      const userDisplayName = accounts[0]?.name || "Unknown";
      const folderPath = `/Comprobantes/${userDisplayName}`;
      comprobanteId = await this.uploadFile(
        this.siteId,
        this.driveId,
        imageFile,
        folderPath
      );
    }
    const fields = {
      Title: expenseData.motivo,
      Rubro: expenseData.rubro,
      Monto: expenseData.monto,
      Fecha: expenseData.fecha,
      ST: expenseData.st,
      Fondospropios: expenseData.fondosPropios,
      Comprobante: comprobanteId,
      FacturaDividida: expenseData.facturaDividida,
      Integrantes: expenseData.integrantes,
      Notas: expenseData.notas,
      "IntegrantesV2LookupId@odata.type": "Collection(Edm.String)",
      IntegrantesV2LookupId: expenseData.IntegrantesV2?.map(i => i.id.toString()) || [],
    };

    const userEmail = this.msalInstance.getAllAccounts()[0]?.username;
    const userRoles = this.permissionService.getUserRoles(userEmail);
    if (userRoles && userRoles.length > 0) {
      const userRole = userRoles[0];
      const isCreatorAssistant = userRoles.some(role => role.roleType === 'Asistente');

      if (userRole && userRole.departmentId) {
        const hasAssistants = this.permissionService.departmentHasAssistants(userRole.departmentId);
        if (!hasAssistants || isCreatorAssistant) {
          fields.Aprobaci_x00f3_nAsistente = "Aprobada";
        }
      }
    }

    const response = await this.client
      .api(
        `/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items`
      )
      .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
      .post({
        fields: fields,
      });
    return response;
  }

  /**
   * Delete an expense report
   * @param {string} id - The expense report ID
   * @returns {boolean} True if successful
   */
  async deleteExpenseReport(id) {
    await this.initializeGraphClient();
    try {
      const expense = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items/${id}`
        )
        .expand("fields")
        .get();
      if (expense.fields.Comprobante) {
        await this.deleteFile(expense.fields.Comprobante);
      }
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items/${id}`
        )
        .delete();
      return true;
    } catch (error) {
      console.error("Error deleting expense report:", error);
      throw new Error(error.message || "Error al eliminar el gasto");
    }
  }

  /**
   * Update an expense report
   * @param {string} id - The expense report ID
   * @param {Object} expenseData - The expense data
   * @param {File} newImageFile - The new receipt image file
   * @returns {Object} The updated expense report
   */
  async updateExpenseReport(id, expenseData, newImageFile = undefined) {
    await this.initializeGraphClient();
    let comprobanteId = expenseData.comprobante;
    if (newImageFile) {
      if (comprobanteId) {
        await this.deleteFile(comprobanteId);
      }
      const accounts = this.msalInstance.getAllAccounts();
      const userDisplayName = accounts[0]?.name || "Unknown";
      const folderPath = `/Comprobantes/${userDisplayName}`;
      comprobanteId = await this.uploadFile(
        this.siteId,
        this.driveId,
        newImageFile,
        folderPath
      );
    }
    else if (newImageFile === null) {
      if (comprobanteId) {
        await this.deleteFile(comprobanteId);
      }
      comprobanteId = null;
    }
    const fields = {
      Title: expenseData.motivo,
      Rubro: expenseData.rubro,
      Monto: expenseData.monto.toString(),
      Fecha: expenseData.fecha,
      ST: expenseData.st,
      Fondospropios: expenseData.fondosPropios,
      FacturaDividida: expenseData.facturaDividida,
      Integrantes: expenseData.integrantes,
      Comprobante: comprobanteId,
      Notas: expenseData.notas,
      "IntegrantesV2LookupId@odata.type": "Collection(Edm.String)",
      IntegrantesV2LookupId: expenseData.IntegrantesV2?.map(i => i.id.toString()) || [],
    };
    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items/${id}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: fields,
        });
      return {
        ...response,
        fields: {
          ...response.fields,
          Comprobante: comprobanteId,
        },
      };
    } catch (error) {
      console.error("Error updating expense report:", error);
      throw new Error(
        error.message || "Error al actualizar el gasto en SharePoint"
      );
    }
  }

  /**
   * Update expense integrantes (contributors)
   * @param {string} expenseId - The expense report ID
   * @param {Array} integranteIds - Array of contributor IDs
   * @returns {Object} The updated expense report
   */
  async updateExpenseIntegrantes(expenseId, integranteIds) {
    await this.initializeGraphClient();
    try {
      const integranteLookups = integranteIds.map((id) => id.toString());
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items/${expenseId}`
        )
        .patch({
          fields: {
            "IntegrantesV2LookupId@odata.type": "Collection(Edm.String)",
            IntegrantesV2LookupId: integranteLookups,
          },
        });
      return response;
    } catch (error) {
      console.error("Error updating integrantes:", error);
      throw new Error("Error al actualizar integrantes");
    }
  }

  /**
   * Update approval status of an expense
   * @param {string} id - The expense report ID
   * @param {string} status - The approval status
   * @param {string} type - The approval type
   * @param {string} notes - The approval notes
   * @returns {Object} The updated expense report
   */
  async updateApprovalStatus(id, status, type, notes = "") {
    await this.initializeGraphClient();

    const fields = {
      Bloqueoedici_x00f3_n: true,
      Notasrevision: notes,
    };

    // First, get the current expense to check the workflow
    const currentExpense = await this.client
      .api(`/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items/${id}`)
      .expand('fields')
      .get();

    // Map approval type to field
    switch (type) {
      case "accounting_assistant":
        fields.Aprobaci_x00f3_nAsistente = status;
        break;

      case "accounting_boss":
        if (currentExpense.fields.Aprobaci_x00f3_nAsistente === "Aprobada") {
          fields.Aprobaci_x00f3_nJefatura = status;
          if (status === "Aprobada") {
            fields.Aprobaci_x00f3_nContabilidad = "Aprobada";
          }
        }
        break;

      case "assistant":
        fields.Aprobaci_x00f3_nAsistente = status;
        break;

      case "boss":
        const creatorEmail = currentExpense.createdBy?.user?.email;

        if (!creatorEmail) {
          break;
        }

        const creatorRole = this.permissionService.roles.find(
          role => role.empleado?.email === creatorEmail
        );

        if (!creatorRole) {
          break;
        }

        const hasAssistants = this.permissionService.departmentHasAssistants(
          creatorRole.departmentId
        );

        if (!hasAssistants || currentExpense.fields.Aprobaci_x00f3_nAsistente === "Aprobada") {
          fields.Aprobaci_x00f3_nJefatura = status;
        } else {
        }
        break;

      default:
        throw new Error("Invalid approval type");
    }

    // Set contabilidad approval if boss approval is set to Aprobada
    if (fields.Aprobaci_x00f3_nJefatura === "Aprobada") {
      fields.Aprobaci_x00f3_nContabilidad = "Aprobada";
    }

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items/${id}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: fields,
        });

      return response;
    } catch (error) {
      console.error("Error updating approval status:", error);
      throw new Error(
        error.message || "Error al actualizar el estado de aprobación"
      );
    }
  }

  /**
   * Get departments from SharePoint
   * @returns {Array} Array of department objects
   */
  async getDepartments() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.departments
    );
    return items.map((item) => ({
      id: item.id,
      departamento: item.fields.Departamento,
      asistentes: Array.isArray(item.fields.Asistentes)
        ? item.fields.Asistentes.map((asistente) => ({
          email: asistente.Email,
          displayName: asistente.LookupValue,
          id: asistente.LookupId,
        }))
        : [],
      jefes: Array.isArray(item.fields.Jefes)
        ? item.fields.Jefes.map((jefe) => ({
          email: jefe.Email,
          displayName: jefe.LookupValue,
          id: jefe.LookupId,
        }))
        : [],
    }));
  }

  /**
   * Get roles from SharePoint
   * @returns {Array} Array of role objects
   */
  async getRoles() {
    const items = await this.getListItems(this.siteId, this.config.lists.roles);
    return items.map((item) => ({
      id: item.id,
      empleado:
        Array.isArray(item.fields.Empleado) && item.fields.Empleado.length > 0
          ? {
            email: item.fields.Empleado[0].Email,
            displayName: item.fields.Empleado[0].LookupValue,
            id: item.fields.Empleado[0].LookupId,
          }
          : null,
      departamentoId: item.fields["DepartamentoID_x003a__x0020_DepaLookupId"]
        ? parseInt(item.fields["DepartamentoID_x003a__x0020_DepaLookupId"], 10)
        : null,
    }));
  }

  /**
   * Map departments to their workers
   * @param {Array} departments - Array of departments
   * @param {Array} roles - Array of roles
   * @returns {Array} Departments with workers
   */
  mapDepartmentWorkers(departments, roles) {
    return departments.map((department) => ({
      ...department,
      workers: roles.filter(
        (role) => role.departamentoId === parseInt(department.id, 10)
      ),
    }));
  }

  /**
   * Filter reports by user email
   * @param {Array} reports - Array of expense reports
   * @param {string} userEmail - The user email
   * @returns {Array} Filtered expense reports
   */
  filterReportsByEmail(reports, userEmail) {
    return reports.filter((report) => report.createdBy.email === userEmail);
  }

  /**
   * Get user's department and role
   * @param {string} userEmail - The user email
   * @param {Array} departments - Array of departments
   * @param {Array} roles - Array of roles
   * @returns {Object|null} User's department and role
   */
  getUserDepartmentRole(userEmail, departments, roles) {
    const userRoles = this.permissionService.getUserRoles(userEmail);

    if (userRoles.length === 0) return null;

    // Prioritize administrative roles (Jefe, Asistente) over Empleado
    const adminRole = userRoles.find(role =>
      role.roleType === 'Jefe' || role.roleType === 'Asistente'
    );

    const selectedRole = adminRole || userRoles[0];

    return {
      department: selectedRole.department,
      role: selectedRole.roleType
    };
  }

  /**
   * Check if user can approve an expense
   * @param {Object} expense - The expense object
   * @param {string} role - The user role
   * @param {string} department - The department name
   * @returns {boolean} True if user can approve
   */
  canApprove(expense, role, department = "") {
    const userEmail = this.msalInstance.getAllAccounts()[0]?.username;
    return this.approvalFlowService.canApprove(expense, userEmail);
  }

  /**
   * Check if user can view an expense
   * @param {Object} expense - The expense object
   * @param {Object} userDepartmentRole - The user's department role
   * @returns {boolean} True if user can view the expense
   */
  canViewExpense(expense, userDepartmentRole) {
    if (!userDepartmentRole) return false;

    const userEmail = this.msalInstance.getAllAccounts()[0]?.username;

    // Always allow viewing own expenses
    if (expense.createdBy.email === userEmail) {
      return true;
    }

    // Allow contabilidad to view all expenses
    if (userDepartmentRole.department?.departamento.toLowerCase().includes('contabilidad')) {
      return true;
    }

    // Allow jefes and asistentes to view expenses from their department
    if (userDepartmentRole.role === 'Jefe' || userDepartmentRole.role === 'Asistente') {
      const expenseCreator = this.permissionService.roles.find(role =>
        role.empleado?.email === expense.createdBy.email
      );

      if (!expenseCreator) return false;

      return userDepartmentRole.department &&
        expenseCreator.departamentoId === parseInt(userDepartmentRole.department.id);
    }

    return false;
  }

  /**
   * Filter expenses by department
   * @param {Array} expenses - Array of expense reports
   * @param {Object} userDepartmentRole - The user's department role
   * @returns {Array} Filtered expense reports
   */
  filterExpensesByDepartment(expenses, userDepartmentRole) {
    if (!userDepartmentRole) return [];

    const userEmail = this.msalInstance.getAllAccounts()[0]?.username;

    return expenses.filter(expense =>
      expense.createdBy.email === userEmail || this.canViewExpense(expense, userDepartmentRole)
    );
  }

  /**
   * Get approval type based on user role
   * @param {Object} userDepartmentRole - The user's department role
   * @returns {string|null} The approval type
   */
  getApprovalType(userDepartmentRole) {
    if (!userDepartmentRole) return null;

    const isAccountant = (userDepartmentRole.department?.departamento || '')
      .toLowerCase()
      .includes('contabilidad');

    if (isAccountant) {
      return userDepartmentRole.role === "Jefe" ? "accounting_boss" : "accounting_assistant";
    }

    return userDepartmentRole.role === "Jefe" ? "boss" : "assistant";
  }
}

export default ExpenseAuditService;
