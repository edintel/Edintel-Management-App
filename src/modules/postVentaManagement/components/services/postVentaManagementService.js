import BaseGraphService from "../../../../services/BaseGraphService";

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
      ],
    };
  }

  async initialize() {
    this.siteId = await this.getSiteId(this.config.siteName);
    this.driveId = this.config.driveId;
    this.calendarId = this.config.calendarId;
  }

  // Companies methods
  async getCompanies() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.companies
    );
    return items.map(item => ({
      id: item.id,
      name: item.fields.Title
    }));
  }

  // Buildings methods
  async getBuildings() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.buildings
    );
    return items.map(item => ({
      id: item.id,
      name: item.fields.Title,
      companyId: item.fields.EmpresaIDLookupId
    }));
  }

  // Systems methods
  async getSystems() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.systems
    );
    return items.map(item => ({
      id: item.id,
      name: item.fields.Title
    }));
  }

  // Sites methods
  async getSites() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.sites
    );
    return items.map(item => ({
      id: item.id,
      name: item.fields.Title,
      buildingId: item.fields.EdificioIDLookupId,
      supervisorId: item.fields.SupervisorLookupId,
      location: item.fields.Ubicaci_x00f3_n,
      contactName: item.fields.Nombrecontacto,
      contactEmail: item.fields.Correoelectr_x00f3_nico,
      contactPhone: item.fields.N_x00fa_merotelefonico,
      systems: item.fields.SistemasID_x003a__x0020_Title || []
    }));
  }

  // Roles methods
  async getRoles() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.roles
    );
    return items.map(item => ({
      id: item.id,
      employee: item.fields.Empleado?.[0] || null,
      role: item.fields.Rol
    }));
  }

  // Service Ticket (ST) methods
  getSTState(fields) {
    if (fields.Fechacierre) return "Cerrada";
    if (fields.Fechatrabajofinalizado) return "Finalizada";
    if (fields.Fechatrabajoiniciado) return "Trabajo iniciado";
    if (fields.Fechaconfirmaci_x00f3_n) return "Confirmado por tecnico";
    if (fields.Tecnicoasignado && fields.Tecnicoasignado.length > 0) return "Técnico asignado";
    return "Iniciada";
  }


  async getServiceTickets() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.controlPV
    );

    return items.map(item => ({
      id: item.id,
      stNumber: item.fields.Title,
      type: item.fields.Tipo,
      descriptionId: item.fields.Descripci_x00f3_n,
      siteId: item.fields.SitioIDLookupId,
      state: item.fields.Estado,
      technicians: item.fields.Tecnicoasignado || [],
      tentativeDate: item.fields.Fecha,
      confirmationDate: item.fields.Fechaconfirmaci_x00f3_n,
      workStartDate: item.fields.Fechatrabajoiniciado,
      workEndDate: item.fields.Fechatrabajofinalizado,
      closeDate: item.fields.Fechacierre,
      serviceTicketId: item.fields.Boleta,
      reportId: item.fields.Informe,
      systemId: item.fields.SistemaIDLookupId,
      calendarEventId: item.fields.calendarEvent,
      createdBy: item.createdBy
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
      const folderPath = encodeURIComponent(`/Boletas ST/${stData.st}`);
      const fileId = await this.uploadFile(
        this.siteId,
        this.driveId,
        descriptionFile,
        folderPath
      );

      // Create the service ticket
      const fields = {
        Title: stData.st, // ST number
        SitioIDLookupId: stData.siteId,
        SistemaIDLookupId: stData.systemId,
        Descripci_x00f3_n: fileId,
        Estado: "Iniciada"
      };

      const response = await this.client
        .api(encodeURIComponent(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items`))
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({
          fields: fields
        });

      return response;
    } catch (error) {
      console.error('Error creating service ticket:', error);
      throw new Error(`Error creating service ticket: ${error.message}`);
    }
  }

  async updateSTDate(stId, newDate, calendarEventId) {
    await this.initializeGraphClient();

    // Update calendar event if exists
    if (calendarEventId) {
      await this.updateCalendarEventDate(this.calendarId, calendarEventId, newDate);
    }

    // Update ST
    const response = await this.client
      .api(`/sites/${this.siteId}/lists/${this.config.lists.controlPV}/items/${stId}`)
      .patch({
        fields: {
          Fecha: newDate
        }
      });

    return response;
  }
}

export default PostVentaManagementService;