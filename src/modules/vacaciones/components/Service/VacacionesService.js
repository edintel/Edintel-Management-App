import BaseGraphService from "../../../../services/BaseGraphService";
import PermissionService from "./PermissionService";

class VacacionesService extends BaseGraphService {
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
    // Scope Teams separado: se solicita bajo demanda (consent interactivo
    // solo la primera vez que se envía un mensaje de Teams).
    this.teamsLoginRequest = {
      scopes: ["Chat.ReadWrite"],
    };
  }

  async initialize() {
    this.siteId = this.config.siteId;
    this.driveId = this.config.driveId;

    const [departments, roles] = await Promise.all([
      this.getDepartments(),
      this.getRoles(),
    ]);

    await this.permissionService.initialize(roles, departments);
  }

  async getVacacionesRequests() {
    const items = await this.getListItems(this.siteId, this.config.lists.vacaciones);

    return items.map(item => {
      const createdByEmail =
        item.createdBy?.user?.email ||
        item.createdBy?.user?.mail ||
        item.createdBy?.user?.userPrincipalName ||
        '';

      const createdByName = item.createdBy?.user?.displayName || item.createdBy?.user?.name || '';

      return {
        id: item.id,
        fechaPeticion: item.fields.FechaPeticion ? new Date(item.fields.FechaPeticion) : null,
        fechaInicio: item.fields.FechaInicio ? item.fields.FechaInicio.split('T')[0] : null,
        fechaFin: item.fields.FechaFin ? item.fields.FechaFin.split('T')[0] : null,
        diasHabiles: item.fields.DiasHabiles || 0,
        departamento: item.fields.Departamento || '',
        nombreSolicitante: item.fields.NombreSolicitante
          ? { displayName: item.fields.NombreSolicitante }
          : null,
        numeroCedula: item.fields.NumeroCedula || null,
        motivo: item.fields.Motivo || '',
        aprobadoJefatura: item.fields.AprobadoJefatura === true ? true
          : item.fields.AprobadoJefatura === false ? false : null,
        aprobadoRH: item.fields.AprobadoRH === true ? true
          : item.fields.AprobadoRH === false ? false : null,
        createdBy: {
          name: createdByName,
          email: createdByEmail,
          id: item.createdBy?.user?.id || '',
        },
        created: item.createdDateTime ? new Date(item.createdDateTime) : null,
      };
    });
  }

  async createVacacionesRequest(requestData) {
    await this.initializeGraphClient();

    const numeroCedulaLimpio = requestData.numeroCedula
      ? requestData.numeroCedula.toString().replace(/[^0-9]/g, '').trim()
      : '';

    if (!requestData.departamento) throw new Error('Departamento es requerido');
    if (!requestData.nombreSolicitante) throw new Error('Nombre del solicitante es requerido');

    const fields = {
      Title: `Vacaciones ${requestData.nombreSolicitante}`,
      FechaPeticion: requestData.fechaPeticion || new Date().toISOString(),
      FechaInicio: requestData.fechaInicio,
      FechaFin: requestData.fechaFin,
      DiasHabiles: requestData.diasHabiles || 0,
      Departamento: requestData.departamento,
      NombreSolicitante: requestData.nombreSolicitante,
      NumeroCedula: numeroCedulaLimpio ? parseInt(numeroCedulaLimpio, 10) : 0,
      Motivo: requestData.motivo || '',
      // Si el solicitante es Jefatura, se auto-aprueba la etapa de jefatura
      AprobadoJefatura: null,
      AprobadoRH: null,
    };

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.vacaciones}/items`)
        .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
        .post({ fields });

      return response;
    } catch (error) {
      throw new Error(error.body?.error?.message || error.message || 'Error al crear la solicitud');
    }
  }

  async updateVacacionesRequest(id, updateData) {
    await this.initializeGraphClient();

    const fields = {};

    if (updateData.fechaInicio !== undefined) fields.FechaInicio = updateData.fechaInicio;
    if (updateData.fechaFin !== undefined) fields.FechaFin = updateData.fechaFin;
    if (updateData.diasHabiles !== undefined) fields.DiasHabiles = updateData.diasHabiles;
    if (updateData.motivo !== undefined) fields.Motivo = updateData.motivo;
    if (updateData.numeroCedula !== undefined) fields.NumeroCedula = updateData.numeroCedula;
    if (updateData.aprobadoJefatura !== undefined) fields.AprobadoJefatura = updateData.aprobadoJefatura;
    if (updateData.aprobadoRH !== undefined) fields.AprobadoRH = updateData.aprobadoRH;

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.vacaciones}/items/${id}`)
        .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
        .patch({ fields });

      return response;
    } catch (error) {
      throw new Error(error.message || 'Error al actualizar la solicitud');
    }
  }

  async updateApprovalStatus(id, approvalType, status) {
    await this.initializeGraphClient();

    const fields = {};

    switch (approvalType) {
      case 'jefatura':
        fields.AprobadoJefatura = status;
        break;
      case 'rh':
        fields.AprobadoRH = status;
        break;
      default:
        throw new Error('Tipo de aprobación inválido');
    }

    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.vacaciones}/items/${id}`)
        .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
        .patch({ fields });

      return response;
    } catch (error) {
      throw new Error(error.message || 'Error al actualizar el estado de aprobación');
    }
  }

  async getDepartments() {
    // Sin filtro OData para evitar problemas con columnas no indexadas
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.rolesDepartamentos
    );

    const departmentMap = new Map();

    items.forEach(item => {
      const deptId = item.fields.field_3;
      const dept = item.fields.field_2;
      // field_4 puede ser string "Jefatura" o array ["Jefatura", "Administrador"]
      const rawRole = item.fields.field_4;
      const roles = Array.isArray(rawRole)
        ? rawRole.filter(Boolean)
        : rawRole ? [rawRole] : [];
      const empleado =
        Array.isArray(item.fields.field_1) && item.fields.field_1.length > 0
          ? {
            email: item.fields.field_1[0].Email,
            displayName: item.fields.field_1[0].LookupValue,
            id: item.fields.field_1[0].LookupId,
          }
          : null;

      // Solo registrar filas que tengan departamento
      if (!dept || deptId == null) return;

      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, {
          id: String(deptId),
          departamento: dept,
          jefaturas: [],
          gerencias: [],
          gerenciaGeneral: [],
          administradores: [],
          colaboradores: [],
        });
      }

      const department = departmentMap.get(deptId);

      if (empleado && roles.length > 0) {
        // Procesar TODOS los roles (un usuario puede tener Jefatura + Administrador)
        roles.forEach(role => {
          switch (role) {
            case 'Jefatura':
              if (!department.jefaturas.some(j => j.email === empleado.email)) {
                department.jefaturas.push(empleado);
              }
              break;
            case 'Administrador':
              if (!department.administradores.some(a => a.email === empleado.email)) {
                department.administradores.push(empleado);
              }
              break;
            case 'Gerencia':
              if (!department.gerencias.some(g => g.email === empleado.email)) {
                department.gerencias.push(empleado);
              }
              break;
            case 'Gerencia General':
              if (!department.gerenciaGeneral.some(g => g.email === empleado.email)) {
                department.gerenciaGeneral.push(empleado);
              }
              break;
            case 'Colaborador':
            case 'AsistenteJefatura':
              if (!department.colaboradores.some(c => c.email === empleado.email)) {
                department.colaboradores.push(empleado);
              }
              break;
            default:
              break;
          }
        });
      }
    });

    return Array.from(departmentMap.values());
  }

  async getRoles() {
    const items = await this.getListItems(this.siteId, this.config.lists.rolesDepartamentos);

    const result = [];
    items.forEach(item => {
      const rawRole = item.fields.field_4;
      // field_4 puede ser string o array — expandir en un objeto por rol
      const roles = Array.isArray(rawRole)
        ? rawRole.filter(Boolean)
        : rawRole ? [rawRole] : [];

      const empleado =
        Array.isArray(item.fields.field_1) && item.fields.field_1.length > 0
          ? {
            email: item.fields.field_1[0].Email,
            displayName: item.fields.field_1[0].LookupValue,
            id: item.fields.field_1[0].LookupId,
          }
          : null;

      const departamentoId = item.fields.field_3 || null;

      // Un item con ["Jefatura","Administrador"] genera DOS entradas en roles
      roles.forEach(rol => {
        result.push({ id: item.id, empleado, departamentoId, rol });
      });

      // Si no tiene roles definidos, igual lo incluimos como Colaborador
      if (roles.length === 0) {
        result.push({ id: item.id, empleado, departamentoId, rol: null });
      }
    });

    return result;
  }

  filterRequestsByDepartment(requests, userDeptRole) {
    if (!userDeptRole) return requests;

    const userEmail = this.msalInstance.getAllAccounts()[0]?.username;

    if (userDeptRole.role === 'Administrador') return requests;

    if (userDeptRole.role === 'Jefatura') {
      return requests.filter(
        req =>
          req.departamento === userDeptRole.department?.departamento ||
          req.createdBy.email === userEmail
      );
    }

    return requests.filter(req => req.createdBy.email === userEmail);
  }

  getApprovalStatusSummary(request) {
    const allApproved = request.aprobadoJefatura === true && request.aprobadoRH === true;

    return {
      aprobadoJefatura: request.aprobadoJefatura,
      aprobadoRH: request.aprobadoRH,
      allApproved,
    };
  }

  // ==========================
  // Notificaciones de Teams
  // ==========================

  getJefaturaEmailsForDepartment(deptName) {
    const departments = this.permissionService?.departments || [];
    const dept = departments.find(d => d.departamento === deptName);
    if (!dept) return [];
    // Priorizar Jefaturas; si no hay, usar Administradores del mismo departamento
    const jefaturas = (dept.jefaturas || []).map(j => j.email).filter(Boolean);
    const admins = (dept.administradores || []).map(a => a.email).filter(Boolean);
    return jefaturas.length > 0 ? jefaturas : admins;
  }

  getAllAdministradoresEmails() {
    const departments = this.permissionService?.departments || [];
    // Recolectar de TODOS los departamentos (no solo 'Recursos Humanos')
    // para evitar fallos por nombre exacto o asignación de depto
    const emails = departments
      .flatMap(d => (d.administradores || []).map(a => a.email))
      .filter(Boolean);
    return [...new Set(emails)];
  }

  getGerenciaEmailsForDepartment(deptName) {
    const departments = this.permissionService?.departments || [];
    const dept = departments.find(d => d.departamento === deptName);
    if (!dept) return [];
    return (dept.gerencias || []).map(g => g.email).filter(Boolean);
  }

  getGerenciaGeneralEmails() {
    const departments = this.permissionService?.departments || [];
    const emails = departments
      .flatMap(d => (d.gerenciaGeneral || []).map(g => g.email))
      .filter(Boolean);
    return [...new Set(emails)];
  }

  buildNotificationEmailHtml({ title, message, request, actionUrl }) {
    const fmtDate = (iso) => {
      if (!iso) return '-';
      try {
        return new Date(iso + 'T00:00:00').toLocaleDateString('es-CR', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
      } catch {
        return iso;
      }
    };

    const solicitante = request.nombreSolicitante?.displayName
      || (typeof request.nombreSolicitante === 'string' ? request.nombreSolicitante : '')
      || request.createdBy?.name
      || '';
    const depto = request.departamento || '-';
    const startDate = fmtDate(request.fechaInicio);
    const endDate = fmtDate(request.fechaFin);
    const dias = request.diasHabiles || 0;
    const motivo = request.motivo
      ? `<p style="margin:0 0 8px 0;"><strong>Motivo:</strong> ${request.motivo}</p>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color:#333; line-height:1.5; background:#f4f6f9; margin:0; padding:20px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <div style="background:#1a56db; color:#ffffff; padding:18px 24px;">
            <h2 style="margin:0; font-size:18px;">${title}</h2>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 16px 0;">${message}</p>
            <div style="background:#f5f7fb; border-left:4px solid #1a56db; padding:16px; border-radius:4px; margin:16px 0;">
              <p style="margin:0 0 8px 0;"><strong>Solicitante:</strong> ${solicitante}</p>
              <p style="margin:0 0 8px 0;"><strong>Departamento:</strong> ${depto}</p>
              <p style="margin:0 0 8px 0;"><strong>Período:</strong> ${startDate} al ${endDate}</p>
              <p style="margin:0 0 8px 0;"><strong>Días hábiles:</strong> ${dias}</p>
              ${motivo}
            </div>
            ${actionUrl ? `<p style="margin:16px 0 0 0;"><a href="${actionUrl}" style="display:inline-block; background:#1a56db; color:#000000; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:600;">Ver solicitud</a></p>` : ''}
            <p style="color:#888; font-size:12px; margin-top:24px;">Mensaje automático del Sistema de Vacaciones Edintel.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async notifyNewRequest(requestData) {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const requesterRole = requestData.requesterRole || 'Colaborador';
      const dept = requestData.departamento;
      const actionUrl = `${baseUrl}/vacaciones/approvals`;

      let recipients = [];
      let title;
      let message;

      if (requesterRole === 'Gerencia General') {
        recipients = this.getAllAdministradoresEmails();
        title = 'Nueva solicitud de vacaciones (Gerencia General)';
        message = `La Gerencia General ha registrado una nueva solicitud de vacaciones que requiere revisión de RH.`;
      } else if (requesterRole === 'Gerencia') {
        recipients = this.getGerenciaGeneralEmails();
        title = 'Nueva solicitud de vacaciones (Gerencia)';
        message = `La Gerencia del departamento <strong>${dept}</strong> ha registrado una nueva solicitud de vacaciones que requiere su aprobación.`;
      } else if (requesterRole === 'Jefatura') {
        recipients = this.getGerenciaEmailsForDepartment(dept);
        if (!recipients.length) recipients = this.getAllAdministradoresEmails();
        title = 'Nueva solicitud de vacaciones (Jefatura)';
        message = `La Jefatura del departamento <strong>${dept}</strong> ha registrado una nueva solicitud de vacaciones que requiere su aprobación.`;
      } else {
        recipients = this.getJefaturaEmailsForDepartment(dept);
        title = 'Nueva solicitud de vacaciones pendiente de aprobación';
        message = `Se ha registrado una nueva solicitud de vacaciones en el departamento <strong>${dept}</strong> que requiere su aprobación.`;
      }

      if (!recipients || recipients.length === 0) return;

      const solicitanteNombre = requestData.nombreSolicitante?.displayName
        || (typeof requestData.nombreSolicitante === 'string' ? requestData.nombreSolicitante : '')
        || '';

      const html = this.buildNotificationEmailHtml({ title, message, request: requestData, actionUrl });
      await this.notifyTeamsUsers(recipients, { subject: `${title} - ${solicitanteNombre}`.trim(), htmlContent: html });
    } catch (error) {
      console.error('Error enviando notificación de nueva solicitud:', error);
    }
  }

  async notifyApprovalChange(request, approvalType, approved) {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const approverEmail = this.msalInstance.getAllAccounts()[0]?.username;
      const approverRoles = this.permissionService?.getUserRoles(approverEmail) || [];
      const approverHighestRole = (() => {
        for (const r of ['Gerencia General', 'Gerencia', 'Jefatura']) {
          if (approverRoles.some(ar => ar.roleType === r)) return r;
        }
        return 'Administrador';
      })();

      let recipients = [];
      let title;
      let message;
      let actionUrl = `${baseUrl}/vacaciones/approvals`;

      if (approvalType === 'jefatura') {
        if (approved) {
          if (approverHighestRole === 'Jefatura') {
            recipients = this.getGerenciaEmailsForDepartment(request.departamento);
            if (!recipients.length) recipients = this.getAllAdministradoresEmails();
            title = 'Solicitud de vacaciones aprobada por Jefatura';
            message = `La Jefatura del departamento <strong>${request.departamento}</strong> aprobó una solicitud. Requiere aprobación de Gerencia.`;
          } else if (approverHighestRole === 'Gerencia') {
            recipients = this.getGerenciaGeneralEmails();
            if (!recipients.length) recipients = this.getAllAdministradoresEmails();
            title = 'Solicitud de vacaciones aprobada por Gerencia';
            message = `La Gerencia del departamento <strong>${request.departamento}</strong> aprobó una solicitud. Requiere aprobación de Gerencia General.`;
          } else if (approverHighestRole === 'Gerencia General') {
            recipients = this.getAllAdministradoresEmails();
            title = 'Solicitud de vacaciones aprobada por Gerencia General';
            message = `La Gerencia General aprobó una solicitud de vacaciones. Requiere revisión final de RH.`;
          }
        } else {
          if (request.createdBy?.email) recipients = [request.createdBy.email];
          title = 'Solicitud de vacaciones rechazada';
          message = 'Su solicitud de vacaciones fue rechazada.';
          actionUrl = `${baseUrl}/vacaciones/requests/${request.id}`;
        }
      } else if (approvalType === 'rh') {
        if (request.createdBy?.email) recipients = [request.createdBy.email];
        actionUrl = `${baseUrl}/vacaciones/requests/${request.id}`;
        title = approved ? 'Solicitud de vacaciones aprobada' : 'Solicitud de vacaciones rechazada por RH';
        message = approved
          ? 'Su solicitud de vacaciones ha sido aprobada.'
          : 'Su solicitud de vacaciones fue rechazada por RH.';
      }

      if (!recipients || recipients.length === 0) return;

      const solicitanteNombre = request.nombreSolicitante?.displayName || request.createdBy?.name || '';
      const html = this.buildNotificationEmailHtml({ title, message, request, actionUrl });
      await this.notifyTeamsUsers(recipients, { subject: `${title} - ${solicitanteNombre}`.trim(), htmlContent: html });
    } catch (error) {
      console.error('Error enviando notificación de cambio de aprobación:', error);
    }
  }

  // ==========================
  // Mensajería Teams (Graph API: chatMessage)
  // ==========================

  getCurrentUserId() {
    const account = this.msalInstance.getAllAccounts()[0];
    return account?.localAccountId || account?.idTokenClaims?.oid || null;
  }

  // Adquiere un token específico para Chat.ReadWrite.
  // Silencioso si ya hay consentimiento; popup si hace falta consent interactivo.
  async acquireTeamsToken() {
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) throw new Error('No hay cuenta activa');
    const account = accounts[0];
    const request = { ...this.teamsLoginRequest, account };

    try {
      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (err) {
      const msg = (err?.errorMessage || err?.message || '') + '';
      const needsInteraction =
        err?.name === 'InteractionRequiredAuthError' ||
        (err?.errorCode || '').includes('interaction_required') ||
        msg.includes('AADSTS65001') ||
        msg.includes('consent') ||
        msg.includes('invalid_grant');

      if (needsInteraction) {
        const response = await this.msalInstance.acquireTokenPopup(request);
        return response.accessToken;
      }
      throw err;
    }
  }

  async graphFetch(token, path, { method = 'GET', body = null } = {}) {
    const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Graph ${method} ${path} → ${res.status} ${text}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async getUserIdByEmail(email) {
    if (!email) return null;
    await this.initializeGraphClient();
    try {
      const response = await this.client
        .api(`/users/${encodeURIComponent(email)}`)
        .select('id')
        .get();
      return response?.id || null;
    } catch (error) {
      console.warn(`No se pudo resolver usuario Teams para ${email}:`, error.message || error);
      return null;
    }
  }

  async getOrCreateOneOnOneChat(recipientUserId, teamsToken) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) throw new Error('No se pudo obtener el ID del usuario actual');
    if (!recipientUserId) throw new Error('Recipient user ID es requerido');
    if (currentUserId === recipientUserId) return null;

    const body = {
      chatType: 'oneOnOne',
      members: [
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${currentUserId}')`,
        },
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${recipientUserId}')`,
        },
      ],
    };

    const response = await this.graphFetch(teamsToken, '/chats', { method: 'POST', body });
    return response?.id || null;
  }

  async sendTeamsChatMessage(recipientEmail, { subject, htmlContent }, teamsToken) {
    try {
      const userId = await this.getUserIdByEmail(recipientEmail);
      if (!userId) return false;

      const chatId = await this.getOrCreateOneOnOneChat(userId, teamsToken);
      if (!chatId) return false;

      const messagePayload = {
        body: {
          contentType: 'html',
          content: htmlContent,
        },
      };

      if (subject) {
        messagePayload.subject = subject;
      }

      await this.graphFetch(teamsToken, `/chats/${chatId}/messages`, {
        method: 'POST',
        body: messagePayload,
      });
      return true;
    } catch (error) {
      console.error(`Error enviando mensaje Teams a ${recipientEmail}:`, error.message || error);
      return false;
    }
  }

  async notifyTeamsUsers(recipients, { subject, htmlContent }) {
    if (!Array.isArray(recipients) || recipients.length === 0) return;

    const currentEmail = this.msalInstance.getAllAccounts()[0]?.username;
    const unique = Array.from(new Set(recipients.filter(Boolean)))
      .filter(email => email.toLowerCase() !== (currentEmail || '').toLowerCase());

    if (unique.length === 0) return;

    let teamsToken;
    try {
      teamsToken = await this.acquireTeamsToken();
    } catch (err) {
      console.warn('No se obtuvo token de Teams (Chat.ReadWrite):', err.message || err);
      return;
    }

    await Promise.allSettled(
      unique.map(email => this.sendTeamsChatMessage(email, { subject, htmlContent }, teamsToken))
    );
  }
}

export default VacacionesService;
