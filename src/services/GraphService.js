import { Client } from "@microsoft/microsoft-graph-client";
import { loginRequest } from "../config/AuthConfig";
import { sharePointConfig } from "../config/SharePointConfig";

class GraphService {
  constructor(msalInstance) {
    this.msalInstance = msalInstance;
    this.client = null;
    this.tenantName = sharePointConfig.tenantName;
    this.siteName = sharePointConfig.siteName;
    this.lists = sharePointConfig.lists;
    this.siteId = sharePointConfig.siteId;
    this.driveId = sharePointConfig.driveId;
  }

  async initializeGraphClient() {
    if (!this.client) {
      const authProvider = {
        getAccessToken: async () => {
          const accounts = this.msalInstance.getAllAccounts();
          if (accounts.length === 0) {
            throw new Error("No accounts found. Please sign in.");
          }
          const account = accounts[0];
          const response = await this.msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: account,
          });
          return response.accessToken;
        },
      };
      this.client = Client.initWithMiddleware({ authProvider });
    }
  }

  async getImageContent(itemId) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    
    try {
      await this.initializeGraphClient();

      const response = await this.client
        .api(`/sites/${this.siteId}/drives/${this.driveId}/items/${itemId}`)
        .get();

      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const tokenResponse = await this.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      return {
        url: response['@microsoft.graph.downloadUrl'] || response,
        token: tokenResponse.accessToken
      };
    } catch (error) {
      throw error;
    }
  }

  async getSiteId() {
    await this.initializeGraphClient();
    const siteResponse = await this.client
      .api(`/sites/${this.tenantName}.sharepoint.com:/sites/${this.siteName}`)
      .get();
    return siteResponse.id;
  }

  async getListId(listName) {
    const siteId = await this.getSiteId();
    const response = await this.client
      .api(`/sites/${siteId}/lists`)
      .filter(`name eq '${listName}'`)
      .get();
    
    return response.value[0].id;
  }

  async getListItems(listName) {
    await this.initializeGraphClient();
    const siteId = await this.getSiteId();
    const response = await this.client
      .api(`/sites/${siteId}/lists/${this.lists[listName]}/items`)
      .expand("fields")
      .get();
    return response.value;
  }

  async getPeriods() {
    const items = await this.getListItems("periods");
    return items.map((item) => ({
      id: item.id,
      inicio: item.fields.Inicio,
      fin: item.fields.Fin,
      periodo: item.fields.Periodo,
    }));
  }

  async getExpenseReports() {
    const items = await this.getListItems("expenseReports");
    return items.map((item) => ({
      id: item.id,
      rubro: item.fields.Rubro,
      comprobante: item.fields.Comprobante || null,
      fecha: item.fields.Fecha,
      monto: parseFloat(item.fields.Monto) || 0,
      st: item.fields.ST,
      periodoId: item.fields.PeriodoIDLookupId,
      fondosPropios: Boolean(item.fields.Fondospropios),
      motivo: item.fields.Title,
      notasRevision: item.fields.Notasrevision,
      bloqueoEdicion: Boolean(item.fields.Bloqueoedici_x00f3_n),
      aprobacionAsistente: Boolean(item.fields.Aprobaci_x00f3_n_x0020_Departame),
      aprobacionJefatura: Boolean(item.fields.Aprobaci_x00f3_n_x0020_Jefatura),
      aprobacionContabilidad: Boolean(item.fields.Aprobaci_x00f3_n_x0020_Contabili),
      createdBy: {
        name: item.createdBy.user.displayName || '',
        email: item.createdBy.user.email || '',
        id: item.createdBy.user.id || '',
      },
    }));
  }

  async getDepartments() {
    const items = await this.getListItems("departments");
    return items.map((item) => ({
      id: item.id,
      departamento: item.fields.Departamento,
      asistentes: Array.isArray(item.fields.Asistentes) 
        ? item.fields.Asistentes.map(asistente => ({
            email: asistente.Email,
            displayName: asistente.LookupValue,
            id: asistente.LookupId
          }))
        : [],
      jefes: Array.isArray(item.fields.Jefes) 
        ? item.fields.Jefes.map(jefe => ({
            email: jefe.Email,
            displayName: jefe.LookupValue,
            id: jefe.LookupId
          }))
        : [],
    }));
  }

  async getRoles() {
    const items = await this.getListItems("roles");
    return items.map((item) => ({
      id: item.id,
      empleado: Array.isArray(item.fields.Empleado) && item.fields.Empleado.length > 0
        ? {
            email: item.fields.Empleado[0].Email,
            displayName: item.fields.Empleado[0].LookupValue,
            id: item.fields.Empleado[0].LookupId
          }
        : null,
      departamentoId: item.fields["DepartamentoID_x003a__x0020_DepaLookupId"] 
        ? parseInt(item.fields["DepartamentoID_x003a__x0020_DepaLookupId"], 10) 
        : null
    }));
  }

  mapPeriodReports(periods, reports) {
    return periods.map(period => ({
      ...period,
      reports: reports.filter(report => report.periodoId === period.id)
    }));
  }

  mapDepartmentWorkers(departments, roles) {
    return departments.map(department => ({
      ...department,
      workers: roles.filter(role => role.departamentoId === parseInt(department.id, 10))
    }));
  }

  filterReportsByEmail(reports, userEmail) {
    return reports.filter(report => report.createdBy === userEmail);
  }

  createPeriodUserReportsMapping(periods, reports, roles) {
    const mapping = periods.map(period => {
      const periodReports = reports.filter(report => report.periodoId === period.id);
      
      const userReports = {};
      periodReports.forEach(report => {
        if (!userReports[report.createdBy]) {
          const userRole = roles.find(role => role.empleado?.email === report.createdBy.email);
          userReports[report.createdBy] = {
            user: userRole?.empleado || { email: report.createdBy },
            reports: []
          };
        }
        userReports[report.createdBy].reports.push(report);
      });

      return {
        ...period,
        users: Object.values(userReports)
      };
    });

    return mapping;
  }

  getUserDepartmentRole(userEmail, departments, roles) {
    const userRole = roles.find(role => role.empleado?.email === userEmail);
    if (!userRole) return null;

    const userDepartment = departments.find(dept => dept.id === userRole.departamentoId.toString());
    if (!userDepartment) return null;

    const role = (() => {
      if (userDepartment.asistentes.some(asst => asst.email === userEmail)) return 'Assistente';
      if (userDepartment.jefes.some(boss => boss.email === userEmail)) return 'Jefe';
      return 'Empleado';
    })();

    return {
      department: userDepartment,
      role: role
    };
  }
}

export default GraphService;