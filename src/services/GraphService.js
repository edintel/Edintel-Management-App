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

  async getSiteId() {
    const siteResponse = await this.client
      .api(`/sites/${this.tenantName}.sharepoint.com:/sites/${this.siteName}`)
      .get();
    return siteResponse.id;
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
      comprobante: item.fields.Comprobante_x002f_Factura,
      fecha: item.fields.Fecha,
      monto: item.fields.Monto,
      st: item.fields.ST,
      periodoId: item.fields.PeriodoID,
      fondosPropios: item.fields.Fondospropios,
      notasRevision: item.fields.Notasrevisi_x00f3_n,
      bloqueoEdicion: item.fields.Bloqueoedici_x00f3_n,
      aprobacionAsistente: item.fields.Aprobaci_x00f3_n_x0020_Departame,
      aprobacionJefatura: item.fields.Aprobaci_x00f3_n_x0020_Jefatura,
      aprobacionContabilidad: item.fields.Aprobaci_x00f3_n_x0020_Contabili,
    }));
  }

  async getDepartments() {
    const items = await this.getListItems("departments");
    return items.map((item) => ({
      id: item.id,
      departamento: item.fields.Departamento,
      asistentes: item.fields.Asistentes,
      jefes: item.fields.Jefes,
    }));
  }

  async getRoles() {
    const items = await this.getListItems("roles");
    return items.map((item) => ({
      id: item.id,
      empleado: item.fields.Empleado,
      departamentoId: item.fields.DepartamentoID,
    }));
  }
}

export default GraphService;
