import { Link } from "react-router-dom";
import BaseGraphService from "../../../../services/BaseGraphService";
import { generateRandomNumber } from "../../../../utils/randomUtils";
import { isAdministrativeDoc } from "../../constants/documentTypes";

class PostVentaManagementService extends BaseGraphService {
  constructor(msalInstance, config) {
    super(msalInstance);
    this.config = config.general;
    this.admins = config.admins;
    this.loginRequest = {
      scopes: [
        "User.Read",
        "User.Read.All",
        "Sites.Read.All",
        "Sites.ReadWrite.All",
        "Files.ReadWrite.All",
        "Calendars.ReadWrite",
        "Group.ReadWrite.All",
      ],
    };
  }

  async initialize() {
    this.siteId = await this.getSiteId(this.config.siteName);
    this.driveId = this.config.driveId;
    this.groupId = this.config.groupId;
  }

  // Companies methods
  async getCompanies() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.companies
    );
    return items.map((item) => ({
      id: item.id,
      name: item.fields.Title,
    }));
  }

  // Buildings methods
  async getBuildings() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.buildings
    );
    return items.map((item) => ({
      id: item.id,
      name: item.fields.Title,
      companyId: item.fields.EmpresaIDLookupId,
    }));
  }

  // Systems methods
  async getSystems() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.systems
    );
    return items.map((item) => ({
      id: item.id,
      name: item.fields.Title,
    }));
  }

  // Sites methods
  async getSites() {
    const items = await this.getListItems(this.siteId, this.config.lists.sites);
    return items.map((item) => ({
      id: item.id,
      name: item.fields.Title,
      buildingId: item.fields.EdificioIDLookupId,
      supervisorId: item.fields.SupervisorLookupId,
      location: item.fields.Ubicaci_x00f3_n,
      contactName: item.fields.Nombrecontacto,
      contactEmail: item.fields.Correoelectr_x00f3_nico,
      contactPhone: item.fields.N_x00fa_merotelefonico,
      systems: item.fields.SistemasID_x003a__x0020_Sistema || [],
    }));
  }

  // Roles methods
  async getRoles() {
    const items = await this.getListItems(this.siteId, this.config.lists.roles);
    return items.map((item) => ({
      id: item.id,
      employee: item.fields.Empleado?.[0] || null,
      role: item.fields.Rol,
    }));
  }


  /**
   * Filters service tickets by assigned technician
   * @param {string} technicianId - The ID of the technician to filter by
   * @returns {Promise<Array>} Array of service tickets assigned to the technician
   */
  /**
   * Creates a new Service Ticket with description file
   * @param {Object} stData - Service Ticket data
   * @param {string} stData.st - ST number
   * @param {string} stData.siteId - Site ID
   * @param {string} stData.systemId - System ID
   * @returns {Promise<Object>} Created Service Ticket
   */
  async createServiceTicket(stData) {
    console.log("data de service", stData);
    try {
      await this.initializeGraphClient();

      const fields = {
        Title: stData.st,
        SitioIDLookupId: stData.siteId,
        SistemaIDLookupId: stData.systemId,
        alcance: stData.scope,
        Estado: "Iniciada",
        Tipo: stData.type,
        Link: stData.link,
        Equiment: stData.waitingEquiment || false,
      };

      const response = await this.client
        .api(
          encodeURIComponent(
            `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items`
          )
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({
          fields: fields,
        });

      return response;
    } catch (error) {
      console.error("Error creating service ticket:", error);
      throw new Error(`Error creating service ticket: ${error.message}`);
    }
  }

  async updateSTDate(stId, newDate, calendarEventId) {
    await this.initializeGraphClient();

    // Update ST
    const response = await this.client
      .api(
        `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${stId}`
      )
      .patch({
        fields: {
          Fecha: newDate,
          calendarEvent: calendarEventId,
        },
      });

    // Update calendar event if exists
    if (calendarEventId) {
      await this.updateCalendarEventDate(
        this.groupId,
        calendarEventId,
        newDate
      );
    }

    return response;
  }

  async createSystem(systemData) {
    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.systems}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({
          fields: {
            Title: systemData.name,
          },
        });

      return response;
    } catch (error) {
      console.error("Error creating system:", error);
      throw new Error("Error al crear el sistema");
    }
  }

  async updateSystem(systemId, systemData) {
    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.systems}/items/${systemId}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: {
            Title: systemData.name,
          },
        });

      return response;
    } catch (error) {
      console.error("Error updating system:", error);
      throw new Error("Error al actualizar el sistema");
    }
  }

  async deleteSystem(systemId) {
    await this.initializeGraphClient();

    try {
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.systems}/items/${systemId}`
        )
        .delete();

      return true;
    } catch (error) {
      console.error("Error deleting system:", error);
      throw new Error("Error al eliminar el sistema");
    }
  }

  async createCompany(companyData) {
    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.companies}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({
          fields: {
            Title: companyData.name,
          },
        });

      return response;
    } catch (error) {
      console.error("Error creating company:", error);
      throw new Error("Error al crear la empresa");
    }
  }

  async updateCompany(companyId, companyData) {
    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.companies}/items/${companyId}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: {
            Title: companyData.name,
          },
        });

      return response;
    } catch (error) {
      console.error("Error updating company:", error);
      throw new Error("Error al actualizar la empresa");
    }
  }

  async deleteCompany(companyId) {
    await this.initializeGraphClient();

    try {
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.companies}/items/${companyId}`
        )
        .delete();

      return true;
    } catch (error) {
      console.error("Error deleting company:", error);
      throw new Error("Error al eliminar la empresa");
    }
  }

  // Building CRUD operations
  async createBuilding(buildingData) {
    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.buildings}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({
          fields: {
            Title: buildingData.name,
            EmpresaIDLookupId: parseInt(buildingData.companyId),
          },
        });

      return response;
    } catch (error) {
      console.error("Error creating building:", error);
      throw new Error("Error al crear el edificio");
    }
  }

  async updateBuilding(buildingId, buildingData) {
    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.buildings}/items/${buildingId}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: {
            Title: buildingData.name,
            EmpresaIDLookupId: parseInt(buildingData.companyId),
          },
        });

      return response;
    } catch (error) {
      console.error("Error updating building:", error);
      throw new Error("Error al actualizar el edificio");
    }
  }

  async deleteBuilding(buildingId) {
    await this.initializeGraphClient();

    try {
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.buildings}/items/${buildingId}`
        )
        .delete();

      return true;
    } catch (error) {
      console.error("Error deleting building:", error);
      throw new Error("Error al eliminar el edificio");
    }
  }

  // Site CRUD operations
  async createSite(siteData) {
    await this.initializeGraphClient();

    try {
      const systemsList = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.systems}/items`)
        .expand("fields")
        .get();

      const systemsMap = {};
      systemsList.value.forEach((system) => {
        systemsMap[system.fields.Title] = system.id;
      });

      const systemLookups = siteData.systems.map((systemName) =>
        parseInt(systemsMap[systemName])
      );

      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.sites}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({
          fields: {
            Title: siteData.name,
            EdificioIDLookupId: parseInt(siteData.buildingId),
            Ubicaci_x00f3_n: siteData.location,
            Nombrecontacto: siteData.contactName,
            Correoelectr_x00f3_nico: siteData.contactEmail,
            N_x00fa_merotelefonico: siteData.contactPhone,
            "SistemasIDLookupId@odata.type": "Collection(Edm.Int32)",
            SistemasIDLookupId: systemLookups,
            SupervisorLookupId: siteData.supervisorId,
          },
        });

      return response;
    } catch (error) {
      console.error("Error creating site:", error);
      throw new Error("Error al crear el sitio");
    }
  }

  async updateSite(siteId, siteData) {
    await this.initializeGraphClient();

    try {
      const systemsList = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.systems}/items`)
        .expand("fields")
        .get();

      const systemsMap = {};
      systemsList.value.forEach((system) => {
        systemsMap[system.fields.Title] = system.id;
      });

      const systemLookups = siteData.systems.map((systemName) =>
        parseInt(systemsMap[systemName])
      );

      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.sites}/items/${siteId}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: {
            Title: siteData.name,
            EdificioIDLookupId: parseInt(siteData.buildingId),
            Ubicaci_x00f3_n: siteData.location,
            Nombrecontacto: siteData.contactName,
            Correoelectr_x00f3_nico: siteData.contactEmail,
            N_x00fa_merotelefonico: siteData.contactPhone,
            "SistemasIDLookupId@odata.type": "Collection(Edm.Int32)",
            SistemasIDLookupId: systemLookups,
            SupervisorLookupId: siteData.supervisorId,
          },
        });

      return response;
    } catch (error) {
      console.error("Error updating site:", error);
      throw new Error("Error al actualizar el sitio");
    }
  }

  async deleteSite(siteId) {
    await this.initializeGraphClient();

    try {
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.sites}/items/${siteId}`
        )
        .delete();

      return true;
    } catch (error) {
      console.error("Error deleting site:", error);
      throw new Error("Error al eliminar el sitio");
    }
  }



  async getServiceTickets() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.controlPV
    );

    return items.map((item) => {
      let reassignmentHistory = [];
      if (item.fields.HistorialReasignaciones) {
        try {
          reassignmentHistory = JSON.parse(item.fields.HistorialReasignaciones);
        } catch (e) {
          console.warn(`Error parsing reassignment history for ticket ${item.id}:`, e);
          reassignmentHistory = [];
        }
      }

      return {
        id: item.id,
        scope: item.fields.alcance,
        stNumber: item.fields.Title,
        type: item.fields.Tipo,
        descriptionId: item.fields.Descripci_x00f3_n,
        siteId: item.fields.SitioIDLookupId,
        state: item.fields.Estado,
        technicians: item.fields.Tecnicoasignado || [],
        tentativeDate: item.fields.Fecha,
        technicianAssignedDate: item.fields.FechaTecnicoAsignado,
        confirmationDate: item.fields.Fechaconfirmaci_x00f3_n,
        workStartDate: item.fields.Fechatrabajoiniciado,
        workEndDate: item.fields.Fechatrabajofinalizado,
        closeDate: item.fields.Fechacierre,
        serviceTicketId: item.fields.Boleta,
        reportId: item.fields.Informe,
        systemId: item.fields.SistemaIDLookupId,
        notes: item.fields.Notas,
        closeNotes: item.fields.NotasCierre,
        link: item.fields.Link,
        calendarEventId: item.fields.calendarEvent,
        created: item.createdDateTime,
        createdBy: item.createdBy,
        workNotDone: item.fields.FechaParcial,
        reassignedTechnicians: item.fields.TecnicosReasignados || [],
        lastReassignmentDate: item.fields.FechaUltimaReasignacionParcial,

        waitingEquiment: item.fields.Equiment || false,
        reassignmentHistory: reassignmentHistory,
      };
    });
  }

  async getTicketById(ticketId) {
    if (!ticketId) throw new Error("Ticket ID is required");

    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .expand("fields")
        .get();

      if (!response || !response.fields) {
        throw new Error("Ticket not found");
      }


      let reassignmentHistory = [];
      if (response.fields.HistorialReasignaciones) {
        try {
          reassignmentHistory = JSON.parse(response.fields.HistorialReasignaciones);
        } catch (e) {
          console.warn(`Error parsing reassignment history:`, e);
          reassignmentHistory = [];
        }
      }

      return {
        id: response.id,
        stNumber: response.fields.Title,
        scope: response.fields.alcance,
        type: response.fields.Tipo,
        descriptionId: response.fields.Descripci_x00f3_n,
        siteId: response.fields.SitioIDLookupId,
        systemId: response.fields.SistemaIDLookupId,
        state: response.fields.Estado,
        technicians: response.fields.Tecnicoasignado || [],
        tentativeDate: response.fields.Fecha,
        technicianAssignedDate: response.fields.FechaTecnicoAsignado,
        confirmationDate: response.fields.Fechaconfirmaci_x00f3_n,
        workStartDate: response.fields.Fechatrabajoiniciado,
        workEndDate: response.fields.Fechatrabajofinalizado,
        closeDate: response.fields.Fechacierre,
        serviceTicketId: response.fields.Boleta,
        reportId: response.fields.Informe,
        createdBy: response.createdBy,
        created: response.createdDateTime,
        messageId: response.fields.MessageId,
        calendarEventId: response.fields.calendarEvent,
        link: response.fields.Link || "",
        notes: response.fields.Notas || null,
        closeNotes: response.fields.NotasCierre || null,
        workNotDone: response.fields.FechaParcial,
        reassignedTechnicians: response.fields.ReasignacionesParcial || [],
        lastReassignmentDate: response.fields.FechaUltimaReasignacionParcial,
        reassignmentHistory: reassignmentHistory,

      };
    } catch (error) {
      console.error("Error fetching ticket:", error);
      throw error;
    }
  }
  async reassignTechniciansPartial(ticketId, technicianIds) {
    await this.initializeGraphClient();

    try {


      const ticket = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`)
        .expand("fields")
        .get();

      if (ticket.fields.Estado !== "Trabajo Parcial") {
        throw new Error("Solo se pueden reasignar técnicos en estado Trabajo Parcial");
      }

      // Obtener columnas para debugging
      const columns = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/columns`)
        .get();

      const personColumns = columns.value.filter(col =>
        col.personOrGroup?.allowMultipleSelection &&
        (col.name.toLowerCase().includes('reasign') ||
          col.name.toLowerCase().includes('parcial') ||
          col.displayName.toLowerCase().includes('reasign') ||
          col.displayName.toLowerCase().includes('parcial'))
      );


      personColumns.forEach(col => {
        console.log(`  - ${col.displayName}: ${col.name}`);
      });

      const now = new Date().toISOString();
      const technicianLookups = technicianIds.map((id) => id.toString());

      // Probar cada campo encontrado
      for (const col of personColumns) {


        try {
          const response = await this.client
            .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`)
            .patch({
              fields: {
                "ReasignacionesParcialLookupId@odata.type": "Collection(Edm.String)",
                [`${col.name}LookupId`]: technicianLookups,
                FechaUltimaReasignacionParcial: now,

              },
            });

          console.log(`✅ ¡ÉXITO! Campo correcto: ${col.name}LookupId`);
          return response;

        } catch (err) {
          console.log(`❌ Falló: ${col.name}LookupId`);
        }
      }

      // Si no hay campos encontrados o ninguno funciona
      throw new Error('No se encontró el campo correcto. Verifica que exista en SharePoint.');

    } catch (error) {
      console.error("Error:", error);
      throw new Error(`Error al reasignar técnicos: ${error.message}`);
    }
  }

  /**
   * Confirms technician assignment after reassignment in Partial state
   * This is called when technician confirms after being reassigned
   * @param {string} ticketId - The ticket ID
   * @returns {Promise<Object>} Updated ticket
   */
  async confirmPostReassignment(ticketId) {
    await this.initializeGraphClient();

    try {
      const now = new Date().toISOString();

      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .patch({
          fields: {
            ConfirmacionPostReasignacion: now
          },
        });

      return response;
    } catch (error) {
      console.error("Error confirming post-reassignment:", error);
      throw new Error(`Error al confirmar reasignación: ${error.message}`);
    }
  }


  async getSiteById(siteId) {
    if (!siteId) throw new Error("Site ID is required");

    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.sites}/items/${siteId}`
        )
        .expand("fields")
        .get();

      if (!response || !response.fields) {
        throw new Error("Site not found");
      }

      return {
        id: response.id,
        name: response.fields.Title,
        buildingId: response.fields.EdificioIDLookupId,
        supervisorId: response.fields.SupervisorLookupId,
        location: response.fields.Ubicaci_x00f3_n,
        contactName: response.fields.Nombrecontacto,
        contactEmail: response.fields.Correoelectr_x00f3_nico,
        contactPhone: response.fields.N_x00fa_merotelefonico,
        systems: response.fields.SistemasID_x003a__x0020_Sistema || [],
      };
    } catch (error) {
      console.error("Error fetching site:", error);
      throw new Error(`Error fetching site: ${error.message}`);
    }
  }

  async getBuildingById(buildingId) {
    if (!buildingId) throw new Error("Building ID is required");

    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.buildings}/items/${buildingId}`
        )
        .expand("fields")
        .get();

      if (!response || !response.fields) {
        throw new Error("Building not found");
      }

      return {
        id: response.id,
        name: response.fields.Title,
        companyId: response.fields.EmpresaIDLookupId,
      };
    } catch (error) {
      console.error("Error fetching building:", error);
      throw new Error(`Error fetching building: ${error.message}`);
    }
  }

  async getCompanyById(companyId) {
    if (!companyId) throw new Error("Company ID is required");

    await this.initializeGraphClient();

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.companies}/items/${companyId}`
        )
        .expand("fields")
        .get();

      if (!response || !response.fields) {
        throw new Error("Company not found");
      }

      return {
        id: response.id,
        name: response.fields.Title,
      };
    } catch (error) {
      console.error("Error fetching company:", error);
      throw new Error(`Error fetching company: ${error.message}`);
    }
  }

  async updateTicketStatus(ticketId, newStatus, notes = "", closeNotes = "") {
    await this.initializeGraphClient();

    try {
      const fields = {};
      const now = new Date().toISOString();

      // Set appropriate date field based on status
      switch (newStatus) {
        case "Técnico asignado":
          fields.FechaTecnicoAsignado = now;
          fields.Fechaconfirmaci_x00f3_n = null;
          break;
        case "Confirmado por técnico":
          fields.Fechaconfirmaci_x00f3_n = now;
          break;
        case "Trabajo iniciado":
          fields.Fechatrabajoiniciado = now;
          break;
        case "Trabajo Parcial":
          fields.FechaParcial = now;
          if (notes) {
            fields.Notas = notes;
          }
          break;
        case "Finalizada":
          fields.Fechatrabajofinalizado = now;
          if (notes) {
            fields.Notas = notes;
          }
          break;
        case "Cerrada":
          fields.Fechacierre = now;

          if (closeNotes) {
            fields.NotasCierre = closeNotes;
          }
          break;
        default:
          break;
      }

      fields.Estado = newStatus;

      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .patch({
          fields: fields,
        });

      return response;
    } catch (error) {
      console.error("Error updating ticket status:", error);
      throw new Error("Error al actualizar el estado del ticket");
    }
  }


  async assignTechnicians(ticketId, technicianIds) {
    await this.initializeGraphClient();

    try {
      const technicianLookups = technicianIds.map((id) => id.toString());

      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .patch({
          fields: {
            "TecnicoasignadoLookupId@odata.type": "Collection(Edm.String)",
            TecnicoasignadoLookupId: technicianLookups,
          },
        });

      await this.updateTicketStatus(ticketId, "Técnico asignado");

      return response;
    } catch (error) {
      console.error("Error assigning technicians:", error);
      throw new Error("Error al asignar técnicos");
    }
  }

  async updateTicket(ticketId, data) {
    await this.initializeGraphClient();
    try {
      const fields = {
        Title: data.st,
        SitioIDLookupId: parseInt(data.siteId),
        SistemaIDLookupId: parseInt(data.systemId),
        alcance: data.scope,
        Tipo: data.type,
        Link: data.link?.trim() || "",
        Equiment: data.waitingEquiment || false,
      };
      const ticket = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .expand("fields")
        .get();

      // Handle service ticket and report files from legacy code path
      if (data.serviceTicket) {
        if (ticket.fields.Boleta) {
          await this.deleteFile(this.siteId, this.driveId, ticket.fields.Boleta);
        }
        const boletaId = await this.uploadServiceTicket(
          ticketId,
          data.serviceTicket
        );
        fields.Boleta = boletaId;
      }
      if (data.report) {
        if (ticket.fields.Informe) {
          await this.deleteFile(this.siteId, this.driveId, ticket.fields.Informe);
        }
        const reportId = await this.uploadServiceReport(ticketId, data.report);
        fields.Informe = reportId;
      }

      // Handle files to delete
      if (data.filesToDelete && data.filesToDelete.length > 0) {
        for (const fileId of data.filesToDelete) {
          try {
            // First check if file exists in general docs list
            const generalDocsQuery = await this.client
              .api(`/sites/${this.siteId}/lists/${this.config.lists.docs}/items`)
              .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
              .filter(`fields/itemId eq '${fileId}'`)
              .expand('fields')
              .get();

            const generalDocs = generalDocsQuery.value;

            if (generalDocs.length > 0) {
              // Delete file from SharePoint
              await this.deleteFile(this.siteId, this.driveId, fileId);

              // Delete list item 
              await this.client
                .api(`/sites/${this.siteId}/lists/${this.config.lists.docs}/items/${generalDocs[0].id}`)
                .delete();
            } else {
              // Check if it's an admin file
              try {
                const adminDocsQuery = await this.client
                  .api(`/sites/${this.admins.siteId}/lists/${this.admins.lists.docsAdmins}/items`)
                  .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
                  .filter(`fields/itemId eq '${fileId}'`)
                  .expand('fields')
                  .get();

                const adminDocs = adminDocsQuery.value;

                if (adminDocs.length > 0) {
                  // Delete file from SharePoint
                  await this.deleteFile(this.admins.siteId, this.admins.driveId, fileId);

                  // Delete list item
                  await this.client
                    .api(`/sites/${this.admins.siteId}/lists/${this.admins.lists.docsAdmins}/items/${adminDocs[0].id}`)
                    .delete();

                } else {
                  console.warn(`File ${fileId} not found in any document list`);
                }
              } catch (err) {
                console.error(`Error handling admin doc ${fileId}:`, err);
                throw err; // Rethrow to be caught by outer catch
              }
            }
          } catch (err) {
            console.error(`Error deleting file ${fileId}:`, err);
            throw new Error(`Error deleting files: ${err.message}`);
          }
        }
      }

      // Handle files to upload
      if (data.filesToUpload && data.filesToUpload.length > 0) {
        for (const fileData of data.filesToUpload) {
          await this.uploadTicketDocument(
            ticketId,
            fileData.file,
            fileData.type,
            fileData.displayName
          );
        }
      }

      // Update the ticket in SharePoint
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .patch({
          fields: fields,
        });
      return response;
    } catch (error) {
      console.error("Error updating ticket:", error);
      throw new Error("Error al actualizar el ticket");
    }
  }

  async deleteTicket(ticketId) {
    await this.initializeGraphClient();

    try {
      // Get ticket details first
      const ticket = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .expand("fields")
        .get();

      // Get all documents
      const [generalDocs, adminDocs] = await Promise.all([
        this.getGeneralDocuments(ticketId),
        this.getAdminDocuments(ticketId),
      ]);

      // Delete general documents
      for (const doc of generalDocs) {
        try {
          await this.deleteFile(this.siteId, this.driveId, doc.itemId);
          await this.deleteListItem(
            this.siteId,
            this.config.lists.docs,
            doc.itemId
          );
        } catch (error) {
          console.error(
            `Error deleting general document ${doc.itemId}:`,
            error
          );
        }
      }

      // Delete admin documents
      for (const doc of adminDocs) {
        try {
          await this.deleteFile(
            this.admins.siteId,
            this.admins.driveId,
            doc.itemId
          );
          await this.deleteListItem(
            this.admins.siteId,
            this.admins.lists.docsAdmins,
            doc.itemId
          );
        } catch (error) {
          console.error(`Error deleting admin document ${doc.itemId}:`, error);
        }
      }

      // Delete calendar event if exists
      if (ticket.fields.calendarEvent) {
        try {
          await this.deleteCalendarEvent(
            this.groupId,
            ticket.fields.calendarEvent
          );
        } catch (error) {
          console.error("Error deleting calendar event:", error);
        }
      }

      // Finally delete the ticket
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .delete();

      return true;
    } catch (error) {
      console.error("Error deleting ticket:", error);
      throw new Error("Error al eliminar el ticket");
    }
  }

  async getGeneralDocuments(ticketId) {
    await this.initializeGraphClient();

    const response = await this.client
      .api(`/sites/${this.siteId}/lists/${this.config.lists.docs}/items`)
      .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
      .filter(`fields/ticketId eq '${ticketId}'`)
      .expand("fields")
      .get();

    return response.value.map((item) => ({
      itemId: item.fields.itemId,
      fileName: item.fields.fileName,
      documentType: item.fields.documentType,
      source: "general",
    }));
  }

  async getAdminDocuments(ticketId) {
    try {
      await this.initializeGraphClient();

      const response = await this.client
        .api(
          `/sites/${this.admins.siteId}/lists/${this.admins.lists.docsAdmins}/items`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .filter(`fields/ticketId eq '${ticketId}'`)
        .expand("fields")
        .get();

      return response.value.map((item) => ({
        itemId: item.fields.itemId,
        fileName: item.fields.fileName,
        documentType: item.fields.documentType,
        source: "admin",
      }));
    } catch (error) {
      // User might not have access to admin site
      console.log("User does not have access to admin documents");
      return [];
    }
  }

  async getTicketDocuments(ticketId) {
    if (!ticketId) return [];

    try {
      await this.initializeGraphClient();
      // Get documents from both lists
      const [generalDocs, adminDocs] = await Promise.all([
        this.getGeneralDocuments(ticketId),
        this.getAdminDocuments(ticketId),
      ]);

      return [...generalDocs, ...adminDocs];
    } catch (error) {
      console.error("Error fetching ticket documents:", error);
      throw new Error("Error al obtener los documentos");
    }
  }

  async uploadTicketDocument(
    ticketId,
    file,
    documentType,
    customFileName = null
  ) {
    try {
      if (!ticketId || !file || !documentType) {
        throw new Error("Missing required parameters");
      }

      const isAdminDoc = isAdministrativeDoc(documentType);
      const config = isAdminDoc ? this.admins : this.config;
      const listId = isAdminDoc ? config.lists.docsAdmins : config.lists.docs;
      const siteId = isAdminDoc ? config.siteId : this.siteId;
      const driveId = isAdminDoc ? config.driveId : this.driveId;

      try {
        const ticket = await this.getTicketById(ticketId);
        const site = await this.getSiteById(ticket.siteId);
        const building = await this.getBuildingById(site.buildingId);
        const company = await this.getCompanyById(building.companyId);

        const sanitizePathComponent = (component) => {
          return component
            .toString()
            .trim()
            .replace(/\s+/g, " ")
            .replace(/[<>:"/\\|?*]/g, "_")
            .replace(/\s+$/g, "");
        };

        const sanitizedPath = {
          company: sanitizePathComponent(company.name),
          building: sanitizePathComponent(building.name),
          site: sanitizePathComponent(site.name),
          ticket: sanitizePathComponent(ticket.stNumber),
        };

        const folderPath = `/Boletas ST/${sanitizedPath.company}/${sanitizedPath.building}/${sanitizedPath.site}/${sanitizedPath.ticket}`;
        const fileExtension = file.name.split(".").pop().toLowerCase();
        const timestamp = Date.now();
        const randomNum = generateRandomNumber(8);
        const baseFileName =
          customFileName || `${documentType}-${timestamp}-${randomNum}`;
        const fileName = `${baseFileName}.${fileExtension}`;

        const itemId = await this.uploadFile(
          siteId,
          driveId,
          file,
          folderPath,
          fileName
        );

        await this.client
          .api(`/sites/${siteId}/lists/${listId}/items`)
          .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
          .post({
            fields: {
              ticketId,
              fileName,
              itemId,
              documentType,
            },
          });

        return {
          itemId,
          fileName,
          documentType,
          source: isAdminDoc ? "admin" : "general",
        };
      } catch (error) {
        console.error("Detailed upload error:", {
          error,
          ticketId,
          documentType,
          fileName: customFileName,
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        });
        throw error;
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      throw new Error(`Error uploading document: ${error.message}`);
    }
  }

  async deleteListItem(siteId, listId, itemId) {
    try {
      const response = await this.client
        .api(`/sites/${siteId}/lists/${listId}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .filter(`fields/itemId eq '${itemId}'`)
        .get();

      if (response.value?.length > 0) {
        const listItemId = response.value[0].id;
        await this.client
          .api(`/sites/${siteId}/lists/${listId}/items/${listItemId}`)
          .delete();
      }
    } catch (error) {
      console.error(`Error deleting list item: ${itemId}`, error);
    }
  }

  async deleteFile(siteId, driveId, itemId) {
    if (!itemId) return;

    await this.initializeGraphClient();
    try {
      await this.client
        .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}`)
        .delete();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  async getNextSTNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const yearMonth = `${year}${month}`;

    await this.initializeGraphClient();
    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.sequenceNumbers}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .filter(`fields/YearMonth eq '${yearMonth}'`)
        .expand('fields')
        .get();

      let currentNumber;
      let itemId;

      if (response.value.length > 0) {
        itemId = response.value[0].id;
        currentNumber = parseInt(response.value[0].fields.LastNumber);
      } else {
        const createResponse = await this.client
          .api(`/sites/${this.siteId}/lists/${this.config.lists.sequenceNumbers}/items`)
          .post({
            fields: {
              Title: `Sequence for ${yearMonth}`,
              YearMonth: yearMonth,
              LastNumber: "699"
            }
          });
        itemId = createResponse.id;
        currentNumber = 699;
      }

      // Increment the sequence number
      const nextNumber = currentNumber + 1;
      if (nextNumber > 999) {
        throw new Error("Sequence number exceeded maximum (999) for this month");
      }

      // Update in database
      await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.sequenceNumbers}/items/${itemId}`)
        .patch({
          fields: {
            LastNumber: nextNumber.toString()
          }
        });

      // Return the formatted ST number
      return `${yearMonth}-3${nextNumber}`;
    } catch (error) {
      console.error("Error generating ST number:", error);
      throw new Error("Error al generar número de ST: " + error.message);
    }
  }

  async getNextSTNumberRepair(maxRetries, type) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const stNumber = await this.attemptGetNextSTNumber(type);
        return stNumber; // Retornar directamente sin verificación adicional
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        // Esperar antes de reintentar (solo para errores de concurrencia)
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      }
    }

    throw new Error("No se pudo generar un número ST único después de varios intentos");
  }

  async attemptGetNextSTNumber(type) {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const yearMonth = `${year}${month}`;

    // Mapear el tipo al código correspondiente
    const getTypeCode = (type) => {
      const cleanType = type?.toLowerCase().trim();

      switch (cleanType) {
        case 'correctiva-cobrable':
          return '3';
        case 'correctiva-no cobrable':
          return '3';
        case "instalación menor":
          return '1';
        default:
          throw new Error(`Tipo no válido: "${type}". Valores válidos: "Correctiva-Cobrable", "Correctiva-No Cobrable", "Instalación Menor"`);
      }
    };

    const typeCode = getTypeCode(type);

    await this.initializeGraphClient();

    // Obtener o crear registro de secuencia para el mes actual
    const response = await this.client
      .api(`/sites/${this.siteId}/lists/${this.config.lists.sequenceNumbers}/items`)
      .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
      .filter(`fields/YearMonth eq '${yearMonth}'`)
      .expand('fields')
      .get();

    let currentNumber;
    let itemId;

    if (response.value.length > 0) {
      // Registro existe, usar el número actual
      itemId = response.value[0].id;
      currentNumber = parseInt(response.value[0].fields.LastNumber);
    } else {
      // Crear nuevo registro para este mes
      const createResponse = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.sequenceNumbers}/items`)
        .post({
          fields: {
            Title: `Sequence for ${yearMonth}`,
            YearMonth: yearMonth,
            LastNumber: "699"
          }
        });
      itemId = createResponse.id;
      currentNumber = 699;
    }

    const nextNumber = currentNumber + 1;

    // Verificar límite máximo
    if (nextNumber > 999) {
      throw new Error("Sequence number exceeded maximum (999) for this month");
    }

    // Obtener ETag para control de concurrencia optimista
    const currentItem = await this.client
      .api(`/sites/${this.siteId}/lists/${this.config.lists.sequenceNumbers}/items/${itemId}`)
      .expand('fields')
      .get();

    // Actualizar secuencia con control de concurrencia
    try {
      await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.sequenceNumbers}/items/${itemId}`)
        .header('If-Match', currentItem['@odata.etag'])
        .patch({
          fields: {
            LastNumber: nextNumber.toString()
          }
        });
    } catch (error) {
      if (error.statusCode === 412) { // Precondition Failed
        throw new Error("Concurrent modification detected, retrying...");
      }
      throw error;
    }

    // Retornar número ST formateado
    return `${yearMonth}-${typeCode}${nextNumber}`;
  }


  // Get a preview of what the ST number would look like without incrementing the counter
  getSTNumberPreview() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}${month}-3xxx`;
  }





  /**
   * Agrega una nueva entrada al historial de reasignaciones
   * @param {string} ticketId - ID del ticket
   * @param {Array} newTechnicianIds - IDs de los nuevos técnicos
   * @param {Array} previousTechnicianIds - IDs de los técnicos anteriores
   * @returns {Promise<Object>} Ticket actualizado
   */
  /**
  * Agrega una nueva entrada al historial de reasignaciones
  * @param {string} ticketId - ID del ticket
  * @param {Array} newTechnicianIds - IDs de los nuevos técnicos
  * @param {Array} previousTechnicianIds - IDs de los técnicos anteriores
  * @param {Array} roles - Array de roles para obtener nombres de técnicos
  * @returns {Promise<Object>} Ticket actualizado
  */
  async reassignTechniciansWithHistory(ticketId, newTechnicianIds, previousTechnicianIds, roles = []) {
    await this.initializeGraphClient();

    try {
      // 1. Obtener el ticket actual
      const ticket = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`)
        .expand("fields")
        .get();

      if (ticket.fields.Estado !== "Trabajo Parcial") {
        throw new Error("Solo se pueden reasignar técnicos en estado Trabajo Parcial");
      }

      // 2. Obtener historial actual
      let history = [];
      if (ticket.fields.HistorialReasignaciones) {
        try {
          history = JSON.parse(ticket.fields.HistorialReasignaciones);
        } catch (e) {
          console.warn("Error parsing history, starting fresh");
          history = [];
        }
      }

      // 3. ✅ NUEVO: Obtener nombres de técnicos desde el array de roles
      const getTechNames = (techIds) => {
        return techIds.map((id) => {
          const techRole = roles.find(
            role => role.employee?.LookupId?.toString() === id.toString()
          );

          return {
            id: id,
            name: techRole?.employee?.LookupValue || "Desconocido"
          };
        });
      };

      const previousTechs = getTechNames(previousTechnicianIds);
      const newTechs = getTechNames(newTechnicianIds);

      console.log('📋 Técnicos anteriores:', previousTechs);
      console.log('📋 Técnicos nuevos:', newTechs);

      // 4. Crear nueva entrada en el historial
      const now = new Date().toISOString();
      const newEntry = {
        date: now,
        previousTechnicians: previousTechs,
        newTechnicians: newTechs,
        type: "reassignment"
      };

      history.push(newEntry);

      // 5. Encontrar el campo correcto para técnicos reasignados
      const columns = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/columns`)
        .get();

      const personColumns = columns.value.filter(col =>
        col.personOrGroup?.allowMultipleSelection &&
        (col.name.toLowerCase().includes('reasign') ||
          col.name.toLowerCase().includes('parcial'))
      );

      if (personColumns.length === 0) {
        throw new Error('No se encontró el campo de técnicos reasignados. Verifique la configuración de SharePoint.');
      }

      const technicianLookups = newTechnicianIds.map((id) => id.toString());

      // 6. Actualizar el ticket
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`)
        .patch({
          fields: {
            [`${personColumns[0].name}LookupId@odata.type`]: "Collection(Edm.String)",
            [`${personColumns[0].name}LookupId`]: technicianLookups,
            FechaUltimaReasignacionParcial: now,
            HistorialReasignaciones: JSON.stringify(history)
          },
        });

      console.log(`✅ Reasignación registrada en historial con ${history.length} entradas`);
      return response;

    } catch (error) {
      console.error("Error al reasignar con historial:", error);
      throw new Error(`Error al reasignar técnicos: ${error.message}`);
    }
  }

  /**
   * Registra la subida de una boleta parcial en el historial
   * @param {string} ticketId - ID del ticket
   * @param {string} fileName - Nombre del archivo subido
   * @param {string} fileUrl - URL del archivo
   * @returns {Promise<void>}
   */
  async addPartialDocumentToHistory(ticketId, fileName, fileUrl) {
    await this.initializeGraphClient();

    try {
      // 1. Obtener el ticket actual
      const ticket = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`)
        .expand("fields")
        .get();

      // 2. Obtener historial actual
      let history = [];
      if (ticket.fields.HistorialReasignaciones) {
        try {
          history = JSON.parse(ticket.fields.HistorialReasignaciones);
        } catch (e) {
          console.warn("Error parsing history, starting fresh");
          history = [];
        }
      }

      // 3. Agregar entrada de documento
      const now = new Date().toISOString();
      const newEntry = {
        date: now,
        fileName: fileName,
        fileUrl: fileUrl,
        type: "partial_document"
      };

      history.push(newEntry);

      // 4. Actualizar el ticket
      await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`)
        .patch({
          fields: {
            HistorialReasignaciones: JSON.stringify(history)
          },
        });

      console.log(`✅ Documento parcial registrado en historial`);

    } catch (error) {
      console.error("Error al registrar documento en historial:", error);
      throw new Error(`Error al registrar documento: ${error.message}`);
    }
  }

  /**
   * Obtiene el historial de reasignaciones de un ticket
   * @param {string} ticketId - ID del ticket
   * @returns {Promise<Array>} Historial de reasignaciones
   */
  async getReassignmentHistory(ticketId) {
    await this.initializeGraphClient();

    try {
      const ticket = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`)
        .expand("fields")
        .get();

      if (!ticket.fields.HistorialReasignaciones) {
        return [];
      }

      try {
        return JSON.parse(ticket.fields.HistorialReasignaciones);
      } catch (e) {
        console.error("Error parsing reassignment history:", e);
        return [];
      }
    } catch (error) {
      console.error("Error fetching reassignment history:", error);
      return [];
    }
  }



}

export default PostVentaManagementService;
