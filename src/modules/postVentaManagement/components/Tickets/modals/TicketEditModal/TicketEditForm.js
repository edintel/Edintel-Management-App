import React, { useState, useEffect, useMemo } from "react";
import { usePostVentaManagement } from "../../../../context/postVentaManagementContext";
import { Loader2, FileText, X } from "lucide-react";
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
  const [formData, setFormData] = useState({
    st: "",
    scope: "",
    companyId: "",
    buildingId: "",
    siteId: "",
    systemId: "",
    type: "",
    link: "",
    waitingEquiment: false,
  });
  // File management state structure
  const [fileState, setFileState] = useState({
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

  // Sort companies alphabetically
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => a.name.localeCompare(b.name));
  }, [companies]);

  // Filter buildings based on selected company and sort alphabetically
  const filteredBuildings = useMemo(() => {
    return buildings
      .filter((building) => building.companyId === formData.companyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [buildings, formData.companyId]);

  // Filter sites based on selected building and sort alphabetically
  const filteredSites = useMemo(() => {
    return sites
      .filter((site) => site.buildingId === formData.buildingId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sites, formData.buildingId]);

  // Get available systems for selected site and sort alphabetically
  const availableSystems = useMemo(() => {
    if (!formData.siteId) return [];
    return sites.find((site) => site.id === formData.siteId)?.systems || [];
  }, [sites, formData.siteId]);

  const filteredSystems = useMemo(() => {
    return systems
      .filter((system) =>
        availableSystems.some(
          (availableSystem) => availableSystem.LookupValue === system.name
        )
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [systems, availableSystems]);

  const getDeleteButtonStyle = (isDeleted) => {
    return cn(
      "text-sm font-medium",
      isDeleted ? "text-primary hover:text-primary/80" : "text-error hover:text-error/80"
    );
  };

  useEffect(() => {
    const loadExistingFiles = async () => {
      if (!initialData?.id) return;
      try {
        const documents = await service.getTicketDocuments(initialData.id);
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
        setFileState(prev => ({
          serviceTickets: {
            existing: documents.filter(doc => doc.documentType === "serviceTicket"),
            toDelete: prev.serviceTickets.toDelete || []
          },
          adminDocs: {
            existing: documents.filter(doc => doc.documentType === "administrative"),
            toDelete: prev.adminDocs.toDelete || []
          },
          images: {
            existing: loadedImages,
            toDelete: prev.images.toDelete || []
          }
        }));
      } catch (error) {
        console.error("Error loading files:", error);
        setErrors((prev) => ({
          ...prev,
          files: "Error loading existing files",
        }));
      }
    };
    if (initialData?.id && fileState.serviceTickets.existing.length === 0) {
      loadExistingFiles();
    }
    return () => {
      fileState.images.existing.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [initialData?.id, service, fileState.images.existing, fileState.serviceTickets.existing.length]);

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
        link: initialData.link || "",
        waitingEquiment: initialData.waitingEquiment ,
      });
    }
  }, [initialData, buildings, sites]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;


    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
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
  const handleToggleDeleteExisting = (category, index) => {
    setFileState(prev => {
      const newState = { ...prev };
      // Create a new array to avoid mutating the previous state
      newState[category] = {
        ...prev[category],
        toDelete: [...prev[category].toDelete]
      };
      // Toggle deletion state
      if (newState[category].toDelete.includes(index)) {
        // Remove from toDelete array
        newState[category].toDelete = newState[category].toDelete.filter(i => i !== index);
      } else {
        // Add to toDelete array
        newState[category].toDelete.push(index);
      }
      return newState;
    });
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

  const handleSubmit = async (e) => {
    console.log("Form antes de guarde", formData);
    e.preventDefault();
    if (processing) return;
    try {
      const filesToDelete = [];
      fileState.serviceTickets.toDelete.forEach((index) => {
        const file = fileState.serviceTickets.existing[index];
        if (file?.itemId) filesToDelete.push(file.itemId);
      });
      fileState.adminDocs.toDelete.forEach((index) => {
        const file = fileState.adminDocs.existing[index];
        if (file?.itemId) filesToDelete.push(file.itemId);
      });
      fileState.images.toDelete.forEach((index) => {
        const file = fileState.images.existing[index];
        if (file?.itemId) filesToDelete.push(file.itemId);
      });
      const filesToUpload = [];
      serviceTicketsFiles.files.forEach((file) => {
        filesToUpload.push({
          type: "serviceTicket",
          file: file,
          displayName: file.displayName
        });
      });
      adminDocsFiles.files.forEach((file) => {
        filesToUpload.push({
          type: "administrative",
          file: file,
          displayName: file.displayName
        });
      });
      imagesFiles.images.forEach((image) => {
        filesToUpload.push({
          type: "image",
          file: image.file
        });
      });
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
      {/* Basic Info */}
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
            <option value="Correctiva-No Cobrable">Correctiva-No Cobrable</option>
            <option value="Correctiva-Cobrable">Correctiva-Cobrable</option>
            <option value="Preventiva">Preventiva</option>
          </select>
        </div>
      </div>
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
      
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="waitingEquiment"
            checked={formData.waitingEquiment}
            onChange={handleInputChange}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">
            Ticket esperando equipo
          </span>
        </label>
        <p className="text-xs text-gray-500 ml-6">
          Marque esta opción si el ticket está en espera de equipos o materiales
        </p>
      </div>

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
            {sortedCompanies.map((company) => (
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Link al SharePoint
          </label>
          <input
            name="link"
            value={formData.link}
            onChange={handleInputChange}
            className="w-full font-light rounded-lg border-gray-700 focus:border-primary focus:ring-primary disabled:bg-gray-100"
          >
          </input>
        </div>
      </div>
      {/* File Management Section */}
      <div className="space-y-6">
        {/* Service Tickets */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Boletas de Servicio
          </label>
          {/* Existing Service Tickets */}
          {fileState.serviceTickets.existing.map((ticket, index) => (
            <div
              key={ticket.itemId}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg",
                fileState.serviceTickets.toDelete.includes(index)
                  ? "bg-error/5 text-error"
                  : "bg-gray-50"
              )}
            >
              <FileText className={cn(
                "w-4 h-4",
                fileState.serviceTickets.toDelete.includes(index) ? "text-error" : "text-gray-400"
              )} />
              <span className="flex-1 text-sm">{ticket.fileName}</span>
              <button
                type="button"
                onClick={() => handleToggleDeleteExisting("serviceTickets", index)}
                className={getDeleteButtonStyle(fileState.serviceTickets.toDelete.includes(index))}
              >
                {fileState.serviceTickets.toDelete.includes(index) ? "Restaurar" : "Eliminar"}
              </button>
            </div>
          ))}
          {/* Upload New Service Tickets */}
          <MultiFileUpload
            files={serviceTicketsFiles.files}
            onFilesChange={serviceTicketsFiles.addFiles}
            onRemove={serviceTicketsFiles.removeFile}
            maxFiles={5}
            maxSize={10 * 1024 * 1024}
            error={errors.serviceTickets}
          />
        </div>
        {/* Images */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Imágenes
          </label>
          {/* Existing Images */}
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
                    <div className={cn(
                      "relative w-full h-full bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden border transition-colors",
                      isDeleting ? "border-error" : "hover:border-primary"
                    )}>
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
                      onClick={() => handleToggleDeleteExisting("images", index)}
                      className={cn(
                        "absolute -top-2 -right-2 p-1 rounded-full shadow-lg",
                        isDeleting ? "bg-primary text-white" : "bg-error text-white"
                      )}
                    >
                      {isDeleting ? (
                        <X size={16} />
                      ) : (
                        <X size={16} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {/* Upload New Images */}
          <MultiImageUpload
            images={imagesFiles.images}
            onImagesChange={imagesFiles.addImages}
            onRemove={imagesFiles.removeImage}
            maxImages={5}
            processing={imagesFiles.processing}
            error={errors.images}
          />
        </div>
        {/* Admin Documents (only for admins) */}
        {isAdmin && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos Administrativos
            </label>
            {/* Existing Admin Docs */}
            {fileState.adminDocs.existing.length > 0 && (
              <div className="space-y-2">
                {fileState.adminDocs.existing.map((doc, index) => (
                  <div
                    key={doc.itemId}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg",
                      fileState.adminDocs.toDelete.includes(index)
                        ? "bg-error/5 text-error"
                        : "bg-gray-50"
                    )}
                  >
                    <FileText className={cn(
                      "w-4 h-4",
                      fileState.adminDocs.toDelete.includes(index) ? "text-error" : "text-gray-400"
                    )} />
                    <span className="flex-1 text-sm">{doc.fileName}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleDeleteExisting("adminDocs", index)}
                      className={getDeleteButtonStyle(fileState.adminDocs.toDelete.includes(index))}
                    >
                      {fileState.adminDocs.toDelete.includes(index) ? "Restaurar" : "Eliminar"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Upload New Admin Docs */}
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
        {/* Error Messages */}
        {errors.submit && (
          <div className="p-4 bg-error/10 text-error rounded-lg">
            {errors.submit}
          </div>
        )}
      </div>
      {/* Image Preview Modal */}
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