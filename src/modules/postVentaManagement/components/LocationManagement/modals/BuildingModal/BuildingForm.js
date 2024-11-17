import React, { useState, useEffect } from 'react';

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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          required
          placeholder="Ingrese el nombre del edificio"
        />
      </div>
    </form>
  );
};

export default BuildingForm;