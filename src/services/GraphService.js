import { Client } from "@microsoft/microsoft-graph-client";
import { loginRequest } from "../config/AuthConfig";
import { sharePointConfig } from "../config/SharePointConfig";
import { findOrCreatePeriodForDate } from "../utils/periodUtils";

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
      throw new Error("Item ID is required");
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
        url: response["@microsoft.graph.downloadUrl"] || response,
        token: tokenResponse.accessToken,
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
      inicio: new Date(item.fields.Inicio),
      fin: new Date(item.fields.Fin),
      periodo: item.fields.Periodo,
    }));
  }

  async getExpenseReports() {
    const items = await this.getListItems("expenseReports");
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
      aprobacionContabilidad:
        item.fields.Aprobaci_x00f3_nContabilidad || "Pendiente",
      createdBy: {
        name: item.createdBy.user.displayName || "",
        email: item.createdBy.user.email || "",
        id: item.createdBy.user.id || "",
      },
    }));
  }

  async getDepartments() {
    const items = await this.getListItems("departments");
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
    const items = await this.getListItems("roles");
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

  async createFolder(folderPath) {
    await this.initializeGraphClient();

    const pathSegments = folderPath.split("/").filter(Boolean);
    let currentPath = "";

    for (const segment of pathSegments) {
      const encodedSegment = encodeURIComponent(segment);
      currentPath += `/${encodedSegment}`;
      try {
        await this.client
          .api(
            `/sites/${this.siteId}/drives/${this.driveId}/root:${currentPath}`
          )
          .get();
      } catch (error) {
        if (error.statusCode === 404) {
          await this.client
            .api(
              `/sites/${this.siteId}/drives/${this.driveId}/root:${currentPath}`
            )
            .header("Content-Type", "application/json")
            .put({
              name: segment,
              folder: {},
              "@microsoft.graph.conflictBehavior": "rename",
            });
        } else {
          throw error;
        }
      }
    }
  }

  async uploadFile(file, folderPath) {
    await this.initializeGraphClient();

    await this.createFolder(folderPath);

    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExtension}`;
    const filePath = `${folderPath}/${uniqueFileName}`;

    if (file.size <= 4 * 1024 * 1024) {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/drives/${this.driveId}/root:${filePath}:/content`
        )
        .put(file);
      return response.id;
    }

    const uploadSession = await this.client
      .api(
        `/sites/${this.siteId}/drives/${this.driveId}/root:${filePath}:/createUploadSession`
      )
      .post({
        item: {
          "@microsoft.graph.conflictBehavior": "rename",
        },
      });

    const maxSliceSize = 320 * 1024;
    const fileSize = file.size;
    const uploadUrl = uploadSession.uploadUrl;

    let start = 0;
    while (start < fileSize) {
      const end = Math.min(start + maxSliceSize, fileSize);
      const slice = file.slice(start, end);
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": `${end - start}`,
          "Content-Range": `bytes ${start}-${end - 1}/${fileSize}`,
        },
        body: slice,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.id) {
        return result.id;
      }

      start = end;
    }

    throw new Error("Upload failed to complete");
  }

  async createPeriod(periodData) {
    await this.initializeGraphClient();

    const fields = {
      Inicio: periodData.inicio.toISOString(),
      Fin: periodData.fin.toISOString(),
    };

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.lists.periods}/items`)
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
      comprobanteId = await this.uploadFile(imageFile, folderPath);
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
      .api(`/sites/${this.siteId}/lists/${this.lists.expenseReports}/items`)
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
      comprobanteId = await this.uploadFile(newImageFile, folderPath);
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
        .api(
          `/sites/${this.siteId}/lists/${this.lists.expenseReports}/items/${id}`
        )
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
          `/sites/${this.siteId}/lists/${this.lists.expenseReports}/items/${id}`
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
    return reports.filter((report) => report.createdBy === userEmail);
  }

  createPeriodUserReportsMapping(periods, reports, roles) {
    const mapping = periods.map((period) => {
      const periodReports = reports.filter(
        (report) => report.periodoId === period.id
      );

      const userReports = {};
      periodReports.forEach((report) => {
        if (!userReports[report.createdBy]) {
          const userRole = roles.find(
            (role) => role.empleado?.email === report.createdBy.email
          );
          userReports[report.createdBy] = {
            user: userRole?.empleado || { email: report.createdBy },
            reports: [],
          };
        }
        userReports[report.createdBy].reports.push(report);
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
        return "Assistente";
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

export default GraphService;
