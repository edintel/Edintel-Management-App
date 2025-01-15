import React, { useState, useEffect } from 'react';
import { cn } from '../../../../../../utils/cn';
import { handlePathComponentValidation } from '../../../../../../utils/fileUtils';

const BuildingForm = ({
  onSubmit,
  companies,
  initialData = null,
  selectedCompanyId = null
}) => {
  const [formData, setFormData] = useState({
    name: '',
    companyId: selectedCompanyId || '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        companyId: initialData.companyId,
      });
    } else if (selectedCompanyId) {
      setFormData(prev => ({
        ...prev,
        companyId: selectedCompanyId
      }));
    }
  }, [initialData, selectedCompanyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'name') {
      handlePathComponentValidation(
        value,
        (error) => setErrors(prev => ({ ...prev, name: error })),
        () => { } 
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();

    // Validate before submit
    if (!handlePathComponentValidation(
      trimmedName,
      (error) => setErrors(prev => ({ ...prev, name: error })),
      (sanitizedValue) => {
        setFormData(prev => ({
          ...prev,
          name: sanitizedValue
        }));
      }
    )) {
      return;
    }

    if (!formData.companyId) {
      setErrors(prev => ({
        ...prev,
        companyId: 'Debe seleccionar una empresa'
      }));
      return;
    }

    onSubmit(formData);
  };

  return (
    <form id="buildingForm" onSubmit={handleSubmit} className="space-y-4">
      {!selectedCompanyId && (
        <div>
          <label
            htmlFor="companyId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Empresa *
          </label>
          <select
            id="companyId"
            name="companyId"
            value={formData.companyId}
            onChange={handleChange}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary",
              errors.companyId && "border-error focus:ring-error"
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
          {errors.companyId && (
            <p className="mt-1 text-sm text-error">{errors.companyId}</p>
          )}
        </div>
      )}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nombre del Edificio *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary",
            errors.name && "border-error focus:ring-error"
          )}
          required
          placeholder="Ingrese el nombre del edificio"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-error">{errors.name}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Solo se permiten letras, números, espacios, guiones y subrayados
        </p>
      </div>
    </form>
  );
};

export default BuildingForm;