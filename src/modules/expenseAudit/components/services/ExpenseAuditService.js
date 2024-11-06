import BaseGraphService from "../../../../services/BaseGraphService";

class ExpenseAuditService extends BaseGraphService {
  constructor(msalInstance, config) {
    super(msalInstance);
    this.config = config;
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

  async initialize() {
    this.siteId = await this.getSiteId(this.config.siteName);
    this.driveId = this.config.driveId;
  }

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
      aprobacionContabilidad:
        item.fields.Aprobaci_x00f3_nContabilidad || "Pendiente",
      createdBy: {
        name: item.createdBy.user.displayName || "",
        email: item.createdBy.user.email || "",
        id: item.createdBy.user.id || "",
      },
    }));
  }

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
    };

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

  async deleteImage(itemId) {
    if (!itemId) return;

    await this.initializeGraphClient();
    try {
      await this.client
        .api(`/sites/${this.siteId}/drives/${this.driveId}/items/${itemId}`)
        .delete();
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  }

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
        await this.deleteImage(expense.fields.Comprobante);
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

  async updateExpenseReport(id, expenseData, newImageFile = undefined) {
    await this.initializeGraphClient();

    let comprobanteId = expenseData.comprobante;

    // Case 1: New image is being uploaded
    if (newImageFile) {
      if (comprobanteId) {
        await this.deleteImage(comprobanteId);
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
    // Case 2: Image is explicitly being removed (user clicked remove button)
    else if (newImageFile === null) {
      if (comprobanteId) {
        await this.deleteImage(comprobanteId);
      }
      comprobanteId = null;
    }
    // Case 3: No image changes (newImageFile is undefined)
    // Keep existing comprobanteId

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

  async updateApprovalStatus(id, status, type, notes = "") {
    await this.initializeGraphClient();

    const fields = {
      Bloqueoedici_x00f3_n: true,
      Notasrevision: notes,
    };

    switch (type) {
      case "assistant":
        fields.Aprobaci_x00f3_nAsistente = status;
        break;
      case "boss":
        fields.Aprobaci_x00f3_nJefatura = status;
        break;
      case "accounting":
        fields.Aprobaci_x00f3_nContabilidad = status;
        break;
      default:
        throw new Error("Invalid approval type");
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

  mapDepartmentWorkers(departments, roles) {
    return departments.map((department) => ({
      ...department,
      workers: roles.filter(
        (role) => role.departamentoId === parseInt(department.id, 10)
      ),
    }));
  }

  filterReportsByEmail(reports, userEmail) {
    return reports.filter((report) => report.createdBy.email === userEmail);
  }

  getUserDepartmentRole(userEmail, departments, roles) {
    const userRole = roles.find((role) => role.empleado?.email === userEmail);
    if (!userRole) return null;

    const userDepartment = departments.find(
      (dept) => dept.id === userRole.departamentoId.toString()
    );
    if (!userDepartment) return null;

    const role = (() => {
      if (userDepartment.asistentes.some((asst) => asst.email === userEmail))
        return "Asistente";
      if (userDepartment.jefes.some((boss) => boss.email === userEmail))
        return "Jefe";
      return "Empleado";
    })();

    return {
      department: userDepartment,
      role: role,
    };
  }

  canApprove(expense, role, department = '') {
    if (role !== "Jefe" && role !== "Asistente") {
      return false;
    }

    const isAccountingApprover = (department || '').toLowerCase().includes('contabilidad');
    
    if (isAccountingApprover) {
      return (expense.aprobacionJefatura === "Aprobada" &&
        expense.aprobacionContabilidad === "Pendiente") ||
        expense.aprobacionContabilidad === "No aprobada";
    }

    switch (role) {
      case "Asistente":
        return expense.aprobacionAsistente === "Pendiente" ||
               expense.aprobacionAsistente === "No aprobada";

      case "Jefe":
        return (expense.aprobacionAsistente === "Aprobada" &&
                expense.aprobacionJefatura === "Pendiente") ||
                expense.aprobacionJefatura === "No aprobada";

      default:
        return false;
    }
  }

  getEffectiveRole(userDepartmentRole) {
    if (!userDepartmentRole || 
        (userDepartmentRole.role !== "Jefe" && 
         userDepartmentRole.role !== "Asistente")) {
      return null;
    }

    const isAccountingApprover = (userDepartmentRole.department?.departamento || '')
      .toLowerCase()
      .includes('contabilidad');

    if (isAccountingApprover) return 'Contabilidad';
    return userDepartmentRole.role;
  }
}

export default ExpenseAuditService;
