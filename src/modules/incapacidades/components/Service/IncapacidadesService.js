import BaseGraphService from "../../../../services/BaseGraphService";

class IncapacidadesService extends BaseGraphService {
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
    this.teamsLoginRequest = { scopes: ["Chat.ReadWrite"] };
  }

  async initialize() {
    this.siteId = this.config.siteId;
    this.driveId = this.config.driveId;
    await this.initializeGraphClient();
    const rolesData = await this.getRoles();
    this._roles = rolesData;
  }

  async getRoles() {
    const items = await this.getListItems(this.siteId, this.config.lists.rolesDepartamentos);
    return items.map(item => {
      let rolValue = item.fields.field_4 || null;
      if (Array.isArray(rolValue)) rolValue = rolValue[0];
      return {
        id: item.id,
        empleado:
          Array.isArray(item.fields.field_1) && item.fields.field_1.length > 0
            ? {
                email: item.fields.field_1[0].Email,
                displayName: item.fields.field_1[0].LookupValue,
              }
            : null,
        rol: rolValue,
        departamento: item.fields.field_2 || null, // nombre del departamento
      };
    });
  }

  getUserRole(email) {
    if (!email || !this._roles) return 'Colaborador';
    const found = this._roles.find(r => r.empleado?.email === email);
    return found?.rol || 'Colaborador';
  }

  isAdmin(email) {
    return this.getUserRole(email) === 'Administrador';
  }

  async getIncapacidadesRequests() {
    const items = await this.getListItems(this.siteId, this.config.lists.incapacidades);
    return items.map(item => {
      const createdByEmail =
        item.createdBy?.user?.email ||
        item.createdBy?.user?.mail ||
        item.createdBy?.user?.userPrincipalName || '';
      const createdByName = item.createdBy?.user?.displayName || '';

      let comprobantes = [];
      try {
        comprobantes = item.fields.Comprobantes ? JSON.parse(item.fields.Comprobantes) : [];
      } catch {
        comprobantes = [];
      }

      return {
        id: item.id,
        nombreSolicitante: item.fields.NombreSolicitante || '',
        numeroCedula: item.fields.NumeroCedula || null,
        departamento: item.fields.Departamento || '',
        fechaInicio: item.fields.FechaInicio ? item.fields.FechaInicio.split('T')[0] : null,
        fechaFin: item.fields.FechaFin ? item.fields.FechaFin.split('T')[0] : null,
        diasIncapacidad: item.fields.DiasIncapacidad || 0,
        motivo: item.fields.Motivo || '',
        recibido: item.fields.Recibido === true ? true : null,
        fechaRecibido: item.fields.FechaRecibido ? new Date(item.fields.FechaRecibido) : null,
        recibidoPor: item.fields.RecibidoPor || null,
        comprobantes,
        createdBy: {
          name: createdByName,
          email: createdByEmail,
          id: item.createdBy?.user?.id || '',
        },
        created: item.createdDateTime ? new Date(item.createdDateTime) : null,
      };
    });
  }

  async createIncapacidadRequest(requestData) {
    await this.initializeGraphClient();

    const fields = {
      Title: `Incapacidad ${requestData.nombreSolicitante}`,
      NombreSolicitante: requestData.nombreSolicitante || '',
      NumeroCedula: requestData.numeroCedula
        ? parseInt(requestData.numeroCedula.toString().replace(/\D/g, ''), 10) || 0
        : 0,
      Departamento: requestData.departamento || '',
      FechaInicio: requestData.fechaInicio,
      FechaFin: requestData.fechaFin,
      DiasIncapacidad: requestData.diasIncapacidad || 0,
      Motivo: requestData.motivo || '',
      Recibido: null,
      Comprobantes: '[]',
    };

    const response = await this.client
      .api(`/sites/${this.siteId}/lists/${this.config.lists.incapacidades}/items`)
      .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
      .post({ fields });

    return response;
  }

  async uploadComprobante(itemId, file) {
    const folderPath = `/${this.config.folders.comprobantes}/${itemId}`;
    const fileId = await this.uploadFile(this.siteId, this.driveId, file, folderPath);

    const fileInfo = await this.getFile(this.siteId, this.driveId, fileId);

    return {
      id: fileId,
      name: file.name,
      url: fileInfo.url,
    };
  }

  async updateComprobantes(itemId, comprobantes) {
    await this.initializeGraphClient();
    await this.client
      .api(`/sites/${this.siteId}/lists/${this.config.lists.incapacidades}/items/${itemId}`)
      .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
      .patch({ fields: { Comprobantes: JSON.stringify(comprobantes) } });
  }

  async markRecibido(itemId, recibidoPor) {
    await this.initializeGraphClient();
    await this.client
      .api(`/sites/${this.siteId}/lists/${this.config.lists.incapacidades}/items/${itemId}`)
      .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
      .patch({
        fields: {
          Recibido: true,
          FechaRecibido: new Date().toISOString(),
          RecibidoPor: recibidoPor || '',
        },
      });
  }

  filterRequestsByUser(requests, userEmail, userRole) {
    if (userRole === 'Administrador') return requests;
    return requests.filter(r => r.createdBy.email === userEmail);
  }

  // ========================
  // Notificación Teams a RH
  // ========================

  getAllAdministradoresEmails() {
    return (this._roles || [])
      .filter(r =>
        r.rol === 'Administrador' &&
        r.empleado?.email &&
        r.departamento === 'Recursos Humanos'
      )
      .map(r => r.empleado.email);
  }

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

  getCurrentUserId() {
    const account = this.msalInstance.getAllAccounts()[0];
    return account?.localAccountId || account?.idTokenClaims?.oid || null;
  }

  async getUserIdByEmail(email) {
    if (!email) return null;
    await this.initializeGraphClient();
    try {
      const res = await this.client.api(`/users/${encodeURIComponent(email)}`).select('id').get();
      return res?.id || null;
    } catch {
      return null;
    }
  }

  async getOrCreateOneOnOneChat(recipientUserId, teamsToken) {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId || !recipientUserId || currentUserId === recipientUserId) return null;
    const body = {
      chatType: 'oneOnOne',
      members: [
        { '@odata.type': '#microsoft.graph.aadUserConversationMember', roles: ['owner'], 'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${currentUserId}')` },
        { '@odata.type': '#microsoft.graph.aadUserConversationMember', roles: ['owner'], 'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${recipientUserId}')` },
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
      const payload = { body: { contentType: 'html', content: htmlContent } };
      if (subject) payload.subject = subject;
      await this.graphFetch(teamsToken, `/chats/${chatId}/messages`, { method: 'POST', body: payload });
      return true;
    } catch (err) {
      console.error(`Error enviando Teams a ${recipientEmail}:`, err.message || err);
      return false;
    }
  }

  async notifyTeamsUsers(recipients, { subject, htmlContent }) {
    if (!recipients?.length) return;
    const currentEmail = this.msalInstance.getAllAccounts()[0]?.username;
    const unique = [...new Set(recipients.filter(Boolean))]
      .filter(e => e.toLowerCase() !== (currentEmail || '').toLowerCase());
    if (!unique.length) return;
    let teamsToken;
    try {
      teamsToken = await this.acquireTeamsToken();
    } catch (err) {
      console.warn('No se obtuvo token Teams:', err.message || err);
      return;
    }
    await Promise.allSettled(
      unique.map(email => this.sendTeamsChatMessage(email, { subject, htmlContent }, teamsToken))
    );
  }

  async notifyNewIncapacidad(requestData) {
    try {
      const recipients = this.getAllAdministradoresEmails();
      if (!recipients.length) return;

      const fmtDate = iso => {
        if (!iso) return '-';
        try { return new Date(iso + 'T00:00:00').toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
        catch { return iso; }
      };

      const nombre = requestData.nombreSolicitante || '';
      const depto = requestData.departamento || '-';
      const inicio = fmtDate(requestData.fechaInicio);
      const fin = fmtDate(requestData.fechaFin);
      const dias = requestData.diasIncapacidad || 0;
      const motivo = requestData.motivo ? `<p style="margin:0 0 8px 0;"><strong>Diagnóstico:</strong> ${requestData.motivo}</p>` : '';
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

      const html = `
        <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;background:#f4f6f9;margin:0;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <div style="background:#1a56db;color:#fff;padding:18px 24px;">
            <h2 style="margin:0;font-size:18px;">Nueva incapacidad registrada</h2>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 16px 0;">Se registró una nueva incapacidad médica que requiere su atención como RH.</p>
            <div style="background:#f5f7fb;border-left:4px solid #1a56db;padding:16px;border-radius:4px;margin:16px 0;">
              <p style="margin:0 0 8px 0;"><strong>Colaborador:</strong> ${nombre}</p>
              <p style="margin:0 0 8px 0;"><strong>Departamento:</strong> ${depto}</p>
              <p style="margin:0 0 8px 0;"><strong>Período:</strong> ${inicio} al ${fin}</p>
              <p style="margin:0 0 8px 0;"><strong>Días:</strong> ${dias}</p>
              ${motivo}
            </div>
            <p style="margin:16px 0 0 0;">
              <a href="${baseUrl}/incapacidades/todas" style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:600;">Ver incapacidades</a>
            </p>
            <p style="color:#888;font-size:12px;margin-top:24px;">Mensaje automático del Sistema de Incapacidades Edintel.</p>
          </div>
        </div></body></html>
      `;

      await this.notifyTeamsUsers(recipients, {
        subject: `Nueva incapacidad - ${nombre}`,
        htmlContent: html,
      });
    } catch (err) {
      console.error('Error enviando notificación de incapacidad:', err);
    }
  }
}

export default IncapacidadesService;
