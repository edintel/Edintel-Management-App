import BaseGraphService from "../../../../services/BaseGraphService";
import PermissionService from "./PermissionService";

/**
 * ExtraHoursService - Handles extra hours operations
 *
 * This service interacts with SharePoint and provides methods for:
 * - Fetching and manipulating extra hours requests
 * - Managing approval workflows
 * - Handling permissions and user roles
 */
class ExtraHoursService extends BaseGraphService {
  constructor(msalInstance, config) {
    super(msalInstance);
    this.config = config;
    this.permissionService = new PermissionService(this);
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
    this.siteId = this.config.siteId;
    this.driveId = this.config.driveId;

    // Load the roles and departments data
    const [departments, roles] = await Promise.all([
      this.getDepartments(),
      this.getRoles(),
    ]);

    // Initialize the permission service with the data
    await this.permissionService.initialize(roles, departments);
  }
  /**
  * Get all extra hours requests from SharePoint
  * @returns {Array} Array of formatted extra hours request objects
  */
  async getExtraHoursRequests() {
  

    const items = await this.getListItems(
      this.siteId,
      this.config.lists.extraHours
    );



    const formattedRequests = items.map((item) => {
      // Parse ExtrasInfo JSON
      let extrasInfo = [];
      try {
        if (item.fields.ExtrasInfo) {
          extrasInfo = JSON.parse(item.fields.ExtrasInfo);
        }
      } catch (error) {
       
        extrasInfo = [];
      }

      // 🔍 Intentar obtener el email de diferentes formas
      const createdByEmail = item.createdBy?.user?.email ||
        item.createdBy?.user?.mail ||
        item.createdBy?.user?.userPrincipalName ||
        "";

      const createdByName = item.createdBy?.user?.displayName ||
        item.createdBy?.user?.name ||
        "";

   
      return {
        id: item.id,
        fechaPeticion: item.fields.FechaPeticion
          ? new Date(item.fields.FechaPeticion)
          : null,
        nombreSolicitante: item.fields.NombreSolicitante
          ? { displayName: item.fields.NombreSolicitante }
          : null,
        departamento: item.fields.Departamento || "",
        numeroCedula: item.fields.NumeroCedula || null,
        extrasInfo: extrasInfo,
        revisadoAsistente: item.fields.RevisadoAsistente === true ? true :
          item.fields.RevisadoAsistente === false ? false : null,
        aprobadoJefatura: item.fields.AprobadoJefatura === true ? true :
          item.fields.AprobadoJefatura === false ? false : null,
        aprobadoRH: item.fields.AprobadoRH === true ? true :
          item.fields.AprobadoRH === false ? false : null,
        revisadoConta: item.fields.RevisadoConta === true ? true :
          item.fields.RevisadoConta === false ? false : null,
        createdBy: {
          name: createdByName,
          email: createdByEmail,
          id: item.createdBy?.user?.id || "",
        },
        created: item.createdDateTime ?
          new Date(item.createdDateTime) : null,
      };
    });

    return formattedRequests;
  }

  // src/modules/extraHours/components/Service/ExtraHoursService.js

  /**
   * Create a new extra hours request
   * @param {Object} requestData - The extra hours request data
   * @returns {Object} The created request
   */

  /**
   * Create a new extra hours request
   * @param {Object} requestData - The extra hours request data
   * @returns {Object} The created request
   */
  async createExtraHoursRequest(requestData) {
    await this.initializeGraphClient();

    // Prepare ExtrasInfo JSON
    const extrasInfoJson = JSON.stringify(requestData.extrasInfo || []);

    // Limpiar y convertir NumeroCedula a número
    const numeroCedulaLimpio = requestData.numeroCedula
      .toString()
      .replace(/[^0-9]/g, '')
      .trim();

    // ✅ Validar que tengamos los datos necesarios
    if (!requestData.departamento) {
      throw new Error('Departamento es requerido');
    }

    if (!requestData.nombreSolicitante) {
      throw new Error('Nombre del solicitante es requerido');
    }

    const fields = {
      Title: `Solicitud ${requestData.nombreSolicitante}`,
      FechaPeticion: requestData.fechaPeticion || new Date().toISOString(),
      Departamento: requestData.departamento,
      NombreSolicitante: requestData.nombreSolicitante,
      NumeroCedula: numeroCedulaLimpio ? parseInt(numeroCedulaLimpio, 10) : 0,
      ExtrasInfo: extrasInfoJson,
      RevisadoAsistente: null,
      AprobadoJefatura: null,
      AprobadoRH: null,
      RevisadoConta: null,
    };

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.extraHours}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({
          fields: fields,
        });

      return response;
    } catch (error) {
      throw new Error(
        error.body?.error?.message || error.message || "Error al crear la solicitud"
      );
    }
  }


  /**
   * Update an existing extra hours request
   * @param {string} id - Request ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated request
   */
  async updateExtraHoursRequest(id, updateData) {
    await this.initializeGraphClient();

    const fields = {};

    // Only include fields that are being updated
    if (updateData.extrasInfo !== undefined) {
      fields.ExtrasInfo = JSON.stringify(updateData.extrasInfo);
    }
    if (updateData.departamento !== undefined) {
      fields.Departamento = updateData.departamento;
    }
    if (updateData.numeroCedula !== undefined) {
      fields.NumeroCedula = updateData.numeroCedula;
    }
    if (updateData.revisadoAsistente !== undefined) {
      fields.RevisadoAsistente = updateData.revisadoAsistente;
    }
    if (updateData.aprobadoJefatura !== undefined) {
      fields.AprobadoJefatura = updateData.aprobadoJefatura;
    }
    if (updateData.aprobadoRH !== undefined) {
      fields.AprobadoRH = updateData.aprobadoRH;
    }
    if (updateData.revisadoConta !== undefined) {
      fields.RevisadoConta = updateData.revisadoConta;
    }

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.extraHours}/items/${id}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: fields,
        });
      return response;
    } catch (error) {
      throw new Error(
        error.message || "Error al actualizar la solicitud de horas extras"
      );
    }
  }

  /**
   * Update approval status for a request
   * @param {string} id - Request ID
   * @param {string} approvalType - Type of approval (asistente, jefatura, rh, conta)
   * @param {boolean} status - Approval status
   * @returns {Object} Updated request
   */
  async updateApprovalStatus(id, approvalType, status) {
    await this.initializeGraphClient();

    const fields = {};

    switch (approvalType) {
      case "asistente":
        fields.RevisadoAsistente = status;
        break;
      case "jefatura":
        fields.AprobadoJefatura = status;
        break;
      case "rh":
        fields.AprobadoRH = status;
        break;
      case "conta":
        fields.RevisadoConta = status;
        break;
      default:
        throw new Error("Invalid approval type");
    }

    try {
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.extraHours}/items/${id}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({
          fields: fields,
        });
      return response;
    } catch (error) {
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
      this.config.lists.rolesDepartamentos,
      {
        filter: "fields/field_2 ne null",  // ✅ field_2 = Departamento
      }
    );

    const departmentMap = new Map();

    items.forEach((item) => {
      const deptId = item.fields.field_3;        // ✅ field_3 = DepartamentoID
      const dept = item.fields.field_2;          // ✅ field_2 = Departamento
      const role = item.fields.field_4;          // ✅ field_4 = Rol
      const empleado =
        Array.isArray(item.fields.field_1) && item.fields.field_1.length > 0  // ✅ field_1 = Empleado
          ? {
            email: item.fields.field_1[0].Email,
            displayName: item.fields.field_1[0].LookupValue,
            id: item.fields.field_1[0].LookupId,
          }
          : null;

      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, {
          id: deptId.toString(),
          departamento: dept,
          asistentesJefatura: [],
          jefaturas: [],
          administradores: [],
          colaboradores: [],
        });
      }

      const department = departmentMap.get(deptId);

      if (empleado) {
        switch (role) {
          case "AsistenteJefatura":
            department.asistentesJefatura.push(empleado);
            break;
          case "Jefatura":
            department.jefaturas.push(empleado);
            break;
          case "Administrador":
            department.administradores.push(empleado);
            break;
          case "Colaborador":
            department.colaboradores.push(empleado);
            break;
        }
      }
    });

    const departmentsArray = Array.from(departmentMap.values());
   

    return departmentsArray;
  }



  /**
   * Get roles from SharePoint
   * @returns {Array} Array of role objects
   */
  async getRoles() {
   

    const items = await this.getListItems(
      this.siteId,
      this.config.lists.rolesDepartamentos
    );

   // console.log('📊 Items obtenidos para roles:', items.length);

    const rolesArray = items.map((item) => {
      // ⭐ MODIFICADO: Extraer rol del array si es array
      let rolValue = item.fields.field_4 || null;
      if (Array.isArray(rolValue)) {
        rolValue = rolValue[0]; // Tomar el primer elemento
      }

      return {
        id: item.id,
        empleado:
          Array.isArray(item.fields.field_1) && item.fields.field_1.length > 0
            ? {
              email: item.fields.field_1[0].Email,
              displayName: item.fields.field_1[0].LookupValue,
              id: item.fields.field_1[0].LookupId,
            }
            : null,
        departamentoId: item.fields.field_3 || null,
        rol: rolValue,  // ⭐ Ahora es string, no array
      };
    });

  //
    return rolesArray;
  }

  /**
   * Filter requests by department and role
   * @param {Array} requests - Array of extra hours requests
   * @param {Object} userDeptRole - User's department and role
   * @returns {Array} Filtered requests
   */
  filterRequestsByDepartment(requests, userDeptRole) {
    if (!userDeptRole) return requests;

    const userEmail = this.msalInstance.getAllAccounts()[0]?.username;

    // Administradores see ALL requests from ALL departments
    if (userDeptRole.role === "Administrador") {
      return requests;
    }

    // AsistenteJefatura and Jefatura see all requests from their department + their own
    if (
      userDeptRole.role === "AsistenteJefatura" ||
      userDeptRole.role === "Jefatura"
    ) {
      return requests.filter(
        (req) =>
          req.departamento === userDeptRole.department.departamento ||
          req.createdBy.email === userEmail
      );
    }

    // Colaboradores only see their own requests
    return requests.filter((req) => req.createdBy.email === userEmail);
  }


  /**
 * DEBUG: Get actual field names from SharePoint
 * Ejecuta esto temporalmente para ver los nombres reales
 */
  async debugFieldNames() {
    await this.initializeGraphClient();

    try {
      // Ver campos de la lista de Horas Extras
      const extraHoursItems = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.extraHours}/items`)
        .expand('fields')
        .top(1)
        .get();

      // Ver campos de la lista de Roles/Departamentos
      const rolesItems = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.rolesDepartamentos}/items`)
        .expand('fields')
        .top(1)
        .get();

    } catch (error) {
      // Error getting field names
    }
  }
  /**
   * Get user's department and role
   * @param {string} userEmail - The user email
   * @returns {Object|null} User's department and role
   */
  getUserDepartmentRole(userEmail) {
    const userRoles = this.permissionService.getUserRoles(userEmail);

    if (userRoles.length === 0) return null;

    // Prioritize roles: Administrador > Jefatura > AsistenteJefatura > Colaborador
    const adminRole = userRoles.find(
      (role) => role.roleType === "Administrador"
    );
    if (adminRole) {
      return {
        department: adminRole.department,
        role: adminRole.roleType,
      };
    }

    const jefaturaRole = userRoles.find(
      (role) => role.roleType === "Jefatura"
    );
    if (jefaturaRole) {
      return {
        department: jefaturaRole.department,
        role: jefaturaRole.roleType,
      };
    }

    const asistenteRole = userRoles.find(
      (role) => role.roleType === "AsistenteJefatura"
    );
    if (asistenteRole) {
      return {
        department: asistenteRole.department,
        role: asistenteRole.roleType,
      };
    }

    // Default to first role (Colaborador)
    return {
      department: userRoles[0].department,
      role: userRoles[0].roleType,
    };
  }

  /**
   * Calculate total hours from extrasInfo
   * @param {Array} extrasInfo - Array of extra hours entries
   * @returns {number} Total hours
   */
  calculateTotalHours(extrasInfo) {
    if (!Array.isArray(extrasInfo)) return 0;

    return extrasInfo.reduce((total, extra) => {
      if (extra.horaInicio && extra.horaFin) {
        const inicio = new Date(`2000-01-01T${extra.horaInicio}`);
        const fin = new Date(`2000-01-01T${extra.horaFin}`);
        const hours = (fin - inicio) / (1000 * 60 * 60);
        return total + (hours > 0 ? hours : 0);
      }
      return total;
    }, 0);
  }

  /**
   * Get approval status summary
   * @param {Object} request - Extra hours request
   * @returns {Object} Approval status summary
   */
  getApprovalStatusSummary(request) {
    return {
      revisadoAsistente: request.revisadoAsistente,
      aprobadoJefatura: request.aprobadoJefatura,
      aprobadoRH: request.aprobadoRH,
      revisadoConta: request.revisadoConta,
      allApproved:
        request.revisadoAsistente &&
        request.aprobadoJefatura &&
        request.aprobadoRH &&
        request.revisadoConta,
      pendingApprovals: [
        !request.revisadoAsistente && "Asistente",
        !request.aprobadoJefatura && "Jefatura",
        !request.aprobadoRH && "RH",
        !request.revisadoConta && "Contabilidad",
      ].filter(Boolean),
    };
  }
}

export default ExtraHoursService;