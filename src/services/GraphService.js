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

  async getImageUrl(itemId, fileName) {
    if (!fileName || !itemId) return null;
    
    await this.initializeGraphClient();
    
    try {
      const fileNameEncoded = encodeURIComponent(fileName);

      const attachmentUrl = `https://${this.tenantName}.sharepoint.com/sites/${this.siteName}/_api/v2.1/sites('${this.siteId}')/lists('${this.listId}')/items('${itemId}')/attachments('${fileNameEncoded}')/content`;

      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const tokenResponse = await this.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      return {
        url: attachmentUrl,
        token: tokenResponse.accessToken
      };
    } catch (error) {
      console.error('Error fetching image URL:', error);
      throw error;
    }
  }

  async getSiteId() {
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

  parseImageFileName(comprobanteField) {
    if (!comprobanteField) return null;
    
    try {
      if (typeof comprobanteField === 'string') {
        try {
          const parsed = JSON.parse(comprobanteField);
          return parsed.fileName || null;
        } catch {
          return comprobanteField;
        }
      } else if (comprobanteField.fileName) {
        return comprobanteField.fileName;
      }
      return null;
    } catch {
      return null;
    }
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
      comprobante: this.parseImageFileName(item.fields.Comprobante_x002f_Factura),
      comprobanteRaw: item.fields.Comprobante_x002f_Factura,
      fecha: item.fields.Fecha,
      monto: parseFloat(item.fields.Monto) || 0,
      st: item.fields.ST,
      periodoId: item.fields.PeriodoID,
      fondosPropios: Boolean(item.fields.Fondospropios),
      motivo: item.fields.Title,
      notasRevision: item.fields.Notasrevisi_x00f3_n,
      bloqueoEdicion: Boolean(item.fields.Bloqueoedici_x00f3_n),
      aprobacionAsistente: Boolean(item.fields.Aprobaci_x00f3_n_x0020_Departame),
      aprobacionJefatura: Boolean(item.fields.Aprobaci_x00f3_n_x0020_Jefatura),
      aprobacionContabilidad: Boolean(item.fields.Aprobaci_x00f3_n_x0020_Contabili),
      createdBy: item.fields.Author?.Email || '',
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
          const userRole = roles.find(role => role.empleado?.email === report.createdBy);
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