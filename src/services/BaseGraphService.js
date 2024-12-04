import { Client } from "@microsoft/microsoft-graph-client";
import { generateUniqueMessageId } from "../utils/randomUtils";

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

  async getListItems(siteId, listId, options = {}) {
    await this.initializeGraphClient();

    let allItems = [];

    // Build the initial query URL with options
    let queryParams = ["expand=fields", "$top=100"];

    // Add filter if provided
    if (options.filter) {
      queryParams.push(`$filter=${encodeURIComponent(options.filter)}`);
    }

    // Add select if provided
    if (options.select) {
      queryParams.push(
        `$select=${encodeURIComponent(options.select.join(","))}`
      );
    }

    // Add orderby if provided
    if (options.orderBy) {
      queryParams.push(`$orderby=${encodeURIComponent(options.orderBy)}`);
    }

    // Build initial URL
    let nextLink = `/sites/${siteId}/lists/${listId}/items?${queryParams.join(
      "&"
    )}`;

    while (nextLink) {
      try {
        const response = await this.client.api(nextLink).get();

        allItems = [...allItems, ...response.value];

        // Update nextLink for the next page, if it exists
        nextLink = response["@odata.nextLink"]
          ? response["@odata.nextLink"].split("/v1.0")[1]
          : null;
      } catch (error) {
        console.error("Error fetching list items:", error);
        throw error;
      }
    }

    return allItems;
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

  async uploadFile(siteId, driveId, file, folderPath, fileName = "") {
    await this.initializeGraphClient();
    await this.createFolder(siteId, driveId, folderPath);

    const fileExtension = file.name.split(".").pop();
    let uniqueFileName;

    if (fileName) {
      uniqueFileName = fileName.endsWith(`.${fileExtension}`)
        ? fileName
        : `${fileName}.${fileExtension}`;
    } else {
      uniqueFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;
    }

    const filePath = `${folderPath}/${uniqueFileName}`;

    if (file.size <= 4 * 1024 * 1024) {
      const response = await this.client
        .api(`/sites/${siteId}/drives/${driveId}/root:${filePath}:/content`)
        .put(file);
      return response.id;
    }

    // Large file upload logic
    const uploadSession = await this.client
      .api(
        `/sites/${siteId}/drives/${driveId}/root:${filePath}:/createUploadSession`
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

  async deleteFile(itemId) {
    if (!itemId) return;

    await this.initializeGraphClient();
    try {
      await this.client
        .api(`/sites/${this.siteId}/drives/${this.driveId}/items/${itemId}`)
        .delete();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
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

  async createCalendarEvent(groupId, title, startTime, attendees = [], body) {
    await this.initializeGraphClient();

    const adjustedStartTime = new Date(
      new Date(startTime).getTime() - 6 * 60 * 60 * 1000
    );
    const adjustedEndTime = new Date(
      adjustedStartTime.getTime() + 4 * 60 * 60 * 1000
    );

    const event = {
      subject: title,
      body: {
        contentType: "HTML",
        content: body,
      },
      start: {
        dateTime: adjustedStartTime.toISOString(),
        timeZone: "America/Costa_Rica",
      },
      end: {
        dateTime: adjustedEndTime.toISOString(),
        timeZone: "America/Costa_Rica",
      },
      attendees: attendees.map((attendee) => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name,
        },
        type: "required",
      })),
    };

    const response = await this.client
      .api(`/groups/${groupId}/calendar/events`)
      .post(event);

    return response.id;
  }

  async updateCalendarEvent(groupId, eventId, updates) {
    await this.initializeGraphClient();

    await this.client
      .api(`/groups/${groupId}/calendar/events/${eventId}`)
      .patch(updates);
  }

  async updateCalendarEventAttendees(groupId, eventId, attendees) {
    const updates = {
      attendees: attendees.map((attendee) => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name,
        },
        type: "required",
      })),
    };

    await this.updateCalendarEvent(groupId, eventId, updates);
  }

  async updateCalendarEventDate(groupId, eventId, newStartTime) {
    const adjustedStartTime = new Date(
      new Date(newStartTime).getTime() - 6 * 60 * 60 * 1000
    );
    const adjustedEndTime = new Date(
      adjustedStartTime.getTime() + 4 * 60 * 60 * 1000
    );

    const updates = {
      start: {
        dateTime: adjustedStartTime.toISOString(),
        timeZone: "America/Costa_Rica",
      },
      end: {
        dateTime: adjustedEndTime.toISOString(),
        timeZone: "America/Costa_Rica",
      },
    };

    await this.updateCalendarEvent(groupId, eventId, updates);
  }

  async deleteCalendarEvent(groupId, eventId) {
    await this.client
      .api(`/groups/${groupId}/calendar/events/${eventId}`)
      .delete();
  }

  async createShareLink(siteId, itemId, type = "view", scope = "anonymous") {
    await this.initializeGraphClient();

    const response = await this.client
      .api(`/sites/${siteId}/drive/items/${itemId}/createLink`)
      .post({
        type: type, // Can be "view", "edit", or "embed"
        scope: scope, // Can be "anonymous", "organization"
      });

    return response.link;
  }

  async sendEmail({
    toRecipients,
    subject,
    content,
    ccRecipients = [],
    attachments = [],
  }) {
    await this.initializeGraphClient();

    const messageId = generateUniqueMessageId("MAIL").emailCompliantId;

    const message = {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content,
        },
        toRecipients: toRecipients.map((email) => ({
          emailAddress: { address: email },
        })),
        ccRecipients: ccRecipients.map((email) => ({
          emailAddress: { address: email },
        })),
        internetMessageId: messageId,
        internetMessageHeaders: [
          {
            name: "X-ST-Reference",
            value: messageId,
          },
          {
            name: "X-ST-Thread-Topic",
            value: subject,
          },
        ],
      },
    };

    // Add attachments if provided
    if (attachments.length > 0) {
      message.message.attachments = attachments.map((attachment) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: attachment.name,
        contentType: attachment.type,
        contentBytes: attachment.content, // Base64 encoded content
      }));
    }

    await this.client.api("/me/sendMail").post(message);

    return messageId;
  }
}

export default BaseGraphService;
