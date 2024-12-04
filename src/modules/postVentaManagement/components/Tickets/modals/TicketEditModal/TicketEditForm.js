import React, { useState, useEffect } from 'react';
import { usePostVentaManagement } from '../../../../context/postVentaManagementContext';
import { FileText } from 'lucide-react';
import MultiFileUpload from '../../../../../../components/common/MultiFileUpload';
import { cn } from '../../../../../../utils/cn';

const TicketEditForm = ({
  onSubmit,
  initialData = null
}) => {
  const { companies = [], buildings = [], sites = [], systems = [], userRole } = usePostVentaManagement();
  
  const [formData, setFormData] = useState({
    st: '',
    scope: '',
    companyId: '',
    buildingId: '',
    siteId: '',
    systemId: '',
    type: '',
    description: null,
    adminDocs: [],
    serviceTickets: [], // Changed from serviceTicket to serviceTickets array
    report: null
  });

  const [errors, setErrors] = useState({});

  // Filter buildings based on selected company
  const filteredBuildings = buildings.filter(
    building => building.companyId === formData.companyId
  );

  // Filter sites based on selected building
  const filteredSites = sites.filter(
    site => site.buildingId === formData.buildingId
  );

  // Get available systems for selected site
  const availableSystems = formData.siteId ?
    sites.find(site => site.id === formData.siteId)?.systems || [] : [];

  const filteredSystems = systems.filter(
    system => availableSystems.some(availableSystem =>
      availableSystem.LookupValue === system.name
    )
  );

  useEffect(() => {
    if (initialData) {
      const site = sites.find(s => s.id === initialData.siteId);
      const building = site ? buildings.find(b => b.id === site.buildingId) : null;
      setFormData({
        st: initialData.stNumber || '',
        scope: initialData.scope || '',
        companyId: building?.companyId || '',
        buildingId: site?.buildingId || '',
        siteId: initialData.siteId || '',
        systemId: initialData.systemId || '',
        type: initialData.type || '',
        description: null,
        adminDocs: [],
        serviceTickets: [], // Initialize as empty array
        report: null
      });
    }
  }, [initialData, buildings, sites]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Reset dependent fields when parent selection changes
      if (name === 'companyId') {
        newData.buildingId = '';
        newData.siteId = '';
        newData.systemId = '';
      } else if (name === 'buildingId') {
        newData.siteId = '';
        newData.systemId = '';
      } else if (name === 'siteId') {
        newData.systemId = '';
      }

      return newData;
    });
  };

  const handleAdminDocsChange = (files) => {
    setFormData(prev => ({
      ...prev,
      adminDocs: files
    }));
    if (errors.adminDocs) {
      setErrors(prev => ({ ...prev, adminDocs: undefined }));
    }
  };

  const handleServiceTicketsChange = (files) => {
    setFormData(prev => ({
      ...prev,
      serviceTickets: files
    }));
    if (errors.serviceTickets) {
      setErrors(prev => ({ ...prev, serviceTickets: undefined }));
    }
  };

  const handleReportChange = (files) => {
    setFormData(prev => ({
      ...prev,
      report: files[0] || null
    }));
    if (errors.report) {
      setErrors(prev => ({ ...prev, report: undefined }));
    }
  };

  const handleDescriptionChange = (files) => {
    setFormData(prev => ({
      ...prev,
      description: files[0] || null
    }));
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  const handleRemoveServiceTicket = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceTickets: prev.serviceTickets.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveAdminDoc = (index) => {
    setFormData(prev => ({
      ...prev,
      adminDocs: prev.adminDocs.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(initialData.id, formData);
  };

  const isAdmin = userRole?.role === 'Administrativo';

  return (
    <form id="ticketForm" onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
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
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
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

        {/* Location Selection */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Alcance *
          </label>
          <textarea
            name="scope"
            value={formData.scope}
            onChange={handleInputChange}
            rows={4}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.scope && "border-error focus:border-error focus:ring-error"
            )}
            required
          />
        </div>     

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Empresa *
          </label>
          <select
            name="companyId"
            value={formData.companyId}
            onChange={handleInputChange}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.companyId && "border-error focus:border-error focus:ring-error"
            )}
            required
          >
            <option value="">Seleccione una empresa</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Edificio *
          </label>
          <select
            name="buildingId"
            value={formData.buildingId}
            onChange={handleInputChange}
            disabled={!formData.companyId}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.buildingId && "border-error focus:border-error focus:ring-error"
            )}
            required
          >
            <option value="">Seleccione un edificio</option>
            {filteredBuildings.map(building => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Sitio *
          </label>
          <select
            name="siteId"
            value={formData.siteId}
            onChange={handleInputChange}
            disabled={!formData.buildingId}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.siteId && "border-error focus:border-error focus:ring-error"
            )}
            required
          >
            <option value="">Seleccione un sitio</option>
            {filteredSites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Sistema *
          </label>
          <select
            name="systemId"
            value={formData.systemId}
            onChange={handleInputChange}
            disabled={!formData.siteId}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.systemId && "border-error focus:border-error focus:ring-error"
            )}
            required
          >
            <option value="">Seleccione un sistema</option>
            {filteredSystems.map(system => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Management */}
      <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Nueva Descripción
            </label>
            <MultiFileUpload
              files={formData.description ? [formData.description] : []}
              onFilesChange={handleDescriptionChange}
              onRemove={() => setFormData(prev => ({ ...prev, description: null }))}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              allowedTypes={['.pdf', '.doc', '.docx']}
              error={errors.description}
            />
            <p className="text-sm text-gray-500">
              Deje vacío para mantener la descripción actual
            </p>
          </div>

          {initialData?.serviceTicketId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Nuevas Boletas de Servicio
              </label>
              <MultiFileUpload
                files={formData.serviceTickets}
                onFilesChange={handleServiceTicketsChange}
                onRemove={handleRemoveServiceTicket}
                maxFiles={5}
                maxSize={10 * 1024 * 1024}
                allowedTypes={['.pdf', '.doc', '.docx']}
                error={errors.serviceTickets}
              />
              <p className="text-sm text-gray-500">
                Deje vacío para mantener las boletas actuales
              </p>
            </div>
          )}

          {initialData?.reportId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Nuevo Informe
              </label>
              <MultiFileUpload
                files={formData.report ? [formData.report] : []}
                onFilesChange={handleReportChange}
                onRemove={() => setFormData(prev => ({ ...prev, report: null }))}
                maxFiles={1}
                maxSize={10 * 1024 * 1024}
                allowedTypes={['.pdf', '.doc', '.docx']}
                error={errors.report}
              />
              <p className="text-sm text-gray-500">
                Deje vacío para mantener el informe actual
              </p>
            </div>
          )}

          {/* Administrative Documents (Only visible to admins) */}
          {isAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentos Administrativos
              </label>
              <MultiFileUpload
                files={formData.adminDocs}
                onFilesChange={handleAdminDocsChange}
                onRemove={handleRemoveAdminDoc}
                onDisplayNameChange={(index, name) => {
                  const newAdminDocs = [...formData.adminDocs];
                  newAdminDocs[index].displayName = name;
                  setFormData(prev => ({ ...prev, adminDocs: newAdminDocs }));
                }}
                showDisplayName={true}
                maxFiles={5}
                maxSize={10 * 1024 * 1024}
                allowedTypes={['.pdf', '.doc', '.docx']}
                error={errors.adminDocs}
              />
            </div>
          )}
        </div>
    </form>
  );
};

export default TicketEditForm;