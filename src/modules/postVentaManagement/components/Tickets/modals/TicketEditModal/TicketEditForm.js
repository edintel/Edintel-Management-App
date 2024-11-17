// src/modules/postVentaManagement/components/Tickets/modals/TicketEditModal/TicketEditForm.js
import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { usePostVentaManagement } from '../../../../context/postVentaManagementContext';

const TicketEditForm = ({
  onSubmit,
  initialData = null
}) => {
  const { companies = [], buildings = [], sites = [], systems = [] } = usePostVentaManagement();
  const [formData, setFormData] = useState({
    st: '',
    companyId: '',
    buildingId: '',
    siteId: '',
    systemId: '',
    type: '',
    description: null
  });

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
        companyId: building?.companyId || '',
        buildingId: site?.buildingId || '',
        siteId: initialData.siteId || '',
        systemId: initialData.systemId || '',
        type: initialData.type || '',
        description: null // Don't pre-fill file input
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        description: file
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(initialData.id, formData);
  };

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
            placeholder="Inserte la ST + nombre"
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
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
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
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
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary disabled:bg-gray-100"
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
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary disabled:bg-gray-100"
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
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary disabled:bg-gray-100"
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
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
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Nueva Descripción
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            <FileText size={24} className="mx-auto text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="description"
                className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none"
              >
                <span>Subir archivo</span>
                <input
                  id="description"
                  name="description"
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.xlsm,.xlsb"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              <p className="pl-1">o arrastrar y soltar</p>
            </div>
            <p className="text-xs text-gray-500">
              PDF, DOC, DOCX hasta 10MB
            </p>
            {formData.description && (
              <p className="text-sm text-gray-500">
                Archivo seleccionado: {formData.description.name}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Deje vacío para mantener la descripción actual
        </p>
      </div>
    </form>
  );
};

export default TicketEditForm;