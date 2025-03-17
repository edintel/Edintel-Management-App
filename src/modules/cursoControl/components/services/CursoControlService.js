import BaseGraphService from "../../../../services/BaseGraphService";
class CursoControlService extends BaseGraphService {
  constructor(msalInstance, config) {
    super(msalInstance);
    this.config = config;
    this.loginRequest = {
      scopes: ["User.Read", "Sites.Read.All", "Sites.ReadWrite.All"],
    };
  }
  formatDateForStorage(date) {
    const dateCopy = new Date(date);
    const dateStr = dateCopy.toISOString().split("T")[0] + "T12:00:00Z";
    return dateStr;
  }
  async initialize() {
    this.siteId = await this.getSiteId(this.config.siteName);
  }
  async getCursos() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.cursos
    );
    return items.map((item) => ({
      id: item.id,
      title: item.fields.Title || "",
      personaId: item.fields.PersonaLookupId || "",
      curso: item.fields.field_1 || "",
      fecha: item.fields.field_2 ? new Date(item.fields.field_2) : null,
      notas: item.fields.Notas || "",
    }));
  }

  async getCursosTipos() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.cursosTipos
    );
    // Get unique course types from the Title field
    return items
      .map((item) => item.fields.Title || "")
      .filter(Boolean)
      .sort();
  }

  async getCursoByTitle(title) {
    await this.initializeGraphClient();
    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.cursos}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .filter(`fields/Title eq '${title}'`)
        .expand("fields")
        .get();
      if (response.value && response.value.length > 0) {
        const item = response.value[0];
        return {
          id: item.id,
          title: item.fields.Title || "",
          curso: item.fields.field_1 || "",
          fecha: item.fields.field_2 ? new Date(item.fields.field_2) : null,
          notas: item.fields.Notas || "",
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting curso by title:", error);
      throw error;
    }
  }
  async createCurso(cursoData) {
    await this.initializeGraphClient();
    try {
      const fields = {
        Title: cursoData.title,
        PersonaLookupId: cursoData.personaId,
        field_1: cursoData.curso,
        field_2: cursoData.fecha
          ? this.formatDateForStorage(cursoData.fecha)
          : null,
        Notas: cursoData.notas || "",
      };
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.cursos}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({ fields });
      return response;
    } catch (error) {
      console.error("Error creating curso:", error);
      throw error;
    }
  }
  async updateCurso(id, cursoData) {
    await this.initializeGraphClient();
    try {
      const fields = {
        Title: cursoData.title,
        field_1: cursoData.curso,
        field_2: cursoData.fecha
          ? this.formatDateForStorage(cursoData.fecha)
          : null,
        Notas: cursoData.notas || "",
      };
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.cursos}/items/${id}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({ fields });
      return response;
    } catch (error) {
      console.error("Error updating curso:", error);
      throw error;
    }
  }
  async deleteCurso(id) {
    await this.initializeGraphClient();
    try {
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.cursos}/items/${id}`
        )
        .delete();
      return true;
    } catch (error) {
      console.error("Error deleting curso:", error);
      throw error;
    }
  }
  async getPersonas() {
    const items = await this.getListItems(
      this.siteId,
      this.config.lists.personas
    );
    return items.map((item) => ({
      id: item.id,
      title: item.fields.Title || "",
      empresa: item.fields.field_1 || "",
    }));
  }
  async getPersonaByTitle(title) {
    await this.initializeGraphClient();
    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.personas}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .filter(`fields/Title eq '${title}'`)
        .expand("fields")
        .get();
      if (response.value && response.value.length > 0) {
        const item = response.value[0];
        return {
          id: item.id,
          title: item.fields.Title || "",
          empresa: item.fields.field_1 || "",
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting persona by title:", error);
      throw error;
    }
  }
  async createPersona(personaData) {
    await this.initializeGraphClient();
    try {
      const fields = {
        Title: personaData.title,
        field_1: personaData.empresa || "Edintel",
      };
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.config.lists.personas}/items`)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .post({ fields });
      return response;
    } catch (error) {
      console.error("Error creating persona:", error);
      throw error;
    }
  }
  async updatePersona(id, personaData) {
    await this.initializeGraphClient();
    try {
      const fields = {
        Title: personaData.title,
        field_1: personaData.empresa || "Edintel",
      };
      const response = await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.personas}/items/${id}`
        )
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .patch({ fields });
      return response;
    } catch (error) {
      console.error("Error updating persona:", error);
      throw error;
    }
  }
  async deletePersona(id) {
    await this.initializeGraphClient();
    try {
      await this.client
        .api(
          `/sites/${this.siteId}/lists/${this.config.lists.personas}/items/${id}`
        )
        .delete();
      return true;
    } catch (error) {
      console.error("Error deleting persona:", error);
      throw error;
    }
  }
}
export default CursoControlService;
