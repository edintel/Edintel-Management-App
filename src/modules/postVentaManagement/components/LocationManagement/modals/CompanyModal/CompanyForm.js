import React, { useState, useEffect } from 'react';
import { cn } from '../../../../../../utils/cn';
import { handlePathComponentValidation } from '../../../../../../utils/fileUtils';

const CompanyForm = ({ onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // First update the form data immediately to show the changes
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Then perform validation
    if (name === 'name') {
      handlePathComponentValidation(
        value, 
        setError,
        (sanitizedValue) => {
          // Only update with sanitized value if different from input
          if (sanitizedValue !== value) {
            setFormData(prev => ({
              ...prev,
              name: sanitizedValue
            }));
          }
        }
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!handlePathComponentValidation(
      formData.name, 
      setError,
      (sanitizedValue) => {
        setFormData(prev => ({
          ...prev,
          name: sanitizedValue
        }));
      }
    )) {
      return;
    }

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
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary",
            error && "border-error focus:ring-error"
          )}
          required
          placeholder="Ingrese el nombre de la empresa"
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Solo se permiten letras, números, espacios, guiones y subrayados
        </p>
      </div>
    </form>
  );
};

export default CompanyForm;