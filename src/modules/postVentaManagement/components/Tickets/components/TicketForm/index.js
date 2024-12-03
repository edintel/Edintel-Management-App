import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostVentaManagement } from '../../../../context/postVentaManagementContext';
import { POST_VENTA_ROUTES } from '../../../../routes';
import Card from '../../../../../../components/common/Card';
import Button from '../../../../../../components/common/Button';
import { Save, Loader2, AlertTriangle, X, FileText } from 'lucide-react';

// Form Components
import LocationSelect from './components/LocationSelect';
import SystemSelect from './components/SystemSelect';
import FileUpload from './components/FileUpload';

const TicketForm = () => {
  const navigate = useNavigate();
  const {
    companies,
    buildings,
    sites,
    systems,
    service,
    loading: contextLoading,
    loadPostVentaData,
  } = usePostVentaManagement();

  const [formData, setFormData] = useState({
    st: '',
    scope: '',
    location: {
      companyId: '',
      buildingId: '',
      siteId: '',
    },
    systemId: '',
    type: '',
    description: null,
    adminFiles: [] // New state for administrative files
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableSystems = formData.location.siteId ?
    sites.find(site => site.id === formData.location.siteId)?.systems : [];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.st.trim()) {
      newErrors.st = 'El número de ST es requerido';
    }

    if (!formData.location.companyId) {
      newErrors.location = { ...newErrors.location, companyId: 'Seleccione una empresa' };
    }

    if (!formData.location.buildingId) {
      newErrors.location = { ...newErrors.location, buildingId: 'Seleccione un edificio' };
    }

    if (!formData.location.siteId) {
      newErrors.location = { ...newErrors.location, siteId: 'Seleccione un sitio' };
    }

    if (!formData.systemId) {
      newErrors.systemId = 'Seleccione un sistema';
    }

    if (!formData.type) {
      newErrors.type = 'Seleccione un tipo de servicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // New function to handle adding admin files
  const handleAdminFileAdd = (file, adminType) => {
    setFormData(prev => ({
      ...prev,
      adminFiles: [...prev.adminFiles, { file, type: adminType }]
    }));
  };

  // New function to remove admin files
  const handleAdminFileRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      adminFiles: prev.adminFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const site = sites.find(s => s.id === formData.location.siteId);
      const building = buildings.find(b => b.id === site.buildingId);
      const company = companies.find(c => c.id === building.companyId);

      // Create ticket and get response which includes the description file ID
      const newTicket = await service.createServiceTicket(
        {
          st: formData.st,
          scope: formData.scope,
          siteId: formData.location.siteId,
          systemId: formData.systemId,
          type: formData.type,
          siteName: site.name,
          companyName: company.name,
          buildingName: building.name,
        },
        formData.description
      );

      // Upload admin files and collect their share links
      const adminFileResults = await Promise.all(
        formData.adminFiles.map(async ({ file, type }) => {
          const fileId = await service.uploadFile(
            service.config.admins.siteId,
            service.config.admins.driveId,
            file,
            `/Boletas ST/${company.name}/${building.name}/${site.name}/${formData.st}`,
            `${type}_${Date.now()}`
          );

          // Create list item in docsAdmins
          await service.client
            .api(`/sites/${service.config.admins.siteId}/lists/${service.config.admins.lists.docsAdmins}/items`)
            .post({
              fields: {
                ticketId: newTicket.id,
                fileName: type,
                itemId: fileId,
                documentType: 'administrative'
              }
            });

          const shareLink = await service.createShareLink(
            service.config.admins.siteId,
            fileId,
            "view",
            "organization"
          );

          return {
            type,
            webUrl: shareLink.webUrl
          };
        })
      );

      let shareLink = null;
      if (formData.description) {
        // Create shareable link for the description file
        shareLink = await service.createShareLink(
          service.siteId,
          newTicket.fields.Descripci_x00f3_n,
          "view",
          "organization"
        );
        console.log("xd")
      }
      // Prepare email content
      const emailContent = `
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
        .contact-info {
            background-color: #f0f4f8;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #00008B;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 10px;
        }
        .button:hover {
            background-color: #000066;
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
                <span class="value">${formData.st}</span>
            </div>
            <div class="info-row">
                <span class="label">Tipo:</span>
                <span class="value">${formData.type}</span>
                
            </div>
            <div class="info-row">
                <span class="label">Alcance:</span>
                <span class="value">${formData.scope}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Ubicación</div>
            <div class="info-row">
                <span class="label">Empresa:</span>
                <span class="value">${company.name}</span>
            </div>
            <div class="info-row">
                <span class="label">Edificio:</span>
                <span class="value">${building.name}</span>
            </div>
            <div class="info-row">
                <span class="label">Sitio:</span>
                <span class="value">${site.name}</span>
            </div>
            ${site.location ? `
            <div class="info-row">
                <span class="label">Ubicación:</span>
                <span class="value">${site.location}</span>
            </div>
            ` : ''}
        </div>

        <div class="section">
            <div class="section-title">Sistema</div>
            <div class="info-row">
                <span class="label">Sistema Afectado:</span>
                <span class="value">${systems.find(s => s.id === formData.systemId)?.name}</span>
            </div>
        </div>

        ${site.contactName || site.contactEmail || site.contactPhone ? `
        <div class="section">
            <div class="section-title">Información de Contacto</div>
            ${site.contactName ? `
            <div class="info-row">
                <span class="label">Contacto:</span>
                <span class="value">${site.contactName}</span>
            </div>
            ` : ''}
            ${site.contactEmail ? `
            <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${site.contactEmail}</span>
            </div>
            ` : ''}
            ${site.contactPhone ? `
            <div class="info-row">
                <span class="label">Teléfono:</span>
                <span class="value">${site.contactPhone}</span>
            </div>
            ` : ''}
        </div>
        ` : ''}

        ${shareLink?.webUrl ? `
        <div class="section">
            <div class="section-title">Descripción</div>
            <a href="${shareLink.webUrl}" class="button">Ver descripción completa</a>
        </div>
        ` : ''}
        ${adminFileResults.length > 0 ? `
          <div class="section">
              <div class="section-title">Archivos Administrativos</div>
              ${adminFileResults.map(file => `
                  <div class="info-row">
                      <span class="label">${file.type}:</span>
                      <span class="value">
                          <a href="${file.webUrl}">Ver documento</a>
                      </span>
                  </div>
              `).join('')}
          </div>
          ` : ''}
    </div>
</body>
</html>
`;

      // Send notification email
      const messageId = await service.sendEmail({
        toRecipients: ['andres.villalobos@edintel.com'],
        subject: `ST ${formData.st} / ${company.name} / ${formData.type} / ${systems.find(s => s.id === formData.systemId)?.name}`,
        content: emailContent
      });

      await service.client
        .api(encodeURIComponent(`/sites/${service.siteId}/lists/${service.config.lists.controlPV}/items/${newTicket.id}`))
        .patch({
          fields: {
            MessageId: messageId // Assuming you have this field in your SharePoint list
          }
        });

      await loadPostVentaData();
      navigate(POST_VENTA_ROUTES.TICKETS.LIST);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err.message || 'Error al crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Card title="Nuevo Ticket de Servicio">
        {error && (
          <div className="mb-6 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
            <AlertTriangle size={20} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ST Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              ST *
            </label>
            <input
              type="text"
              value={formData.st}
              onChange={(e) => setFormData(prev => ({ ...prev, st: e.target.value }))}
              placeholder="Inserte la ST + nombre"
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            />
            {errors.st && (
              <p className="text-sm text-error">{errors.st}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Alcance *
            </label>
            <textarea
              value={formData.scope}
              onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
              placeholder="Explique el alcance del trabajo"
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary min-h-[100px] resize-y"
            />
            {errors.scope && (
              <p className="text-sm text-error">{errors.scope}</p>
            )}
          </div>

          {/* Location Selection */}
          <LocationSelect
            companies={companies}
            buildings={buildings}
            sites={sites}
            value={formData.location}
            onChange={(location) => setFormData(prev => ({ ...prev, location }))}
            error={errors.location}
          />

          {/* System Selection */}
          <SystemSelect
            systems={systems}
            availableSystems={availableSystems}
            value={formData.systemId}
            onChange={(systemId) => setFormData(prev => ({ ...prev, systemId }))}
            error={errors.systemId}
          />

          {/* Service Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tipo de Servicio *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            >
              <option value="">Seleccione un tipo</option>
              <option value="Correctiva">Correctiva</option>
              <option value="Preventiva">Preventiva</option>
            </select>
            {errors.type && (
              <p className="text-sm text-error">{errors.type}</p>
            )}
          </div>

          {/* File Upload */}
          <FileUpload
            value={formData.description}
            onChange={(file) => setFormData(prev => ({ ...prev, description: file }))}
            error={errors.description}
          />

<div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Archivos Administrativos
            </label>
            <div className="space-y-4">
              {formData.adminFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{file.type}: {file.file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdminFileRemove(index)}
                    className="p-1 text-gray-500 hover:text-error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <FileText size={24} className="mx-auto text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                      <span>Subir archivo administrativo</span>
                      <select 
                        onChange={(e) => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf,.doc,.docx,.xlsx,.xlsm,.xlsb';
                          input.onchange = (event) => {
                            const file = event.target.files[0];
                            if (file) {
                              handleAdminFileAdd(file, e.target.value);
                            }
                          };
                          input.click();
                        }}
                        className="sr-only"
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="Cotización">Cotización</option>
                        <option value="Orden de Compra">Orden de Compra</option>
                        <option value="Contrato">Contrato</option>
                        <option value="Factura">Factura</option>
                        <option value="Garantía">Garantía</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, XLSX, XLSB, XLSM hasta 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(POST_VENTA_ROUTES.TICKETS.LIST)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              startIcon={loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TicketForm;