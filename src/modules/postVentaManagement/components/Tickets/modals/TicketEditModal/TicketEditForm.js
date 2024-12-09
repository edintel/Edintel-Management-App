import React, { useState, useEffect } from "react";
import { usePostVentaManagement } from "../../../../context/postVentaManagementContext";
import { Loader2, FileText, Eye, Download, X } from "lucide-react";
import MultiFileUpload from "../../../../../../components/common/MultiFileUpload";
import MultiImageUpload from "../../../../../../components/common/MultiImageUpload";
import ImageModal from "../../../../../../components/common/ImageModal";
import { cn } from "../../../../../../utils/cn";
import { useFileManagement } from "../../hooks/useFileManagement";
import { useImageManagement } from "../../hooks/useImageManagement";

const TicketEditForm = ({
  onSubmit,
  initialData = null,
  processing = false,
}) => {
  const {
    companies = [],
    buildings = [],
    sites = [],
    systems = [],
    userRole,
    service,
  } = usePostVentaManagement();

  // Basic form data state
  const [formData, setFormData] = useState({
    st: "",
    scope: "",
    companyId: "",
    buildingId: "",
    siteId: "",
    systemId: "",
    type: "",
  });

  // File management state structure
  const [fileState, setFileState] = useState({
    description: {
      existing: null,
      fileName: null,
      toDelete: false,
    },
    serviceTickets: {
      existing: [],
      toDelete: [],
    },
    adminDocs: {
      existing: [],
      toDelete: [],
    },
    images: {
      existing: [],
      toDelete: [],
    },
  });

  const [errors, setErrors] = useState({});

  // Preview states
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // File management hooks for new files
  const descriptionFile = useFileManagement({
    generateNames: true,
    namePrefix: "description-",
  });

  const serviceTicketsFiles = useFileManagement({
    generateNames: true,
    namePrefix: "service-ticket-",
  });

  const adminDocsFiles = useFileManagement({
    generateNames: true,
    namePrefix: "admin-doc-",
  });

  const imagesFiles = useImageManagement({
    generateNames: true,
    namePrefix: "image-",
  });

  // Load existing files
  useEffect(() => {
    const loadExistingFiles = async () => {
      if (!initialData?.id) return;

      try {
        // Load ticket documents
        const documents = await service.getTicketDocuments(initialData.id);

        // Create object URLs for images
        const loadedImages = await Promise.all(
          documents
            .filter((doc) => doc.documentType === "image")
            .map(async (image) => {
              try {
                const configSiteId =
                  image.source === "admin"
                    ? service.admins.siteId
                    : service.siteId;
                const configDriveId =
                  image.source === "admin"
                    ? service.admins.driveId
                    : service.driveId;

                const { url, token } = await service.getFile(
                  configSiteId,
                  configDriveId,
                  image.itemId
                );
                const response = await fetch(url, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const blob = await response.blob();

                return {
                  ...image,
                  preview: URL.createObjectURL(blob),
                };
              } catch (error) {
                console.error(
                  `Error loading preview for ${image.fileName}:`,
                  error
                );
                return image;
              }
            })
        );

        setFileState({
          description: {
            existing:
              documents.find((doc) => doc.documentType === "description") ||
              null,
            fileName:
              documents.find((doc) => doc.documentType === "description")
                ?.fileName || null,
            toDelete: false,
          },
          serviceTickets: {
            existing: documents.filter(
              (doc) => doc.documentType === "serviceTicket"
            ),
            toDelete: [],
          },
          adminDocs: {
            existing: documents.filter(
              (doc) => doc.documentType === "administrative"
            ),
            toDelete: [],
          },
          images: {
            existing: loadedImages,
            toDelete: [],
          },
        });
      } catch (error) {
        console.error("Error loading files:", error);
        setErrors((prev) => ({
          ...prev,
          files: "Error loading existing files",
        }));
      }
    };

    loadExistingFiles();

    // Cleanup function for object URLs
    return () => {
      fileState.images.existing.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [initialData?.id, service]);

  // Load initial form data
  useEffect(() => {
    if (initialData) {
      const site = sites.find((s) => s.id === initialData.siteId);
      const building = site
        ? buildings.find((b) => b.id === site.buildingId)
        : null;

      setFormData({
        st: initialData.stNumber || "",
        scope: initialData.scope || "",
        companyId: building?.companyId || "",
        buildingId: site?.buildingId || "",
        siteId: initialData.siteId || "",
        systemId: initialData.systemId || "",
        type: initialData.type || "",
      });
    }
  }, [initialData, buildings, sites]);

  // Filter buildings based on selected company
  const filteredBuildings = buildings.filter(
    (building) => building.companyId === formData.companyId
  );

  // Filter sites based on selected building
  const filteredSites = sites.filter(
    (site) => site.buildingId === formData.buildingId
  );

  // Get available systems for selected site
  const availableSystems = formData.siteId
    ? sites.find((site) => site.id === formData.siteId)?.systems || []
    : [];

  const filteredSystems = systems.filter((system) =>
    availableSystems.some(
      (availableSystem) => availableSystem.LookupValue === system.name
    )
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Reset dependent fields when parent selection changes
      if (name === "companyId") {
        newData.buildingId = "";
        newData.siteId = "";
        newData.systemId = "";
      } else if (name === "buildingId") {
        newData.siteId = "";
        newData.systemId = "";
      } else if (name === "siteId") {
        newData.systemId = "";
      }

      return newData;
    });
  };

  // File management handlers
  const handleToggleDeleteExisting = (category, index = null) => {
    setFileState((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        toDelete:
          index === null
            ? !prev[category].toDelete // For single files like description
            : prev[category].toDelete.includes(index)
            ? prev[category].toDelete.filter((i) => i !== index)
            : [...prev[category].toDelete, index],
      },
    }));
  };

  // File preview handlers
  const handlePreviewFile = async (file) => {
    if (!file) return;

    setPreviewLoading(true);
    try {
      const configSiteId =
        file.source === "admin" ? service.admins.siteId : service.siteId;
      const configDriveId =
        file.source === "admin" ? service.admins.driveId : service.driveId;

      const { url, token } = await service.getFile(
        configSiteId,
        configDriveId,
        file.itemId
      );

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      setSelectedPreview({
        name: file.fileName,
        type: file.type,
      });
      setImageUrl(blobUrl);
    } catch (error) {
      console.error("Error loading preview:", error);
      setErrors((prev) => ({
        ...prev,
        preview: "Error loading preview",
      }));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    setSelectedPreview(null);
  };

  const handleDownloadFile = async (file) => {
    try {
      const configSiteId =
        file.source === "admin" ? service.admins.siteId : service.siteId;
      const configDriveId =
        file.source === "admin" ? service.admins.driveId : service.driveId;

      const { url, token } = await service.getFile(
        configSiteId,
        configDriveId,
        file.itemId
      );

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error downloading file");

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      setErrors((prev) => ({
        ...prev,
        download: "Error downloading file",
      }));
    }
  };

  // Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (processing) return;

    try {
      // Prepare files data
      const filesToDelete = [];
      const filesToUpload = [];

      // Handle description file
      if (fileState.description.toDelete && fileState.description.existing) {
        filesToDelete.push(fileState.description.existing.itemId);
      }
      if (descriptionFile.files[0]) {
        filesToUpload.push({
          type: "description",
          file: descriptionFile.files[0],
        });
      }

      // Handle service tickets
      fileState.serviceTickets.toDelete.forEach((index) => {
        filesToDelete.push(fileState.serviceTickets.existing[index].itemId);
      });
      serviceTicketsFiles.files.forEach((file) => {
        filesToUpload.push({
          type: "serviceTicket",
          file,
        });
      });

      // Handle admin docs
      fileState.adminDocs.toDelete.forEach((index) => {
        filesToDelete.push(fileState.adminDocs.existing[index].itemId);
      });
      adminDocsFiles.files.forEach((file) => {
        filesToUpload.push({
          type: "administrative",
          file,
        });
      });

      // Handle images
      fileState.images.toDelete.forEach((index) => {
        filesToDelete.push(fileState.images.existing[index].itemId);
      });
      imagesFiles.images.forEach((image) => {
        filesToUpload.push({
          type: "image",
          file: image.file,
        });
      });

      // Submit everything
      await onSubmit(initialData.id, {
        ...formData,
        filesToDelete,
        filesToUpload,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Error submitting form",
      }));
    }
  };

  const isAdmin = userRole?.role === "Administrativo";

  return (
    <form id="ticketForm" onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            ST *
          </label>
          <input
            type="text"
            name="st"
            value={formData.st}
            onChange={handleInputChange}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.st && "border-error focus:border-error focus:ring-error"
            )}
            placeholder="Número de ST"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Tipo de Servicio *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.type && "border-error focus:border-error focus:ring-error"
            )}
            required
          >
            <option value="">Seleccione un tipo</option>
            <option value="Correctiva">Correctiva</option>
            <option value="Preventiva">Preventiva</option>
          </select>
        </div>
      </div>

      {/* Scope */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Alcance *</label>
        <textarea
          name="scope"
          value={formData.scope}
          onChange={handleInputChange}
          className={cn(
            "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
            errors.scope && "border-error focus:border-error focus:ring-error"
          )}
          rows={4}
          placeholder="Describa el alcance del trabajo"
          required
        />
      </div>

      {/* Location Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Empresa *</label>
          <select
            name="companyId"
            value={formData.companyId}
            onChange={handleInputChange}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.companyId &&
                "border-error focus:border-error focus:ring-error"
            )}
            required
          >
            <option value="">Seleccione una empresa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Edificio *
          </label>
          <select
            name="buildingId"
            value={formData.buildingId}
            onChange={handleInputChange}
            disabled={!formData.companyId}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary disabled:bg-gray-100",
              errors.buildingId &&
                "border-error focus:border-error focus:ring-error"
            )}
            required
          >
            <option value="">Seleccione un edificio</option>
            {filteredBuildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sitio *</label>
          <select
            name="siteId"
            value={formData.siteId}
            onChange={handleInputChange}
            disabled={!formData.buildingId}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary disabled:bg-gray-100",
              errors.siteId &&
                "border-error focus:border-error focus:ring-error"
            )}
            required
          >
            <option value="">Seleccione un sitio</option>
            {filteredSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sistema *</label>
          <select
            name="systemId"
            value={formData.systemId}
            onChange={handleInputChange}
            disabled={!formData.siteId}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary disabled:bg-gray-100",
              errors.systemId &&
                "border-error focus:border-error focus:ring-error"
            )}
            required
          >
            <option value="">Seleccione un sistema</option>
            {filteredSystems.map((system) => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File Management Section */}
      <div className="space-y-6">
        {/* Description File Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Descripción
          </label>

          {/* Show existing description file if any */}
          {fileState.description.existing &&
            !fileState.description.toDelete && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-sm">
                  {fileState.description.fileName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePreviewFile(fileState.description.existing)
                    }
                    className="p-1 text-gray-500 hover:text-primary transition-colors"
                    title="Ver archivo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadFile(fileState.description.existing)
                    }
                    className="p-1 text-gray-500 hover:text-primary transition-colors"
                    title="Descargar archivo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleDeleteExisting("description")}
                    className="text-sm text-error hover:text-error/80"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}

          {/* Show file upload if no existing file or marked for deletion */}
          {(!fileState.description.existing ||
            fileState.description.toDelete) && (
            <MultiFileUpload
              files={descriptionFile.files}
              onFilesChange={descriptionFile.addFiles}
              onRemove={() => descriptionFile.clearFiles()}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              error={errors.description}
            />
          )}
        </div>

        {/* Service Tickets Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Boletas de Servicio
          </label>

          {/* Existing service tickets */}
          {fileState.serviceTickets.existing.length > 0 && (
            <div className="space-y-2">
              {fileState.serviceTickets.existing.map((ticket, index) => (
                <div
                  key={ticket.itemId}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg",
                    fileState.serviceTickets.toDelete.includes(index)
                      ? "bg-error/5"
                      : "bg-gray-50"
                  )}
                >
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-sm">{ticket.fileName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleDeleteExisting("serviceTickets", index)
                    }
                    className="text-sm text-error hover:text-error/80"
                  >
                    {fileState.serviceTickets.toDelete.includes(index)
                      ? "Restaurar"
                      : "Eliminar"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New service tickets upload */}
          <MultiFileUpload
            files={serviceTicketsFiles.files}
            onFilesChange={serviceTicketsFiles.addFiles}
            onRemove={serviceTicketsFiles.removeFile}
            maxFiles={5}
            maxSize={10 * 1024 * 1024}
            error={errors.serviceTickets}
          />
        </div>

        {/* Images Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Imágenes
          </label>

          {/* Existing images */}
          {fileState.images.existing.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {fileState.images.existing.map((image, index) => {
                const isDeleting = fileState.images.toDelete.includes(index);
                return (
                  <div
                    key={image.itemId}
                    className={cn(
                      "relative group aspect-square",
                      isDeleting && "opacity-50"
                    )}
                  >
                    <div className="relative w-full h-full bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden border hover:border-primary transition-colors">
                      <button
                        type="button"
                        onClick={() => !isDeleting && handlePreviewFile(image)}
                        className="w-full h-full"
                      >
                        <div className="relative w-full h-full flex items-center justify-center">
                          {image.preview ? (
                            <img
                              src={image.preview}
                              alt={image.fileName}
                              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        </div>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleDeleteExisting("images", index)
                      }
                      className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-lg hover:bg-error/90 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* New images upload */}
          <MultiImageUpload
            images={imagesFiles.images}
            onImagesChange={imagesFiles.addImages}
            onRemove={imagesFiles.removeImage}
            maxImages={5}
            processing={imagesFiles.processing}
            error={errors.images}
          />
        </div>

        {/* Admin Docs Section - Only visible to admins */}
        {isAdmin && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos Administrativos
            </label>

            {/* Existing admin docs */}
            {fileState.adminDocs.existing.length > 0 && (
              <div className="space-y-2">
                {fileState.adminDocs.existing.map((doc, index) => (
                  <div
                    key={doc.itemId}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg",
                      fileState.adminDocs.toDelete.includes(index)
                        ? "bg-error/5"
                        : "bg-gray-50"
                    )}
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm">{doc.fileName}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleDeleteExisting("adminDocs", index)
                      }
                      className="text-sm text-error hover:text-error/80"
                    >
                      {fileState.adminDocs.toDelete.includes(index)
                        ? "Restaurar"
                        : "Eliminar"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New admin docs upload */}
            <MultiFileUpload
              files={adminDocsFiles.files}
              onFilesChange={adminDocsFiles.addFiles}
              onRemove={adminDocsFiles.removeFile}
              onDisplayNameChange={(index, name) => {
                const newFiles = [...adminDocsFiles.files];
                newFiles[index].displayName = name;
                adminDocsFiles.setFiles(newFiles);
              }}
              showDisplayName={true}
              maxFiles={5}
              maxSize={20 * 1024 * 1024}
              error={errors.adminDocs}
              disabled={processing}
            />
          </div>
        )}

        {/* General error message */}
        {errors.submit && (
          <div className="p-4 bg-error/10 text-error rounded-lg">
            {errors.submit}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedPreview && imageUrl && (
        <ImageModal
          imageUrl={imageUrl}
          alt={selectedPreview.name}
          onClose={handleClosePreview}
          loading={previewLoading}
        />
      )}
    </form>
  );
};

export default TicketEditForm;
