import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { POST_VENTA_ROUTES } from "../../../../routes";
import { usePostVentaManagement } from "../../../../context/postVentaManagementContext";
import { Loader2, AlertCircle, Image } from "lucide-react";

import Card from "../../../../../../components/common/Card";
import Button from "../../../../../../components/common/Button";
import MultiFileUpload from "../../../../../../components/common/MultiFileUpload";
import MultiImageUpload from "../../../../../../components/common/MultiImageUpload";
import { useFileManagement } from "../../hooks/useFileManagement";
import { useImageManagement } from "../../hooks/useImageManagement";
import { generateRandomNumber } from "../../../../../../utils/randomUtils";
import emailConfig from "../../../../../expenseAudit/config/expenseAudit.config";


const TicketForm = () => {
  const navigate = useNavigate();
  const { companies, buildings, sites, systems, service, loadPostVentaData } =
    usePostVentaManagement();

  const [stPreview, setStPreview] = useState("");

  const [formData, setFormData] = useState({
    st: "",
    scope: "",
    companyId: "",
    buildingId: "",
    siteId: "",
    systemId: "",
    type: "",
  });

  const supportEmail = emailConfig.supportEmail;
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (formData.type === "Correctiva") {
      // Only show a preview of what the ST number will look like
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      setStPreview(`${year}${month}-3xxx`);
    } else {
      setStPreview("");
    }
  }, [formData.type]);

  // File management hooks
  const {
    files: adminDocs = [],
    addFiles: addAdminDocs,
    removeFile: removeAdminDoc,
    updateDisplayName: updateAdminDocName,
    error: adminDocsError,
  } = useFileManagement();

  const {
    images,
    processing: processingImages,
    error: imagesError,
    addImages,
    removeImage,
  } = useImageManagement({
    generateNames: true,
    namePrefix: "image - ",
  });

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

    // Special handling for type field
    if (name === "type") {
      setFormData((prev) => {
        const newData = {
          ...prev,
          [name]: value,
          // Clear ST field when switching to Correctiva
          st: value === "Correctiva" ? "" : prev.st
        };

        return newData;
      });
    } else if (name === "st" && formData.type === "Correctiva") {
      // Prevent changes to ST field if type is Correctiva
      return;
    } else {
      // Regular field handling with dependent field reset logic
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
    }
  };

  const validateForm = () => {
    if (formData.type !== "Correctiva" && !formData.st.trim()) {
      return "El número de ST es requerido";
    }

    if (!formData.scope.trim()) {
      return "El alcance es requerido";
    }

    if (!formData.companyId) {
      return "La empresa es requerida";
    }

    if (!formData.buildingId) {
      return "El edificio es requerido";
    }

    if (!formData.siteId) {
      return "El sitio es requerido";
    }

    if (!formData.systemId) {
      return "El sistema es requerido";
    }

    if (!formData.type) {
      return "El tipo es requerido";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get next ST number if ticket type is Correctiva
      let finalFormData = { ...formData };

      if (formData.type === "Correctiva") {
        const stNumber = await service.getNextSTNumber();
        finalFormData.st = stNumber;
      }

      const site = sites.find((s) => s.id === finalFormData.siteId);
      const building = buildings.find((b) => b.id === site.buildingId);
      const company = companies.find((c) => c.id === building.companyId);

      const trimmedData = {
        ...finalFormData,
        st: finalFormData.st.trim(),
        scope: finalFormData.scope.trim(),
      };

      // Create ticket with all references
      const response = await service.createServiceTicket({
        ...trimmedData,
      });

      //Upload images
      let imageLinks = [];
      if (images.length > 0) {
        imageLinks = await Promise.all(
          images.map(async (image) => {
            const uploadResponse = await service.uploadTicketDocument(
              response.id,
              image.file,
              "image",
              image.name
            );

            const shareLink = await service.createShareLink(
              service.siteId,
              uploadResponse.itemId,
              "view",
              "organization"
            );

            return {
              name: image.name,
              link: shareLink.webUrl,
              id: uploadResponse.itemId,
            };
          })
        );
      }

      // Upload admin docs and create share links
      const adminFileLinks = await Promise.all(
        adminDocs.map(async (doc) => {
          let displayName =
            doc.displayName || doc.file.name.split(".").slice(0, -1).join(".");
          const uploadResponse = await service.uploadTicketDocument(
            response.id,
            doc.file,
            "administrative",
            `${displayName} - ${generateRandomNumber(16).toString()}`
          );

          const shareLink = await service.createShareLink(
            service.admins.siteId,
            uploadResponse.itemId,
            "view",
            "organization"
          );

          return {
            name: doc.displayName || doc.file.name,
            link: shareLink.webUrl,
            id: uploadResponse.itemId,
          };
        })
      );

      // Create email content with admin docs
      const emailContent = generateEmailContent({
        st: finalFormData.st,
        type: finalFormData.type,
        scope: finalFormData.scope,
        system: systems.find((s) => s.id === finalFormData.systemId)?.name,
        company: company.name,
        building: building.name,
        site: site.name,
        siteDetails: {
          location: site.location,
          contactName: site.contactName,
          contactEmail: site.contactEmail,
          contactPhone: site.contactPhone,
        },
        images: imageLinks,
        adminDocs: adminFileLinks,
      });

      // Send email with links
      await service.sendEmail({
        toRecipients: [supportEmail],
        subject: `ST ${finalFormData.st} / ${company.name} / ${finalFormData.type} / ${systems.find((s) => s.id === finalFormData.systemId)?.name
          }`,
        content: emailContent,
      });

      await loadPostVentaData();
      navigate(POST_VENTA_ROUTES.TICKETS.LIST);
    } catch (err) {
      console.error("Error creating ticket:", err);
      setError(err.message || "Error al crear el ticket");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Card title="Nuevo Ticket de Servicio">
        {error && (
          <div className="mb-6 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tipo de Servicio *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                required
              >
                <option value="">Seleccione un tipo</option>
                <option value="Correctiva">Correctiva</option>
                <option value="Preventiva">Preventiva</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                ST *
              </label>
              <input
                type="text"
                name="st"
                value={formData.type === "Correctiva" ? stPreview : formData.st}
                onChange={handleInputChange}
                className={`w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary ${formData.type === "Correctiva" ? "bg-gray-100" : ""
                  }`}
                placeholder="Número de ST"
                readOnly={formData.type === "Correctiva"}
                required
              />
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Alcance *
            </label>
            <textarea
              name="scope"
              value={formData.scope}
              onChange={handleInputChange}
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              rows={4}
              placeholder="Describa el alcance del trabajo"
              required
            />
          </div>

          {/* Location Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Empresa *
              </label>
              <select
                name="companyId"
                value={formData.companyId}
                onChange={handleInputChange}
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
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
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary disabled:bg-gray-100"
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
              <label className="text-sm font-medium text-gray-700">
                Sitio *
              </label>
              <select
                name="siteId"
                value={formData.siteId}
                onChange={handleInputChange}
                disabled={!formData.buildingId}
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary disabled:bg-gray-100"
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
              <label className="text-sm font-medium text-gray-700">
                Sistema *
              </label>
              <select
                name="systemId"
                value={formData.systemId}
                onChange={handleInputChange}
                disabled={!formData.siteId}
                className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary disabled:bg-gray-100"
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

          {/* Images Files */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Imágenes
            </label>
            <MultiImageUpload
              images={images}
              onImagesChange={addImages}
              onRemove={removeImage}
              maxImages={5}
              processing={processingImages}
              error={imagesError}
            />
          </div>

          {/* Administrative Documents */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Documentos Administrativos
            </label>
            <MultiFileUpload
              files={adminDocs}
              onFilesChange={addAdminDocs}
              onRemove={removeAdminDoc}
              onDisplayNameChange={updateAdminDocName}
              showDisplayName={true}
              maxSize={20 * 1024 * 1024}
              maxFiles={5}
              error={adminDocsError}
              disabled={processing}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(POST_VENTA_ROUTES.TICKETS.LIST)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando ticket...
                </>
              ) : (
                "Crear Ticket"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const generateEmailContent = ({
  st,
  type,
  scope,
  system,
  company,
  building,
  site,
  siteDetails,
  images,
  adminDocs,
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
            }
            .header {
                background-color: #00008B;
                color: white;
                padding: 20px;
                border-radius: 6px 6px 0 0;
                margin: -20px -20px 20px -20px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .section {
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 6px;
            }
            .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #00008B;
                margin-bottom: 15px;
                border-bottom: 2px solid #e0e0e0;
                padding-bottom: 5px;
            }
            .info-row {
                display: block;
                margin-bottom: 8px;
            }
            .label {
                font-weight: bold;
                color: #555555;
            }
            .value {
                color: #333333;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Nueva ST Ingresada</h1>
            </div>
            
            <div class="section">
                <div class="section-title">Información del Ticket</div>
                <div class="info-row">
                    <span class="label">ST:</span>
                    <span class="value">${st}</span>
                </div>
                <div class="info-row">
                    <span class="label">Tipo:</span>
                    <span class="value">${type}</span>
                </div>
                <div class="info-row">
                    <span class="label">Alcance:</span>
                    <span class="value">${scope}</span>
                </div>
                ${images.length > 0
      ? `
                <div class="section">
                    <div class="section-title">Imágenes</div>
                    ${images
        .map(
          (image) => `
                        <div class="info-row">
                            <span class="label">${image.name}:</span>
                            <span class="value">
                                <a href="${image.link}">Ver imagen</a>
                            </span>
                        </div>
                        `
        )
        .join("")}
                </div>
                `
      : ""
    }
            </div>

            <div class="section">
                <div class="section-title">Ubicación</div>
                <div class="info-row">
                    <span class="label">Empresa:</span>
                    <span class="value">${company}</span>
                </div>
                <div class="info-row">
                    <span class="label">Edificio:</span>
                    <span class="value">${building}</span>
                </div>
                <div class="info-row">
                    <span class="label">Sitio:</span>
                    <span class="value">${site}</span>
                </div>
                ${siteDetails.location
      ? `
                <div class="info-row">
                    <span class="label">Ubicación:</span>
                    <span class="value">${siteDetails.location}</span>
                </div>
                `
      : ""
    }
            </div>

            <div class="section">
                <div class="section-title">Sistema</div>
                <div class="info-row">
                    <span class="label">Sistema Afectado:</span>
                    <span class="value">${system}</span>
                </div>
            </div>

            ${siteDetails.contactName ||
      siteDetails.contactEmail ||
      siteDetails.contactPhone
      ? `
            <div class="section">
                <div class="section-title">Información de Contacto</div>
                ${siteDetails.contactName
        ? `
                <div class="info-row">
                    <span class="label">Contacto:</span>
                    <span class="value">${siteDetails.contactName}</span>
                </div>
                `
        : ""
      }
                ${siteDetails.contactEmail
        ? `
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${siteDetails.contactEmail}</span>
                </div>
                `
        : ""
      }
                ${siteDetails.contactPhone
        ? `
                <div class="info-row">
                    <span class="label">Teléfono:</span>
                    <span class="value">${siteDetails.contactPhone}</span>
                </div>
                `
        : ""
      }
            </div>
            `
      : ""
    }

            ${adminDocs.length > 0
      ? `
            <div class="section">
                <div class="section-title">Documentos Administrativos</div>
                ${adminDocs
        .map(
          (doc) => `
                <div class="info-row">
                    <span class="label">${doc.name}:</span>
                    <span class="value">
                        <a href="${doc.link}">Ver documento</a>
                    </span>
                </div>
                `
        )
        .join("")}
            </div>
            `
      : ""
    }
        </div>
    </body>
    </html>
  `;
};

export default TicketForm;
