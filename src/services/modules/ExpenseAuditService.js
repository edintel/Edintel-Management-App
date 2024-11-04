// src/services/modules/ExpenseAuditService.js
import BaseGraphService from '../BaseGraphService';
import { findOrCreatePeriodForDate } from '../../utils/periodUtils';

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

  // Period Methods
  async getPeriods() {
    const items = await this.getListItems(this.siteId, this.config.lists.periods);
    return items.map((item) => ({
      id: item.id,
      inicio: new Date(item.fields.Inicio),
      fin: new Date(item.fields.Fin),
      periodo: item.fields.Periodo,
    }));
  }

  async createPeriod(periodData) {
    await this.initializeGraphClient();

    const fields = {
      Inicio: periodData.inicio.toISOString(),
      Fin: periodData.fin.toISOString(),
    };

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.periods}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({
          fields: fields,
        });

      return {
        id: response.id,
        inicio: new Date(response.fields.Inicio),
        fin: new Date(response.fields.Fin),
        periodo: response.fields.Periodo,
      };
    } catch (error) {
      console.error("Error creating period:", error);
      throw new Error("Error al crear el periodo en SharePoint");
    }
  }

  // Expense Report Methods
  async getExpenseReports() {
    const items = await this.getListItems(this.siteId, this.config.lists.expenseReports);
    return items.map((item) => ({
      id: item.id,
      rubro: item.fields.Rubro,
      comprobante: item.fields.Comprobante || null,
      fecha: new Date(item.fields.Fecha),
      monto: parseFloat(item.fields.Monto) || 0,
      st: item.fields.ST,
      periodoId: item.fields.PeriodoIDLookupId,
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
    }));
  }

  async createExpenseReport(expenseData, imageFile = null) {
    await this.initializeGraphClient();

    const periodInfo = findOrCreatePeriodForDate(
      expenseData.fecha,
      await this.getPeriods()
    );
    let periodId = expenseData.periodoId;

    if (!periodInfo.exists) {
      const newPeriod = await this.createPeriod(periodInfo.period);
      periodId = newPeriod.id;
    } else {
      periodId = periodInfo.period.id;
    }

    let comprobanteId = null;
    if (imageFile) {
      const accounts = this.msalInstance.getAllAccounts();
      const userDisplayName = accounts[0]?.name || "Unknown";
      const folderPath = `/Comprobantes/${userDisplayName}`;
      comprobanteId = await this.uploadFile(this.siteId, this.driveId, imageFile, folderPath);
    }

    const fields = {
      Title: expenseData.motivo,
      Rubro: expenseData.rubro,
      Monto: expenseData.monto,
      Fecha: expenseData.fecha,
      ST: expenseData.st,
      Fondospropios: expenseData.fondosPropios,
      Comprobante: comprobanteId,
      PeriodoIDLookupId: periodId,
      FacturaDividida: expenseData.facturaDividida,
      Integrantes: expenseData.integrantes,
    };

    const response = await this.client
      .api(`/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items`)
      .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
      .post({
        fields: fields,
      });

    return response;
  }

  async updateExpenseReport(id, expenseData, newImageFile = null) {
    await this.initializeGraphClient();

    const periodInfo = findOrCreatePeriodForDate(
      expenseData.fecha,
      await this.getPeriods()
    );
    let periodId = expenseData.periodoId;

    if (!periodInfo.exists) {
      const newPeriod = await this.createPeriod(periodInfo.period);
      periodId = newPeriod.id;
    } else {
      periodId = periodInfo.period.id;
    }

    let comprobanteId = expenseData.comprobante;

    if (newImageFile) {
      const accounts = this.msalInstance.getAllAccounts();
      const userDisplayName = accounts[0]?.name || "Unknown";
      const folderPath = `/Comprobantes/${userDisplayName}`;
      comprobanteId = await this.uploadFile(this.siteId, this.driveId, newImageFile, folderPath);
    }

    const fields = {
      Title: expenseData.motivo,
      Rubro: expenseData.rubro,
      Monto: expenseData.monto.toString(),
      Fecha: expenseData.fecha,
      ST: expenseData.st,
      Fondospropios: expenseData.fondosPropios,
      PeriodoIDLookupId: periodId,
      FacturaDividida: expenseData.facturaDividida,
      Integrantes: expenseData.integrantes,
    };

    if (comprobanteId) {
      fields.Comprobante = comprobanteId;
    }

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items/${id}`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: fields,
        });

      return {
        ...response,
        fields: {
          ...response.fields,
          Comprobante: comprobanteId || response.fields.Comprobante,
        },
      };
    } catch (error) {
      console.error("Error updating expense report:", error);
      throw new Error(error.message || "Error al actualizar el gasto en SharePoint");
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
        .api(`/sites/${this.siteId}/lists/${this.config.lists.expenseReports}/items/${id}`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: fields,
        });

      return response;
    } catch (error) {
      console.error("Error updating approval status:", error);
      throw new Error(error.message || "Error al actualizar el estado de aprobación");
    }
  }

  // Department and Role Methods
  async getDepartments() {
    const items = await this.getListItems(this.siteId, this.config.lists.departments);
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

  // Helper Methods for Data Mapping
  mapPeriodReports(periods, reports) {
    return periods.map((period) => ({
      ...period,
      reports: reports.filter((report) => report.periodoId === period.id),
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

  createPeriodUserReportsMapping(periods, reports, roles) {
    const mapping = periods.map((period) => {
      const periodReports = reports.filter(
        (report) => report.periodoId === period.id
      );

      const userReports = {};
      periodReports.forEach((report) => {
        if (!userReports[report.createdBy.email]) {
          const userRole = roles.find(
            (role) => role.empleado?.email === report.createdBy.email
          );
          userReports[report.createdBy.email] = {
            user: userRole?.empleado || { email: report.createdBy.email },
            reports: [],
          };
        }
        userReports[report.createdBy.email].reports.push(report);
      });

      return {
        ...period,
        users: Object.values(userReports),
      };
    });

    return mapping;
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

  canApprove(expense, role) {
    switch (role) {
      case "Asistente":
        return expense.aprobacionAsistente === "Pendiente" ||
               expense.aprobacionAsistente === "No aprobada";
        
      case "Jefe":
        return (expense.aprobacionAsistente === "Aprobada" && 
                expense.aprobacionJefatura === "Pendiente") ||
               expense.aprobacionJefatura === "No aprobada";
        
      case "Contabilidad":
        return (expense.aprobacionJefatura === "Aprobada" && 
                expense.aprobacionContabilidad === "Pendiente") ||
               expense.aprobacionContabilidad === "No aprobada";
        
      default:
        return false;
    }
  }
}

export default ExpenseAuditService;