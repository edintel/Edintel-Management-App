import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostVentaManagement } from '../../../../context/postVentaManagementContext';
import { POST_VENTA_ROUTES } from '../../../../routes';
import Card from '../../../../../../components/common/Card';
import Button from '../../../../../../components/common/Button';
import { Save, Loader2, AlertTriangle } from 'lucide-react';

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
    setServiceTickets
  } = usePostVentaManagement();

  const [formData, setFormData] = useState({
    st: '',
    location: {
      companyId: '',
      buildingId: '',
      siteId: '',
    },
    systemId: '',
    type: '',
    description: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get available systems for selected site
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

    if (!formData.description) {
      newErrors.description = 'Adjunte un archivo de descripción';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      const newTicket = await service.createServiceTicket(
        {
          st: formData.st,
          siteId: formData.location.siteId,
          systemId: formData.systemId,
          type: formData.type,
          siteName: site.name,
          companyName: company.name,
          buildingName: building.name,
        },
        formData.description
      );

      setServiceTickets(prev => [
        {
          id: newTicket.id,
          stNumber: newTicket.fields.Title,
          type: newTicket.fields.Tipo,
          descriptionId: newTicket.fields.Descripci_x00f3_n,
          siteId: newTicket.fields.SitioIDLookupId,
          state: "Iniciada",
          technicians: [],
          systemId: newTicket.fields.SistemaIDLookupId,
          createdBy: newTicket.createdBy
        },
        ...prev
      ]);

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