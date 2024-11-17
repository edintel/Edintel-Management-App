import React, { useState, useEffect } from 'react';

const CompanyForm = ({ onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
      });
    }
  }, [initialData]);

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
    <form id="companyForm" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label 
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nombre de la Empresa *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          required
          placeholder="Ingrese el nombre de la empresa"
        />
      </div>
    </form>
  );
};

export default CompanyForm;