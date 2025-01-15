import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { cn } from '../../../../../../utils/cn';
import { validatePathComponent } from '../../../../../../utils/fileUtils';

const SiteForm = ({
  onSubmit,
  systems,
  roles,
  initialData = null,
  selectedBuildingId = null,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    buildingId: selectedBuildingId || '',
    location: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    systems: [],
    supervisorId: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        buildingId: initialData.buildingId,
        location: initialData.location || '',
        contactName: initialData.contactName || '',
        contactEmail: initialData.contactEmail || '',
        contactPhone: initialData.contactPhone || '',
        systems: initialData.systems?.map(sys => sys.LookupValue) || [],
        supervisorId: initialData.supervisorId?.toString() || '',
      });
    } else if (selectedBuildingId) {
      setFormData(prev => ({
        ...prev,
        buildingId: selectedBuildingId
      }));
    }
  }, [initialData, selectedBuildingId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'name') {
      const validation = validatePathComponent(value);
      if (validation.isValid) {
        setFormData(prev => ({
          ...prev,
          name: validation.sanitizedValue
        }));
        setErrors(prev => ({ ...prev, name: null }));
      } else {
        setErrors(prev => ({ ...prev, name: validation.error }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const trimmedName = formData.name.trim();
    
    // Use validatePathComponent for name validation
    const nameValidation = validatePathComponent(trimmedName);
    
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }
    
    if (!formData.buildingId) {
      newErrors.buildingId = 'Debe seleccionar un edificio';
    }
    
    if (!formData.supervisorId) {
      newErrors.supervisorId = 'Debe seleccionar un supervisor';
    }
    
    // Optional validations
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Email inválido';
    }
    
    if (formData.contactPhone && !/^[\d\s-+()]*$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Número de teléfono inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    onSubmit({
      ...formData,
      name: formData.name.trim()
    });
  };

  const handleSystemToggle = (systemName) => {
    setFormData(prev => ({
      ...prev,
      systems: prev.systems.includes(systemName)
        ? prev.systems.filter(s => s !== systemName)
        : [...prev.systems, systemName]
    }));
  };

  const handleSupervisorChange = (supervisorId) => {
    setFormData(prev => ({
      ...prev,
      supervisorId: supervisorId.toString()
    }));
    if (errors.supervisorId) {
      setErrors(prev => ({ ...prev, supervisorId: null }));
    }
  };

  const supervisors = roles.filter(role =>
    role.role === 'Supervisor' && role.employee
  );

  return (
    <form id="siteForm" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Nombre del Sitio *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={cn(
            "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
            errors.name && "border-error focus:ring-error"
          )}
          placeholder="Ingrese el nombre del sitio"
          required
        />
        {errors.name && (
          <p className="text-sm text-error">{errors.name}</p>
        )}
        <p className="text-xs text-gray-500">
          Solo se permiten letras, números, espacios, guiones y subrayados
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Ubicación
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          placeholder="Ingrese la ubicación exacta"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Nombre de Contacto
          </label>
          <input
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            placeholder="Nombre del contacto"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Email de Contacto
          </label>
          <input
            type="email"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.contactEmail && "border-error focus:ring-error"
            )}
            placeholder="correo@ejemplo.com"
          />
          {errors.contactEmail && (
            <p className="text-sm text-error">{errors.contactEmail}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Teléfono de Contacto
          </label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            className={cn(
              "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
              errors.contactPhone && "border-error focus:ring-error"
            )}
            placeholder="1234-5678"
          />
          {errors.contactPhone && (
            <p className="text-sm text-error">{errors.contactPhone}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Supervisor *
        </label>
        <div className="space-y-2">
          {supervisors.map((supervisor) => (
            <div
              key={supervisor.employee.LookupId}
              onClick={() => handleSupervisorChange(supervisor.employee.LookupId)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                formData.supervisorId === supervisor.employee.LookupId.toString()
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-gray-50 hover:bg-gray-100"
              )}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {supervisor.employee.LookupValue}
                </p>
                {supervisor.employee.Email && (
                  <p className="text-sm text-gray-500">
                    {supervisor.employee.Email}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {errors.supervisorId && (
          <p className="text-sm text-error">{errors.supervisorId}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Sistemas Instalados
        </label>
        <div className="flex flex-wrap gap-2">
          {systems.map(system => (
            <button
              key={system.id}
              type="button"
              onClick={() => handleSystemToggle(system.name)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                formData.systems.includes(system.name)
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {system.name}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
};

export default SiteForm;