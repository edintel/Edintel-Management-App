import { Client } from "@microsoft/microsoft-graph-client";

class BaseGraphService {
    constructor(msalInstance) {
      this.msalInstance = msalInstance;
      this.client = null;
      this.tenantName = "edintelcr"; // This is the only immutable setting
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
              ...this.loginRequest,
              account: account,
            });
            return response.accessToken;
          },
        };
        this.client = Client.initWithMiddleware({ authProvider });
      }
    }
  
    async getSiteId(siteName) {
      await this.initializeGraphClient();
      const siteResponse = await this.client
        .api(`/sites/${this.tenantName}.sharepoint.com:/sites/${siteName}`)
        .get();
      return siteResponse.id;
    }
  
    async getListId(siteId, listName) {
      const response = await this.client
        .api(`/sites/${siteId}/lists`)
        .filter(`name eq '${listName}'`)
        .get();
  
      return response.value[0].id;
    }
  
    async getListItems(siteId, listId) {
      await this.initializeGraphClient();
      const response = await this.client
        .api(`/sites/${siteId}/lists/${listId}/items`)
        .expand("fields")
        .get();
      return response.value;
    }
  
    async createFolder(siteId, driveId, folderPath) {
      await this.initializeGraphClient();
  
      const pathSegments = folderPath.split("/").filter(Boolean);
      let currentPath = "";
  
      for (const segment of pathSegments) {
        const encodedSegment = encodeURIComponent(segment);
        currentPath += `/${encodedSegment}`;
        try {
          await this.client
            .api(`/sites/${siteId}/drives/${driveId}/root:${currentPath}`)
            .get();
        } catch (error) {
          if (error.statusCode === 404) {
            await this.client
              .api(`/sites/${siteId}/drives/${driveId}/root:${currentPath}`)
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
  
    async uploadFile(siteId, driveId, file, folderPath) {
      await this.initializeGraphClient();
      await this.createFolder(siteId, driveId, folderPath);
  
      const fileExtension = file.name.split(".").pop();
      const uniqueFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;
      const filePath = `${folderPath}/${uniqueFileName}`;
  
      if (file.size <= 4 * 1024 * 1024) {
        const response = await this.client
          .api(`/sites/${siteId}/drives/${driveId}/root:${filePath}:/content`)
          .put(file);
        return response.id;
      }
  
      // Large file upload logic
      const uploadSession = await this.client
        .api(`/sites/${siteId}/drives/${driveId}/root:${filePath}:/createUploadSession`)
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
  
    async getImageContent(siteId, driveId, itemId) {
      if (!itemId) {
        throw new Error("Item ID is required");
      }
  
      try {
        await this.initializeGraphClient();
  
        const response = await this.client
          .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}`)
          .get();
  
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length === 0) {
          throw new Error("No accounts found");
        }
  
        const tokenResponse = await this.msalInstance.acquireTokenSilent({
          ...this.loginRequest,
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
  }

  export default BaseGraphService;