import BaseGraphService from "../../../../services/BaseGraphService";
import { generateRandomNumber } from "../../../../utils/randomUtils";

class PostVentaManagementService extends BaseGraphService {
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
      systems: item.fields.SistemasID_x003a__x0020_Title || [],
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

  async getServiceTickets() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.controlPV
    );
    return items.map((item) => ({
      id: item.id,
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
      calendarEventId: item.fields.calendarEvent,
      createdBy: item.createdBy,
      created: item.createdDateTime,
      messageId: item.fields.MessageId,
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
   * @param {File} descriptionFile - File to be uploaded as description
   * @returns {Promise<Object>} Created Service Ticket
   */
  async createServiceTicket(stData, descriptionFile) {
    try {
      await this.initializeGraphClient();

      // Upload the description file
      const folderPath = `/Boletas ST/${stData.companyName}/${stData.buildingName}/${stData.siteName}/${stData.st}`;
      const fileId = await this.uploadFile(
        this.siteId,
        this.driveId,
        descriptionFile,
        folderPath,
        `Descripción - ${generateRandomNumber(16).toString()}`
      );

      // Create the service ticket
      const fields = {
        Title: stData.st, // ST number
        SitioIDLookupId: stData.siteId,
        SistemaIDLookupId: stData.systemId,
        Descripci_x00f3_n: fileId,
        Estado: "Iniciada",
        Tipo: stData.type,
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

  async updateTicketStatus(ticketId, newStatus) {
    await this.initializeGraphClient();

    try {
      const fields = {};
      const now = new Date().toISOString();

      // Set appropriate date field based on status
      switch (newStatus) {
        case "Técnico asignado":
          fields.FechaTecnicoAsignado = now;
          break;
        case "Confirmado por técnico":
          fields.Fechaconfirmaci_x00f3_n = now;
          break;
        case "Trabajo iniciado":
          fields.Fechatrabajoiniciado = now;
          break;
        case "Finalizada":
          fields.Fechatrabajofinalizado = now;
          break;
        case "Cerrada":
          fields.Fechacierre = now;
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
      // Prepare update fields
      const fields = {
        Title: data.st,
        SitioIDLookupId: parseInt(data.siteId),
        SistemaIDLookupId: parseInt(data.systemId),
        Tipo: data.type,
      };

      const ticket = await this.client
          .api(
            `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
          )
          .expand("fields")
          .get();

      // If new description file is provided, upload it
      if (data.description) {
        // Get ticket details to determine folder structure
        

        // Get site and building details
        const site = await this.client
          .api(
            `/sites/${this.siteId}/lists/${this.config.lists.sites}/items/${data.siteId}`
          )
          .expand("fields")
          .get();

        const building = await this.client
          .api(
            `/sites/${this.siteId}/lists/${this.config.lists.buildings}/items/${site.fields.EdificioIDLookupId}`
          )
          .expand("fields")
          .get();

        const company = await this.client
          .api(
            `/sites/${this.siteId}/lists/${this.config.lists.companies}/items/${building.fields.EmpresaIDLookupId}`
          )
          .expand("fields")
          .get();

        // Upload new description file
        const folderPath = `/Boletas ST/${company.fields.Title}/${building.fields.Title}/${site.fields.Title}/${data.st}`;
        const fileId = await this.uploadFile(
          this.siteId,
          this.driveId,
          data.description,
          folderPath,
          `Descripción - ${generateRandomNumber(16).toString()}`
        );

        

        // Delete old description file if exists
        if (ticket.fields.Descripci_x00f3_n) {
          await this.deleteFile(ticket.fields.Descripci_x00f3_n);
        }

        fields.Descripci_x00f3_n = fileId;
      }

      if (data.serviceTicket) {
        // Delete old boleta if exists
        if (ticket.fields.Boleta) {
          await this.deleteFile(ticket.fields.Boleta);
        }
        const boletaId = await this.uploadServiceTicket(ticketId, data.serviceTicket);
        fields.Boleta = boletaId;
      }
      
      if (data.report) {
        // Delete old report if exists
        if (ticket.fields.Informe) {
          await this.deleteFile(ticket.fields.Informe);
        }
        const reportId = await this.uploadServiceReport(ticketId, data.report);
        fields.Informe = reportId;
      }

      // Update ticket
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

      // Delete all associated files
      const filesToDelete = [
        ticket.fields.Descripci_x00f3_n,
        ticket.fields.Boleta,
        ticket.fields.Informe,
      ].filter(Boolean);

      for (const fileId of filesToDelete) {
        await this.deleteFile(fileId);
      }

      // Delete calendar event if exists
      if (ticket.fields.calendarEvent) {
        try {
          this.deleteCalendarEvent(
            this.groupId,
            ticket.fields.calendarEvent
          );
        } catch (error) {
          console.error("Error deleting calendar event:", error);
          // Continue with ticket deletion even if calendar event deletion fails
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

  // Additional helper methods
  async uploadServiceTicket(ticketId, file) {
    await this.initializeGraphClient();

    try {
      // Get ticket details
      const ticket = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .expand("fields")
        .get();

      // Get location details
      const site = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.sites}/items/${ticket.fields.SitioIDLookupId}`
        )
        .expand("fields")
        .get();

      const building = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.buildings}/items/${site.fields.EdificioIDLookupId}`
        )
        .expand("fields")
        .get();

      const company = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.companies}/items/${building.fields.EmpresaIDLookupId}`
        )
        .expand("fields")
        .get();

      // Upload file
      const folderPath = `/Boletas ST/${company.fields.Title}/${building.fields.Title}/${site.fields.Title}/${ticket.fields.Title}`;
      const fileId = await this.uploadFile(
        this.siteId,
        this.driveId,
        file,
        folderPath,
        `Boleta - ${generateRandomNumber(16).toString()}`
      );

      // Update ticket with file reference
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .patch({
          fields: {
            Boleta: fileId,
          },
        });

      return fileId;
    } catch (error) {
      console.error("Error uploading service ticket:", error);
      throw new Error("Error al subir la boleta de servicio");
    }
  }

  async uploadServiceReport(ticketId, file) {
    await this.initializeGraphClient();

    try {
      // Get ticket details
      const ticket = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .expand("fields")
        .get();

      // Get location details
      const site = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.sites}/items/${ticket.fields.SitioIDLookupId}`
        )
        .expand("fields")
        .get();

      const building = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.buildings}/items/${site.fields.EdificioIDLookupId}`
        )
        .expand("fields")
        .get();

      const company = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.companies}/items/${building.fields.EmpresaIDLookupId}`
        )
        .expand("fields")
        .get();

      // Upload file
      const folderPath = `/Boletas ST/${company.fields.Title}/${building.fields.Title}/${site.fields.Title}/${ticket.fields.Title}`;
      const fileId = await this.uploadFile(
        this.siteId,
        this.driveId,
        file,
        folderPath,
        `Informe - ${generateRandomNumber(16).toString()}`
      );

      // Update ticket with file reference
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${ticketId}`
        )
        .patch({
          fields: {
            Informe: fileId,
          },
        });

      return fileId;
    } catch (error) {
      console.error("Error uploading service report:", error);
      throw new Error("Error al subir el informe de servicio");
    }
  }
}

export default PostVentaManagementService;
