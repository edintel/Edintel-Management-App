import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Loader, AlertTriangle } from "lucide-react";
import { useCursoControl } from "../../context/cursoControlContext";
import { CURSO_CONTROL_ROUTES } from "../../routes";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";

const PersonaForm = () => {
  const navigate = useNavigate();
  const { createPersona, personas } = useCursoControl();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const empresaOptions = [
    "Edintel",
    "Electromecanica Cuendiz",
    "Luis Chavarria",
    "Seisema",
    "Contra incendios chavarria",
    "Cone lect",
    "Lazaro"
  ];

  const [formData, setFormData] = useState({
    title: "",
    empresa: "Edintel"
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title) {
        throw new Error("Por favor ingrese el nombre de la persona");
      }

      // Check if the persona already exists
      const personaExists = personas.some(
        p => p.title.toLowerCase() === formData.title.toLowerCase()
      );
      
      if (personaExists) {
        throw new Error(`La persona "${formData.title}" ya existe en el sistema`);
      }

      await createPersona(formData);
      navigate(CURSO_CONTROL_ROUTES.PERSONAS.LIST);
    } catch (err) {
      console.error("Error creating persona:", err);
      setError(err.message || "Error al crear la persona");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Card title="Nueva Persona">
        {error && (
          <div className="mb-6 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
            <AlertTriangle size={20} />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label 
              htmlFor="title" 
              className="block text-sm font-medium text-gray-700"
            >
              Nombre *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              placeholder="Ingrese el nombre completo"
            />
          </div>
          
          <div className="space-y-2">
            <label 
              htmlFor="empresa" 
              className="block text-sm font-medium text-gray-700"
            >
              Empresa *
            </label>
            <select
              id="empresa"
              name="empresa"
              value={formData.empresa}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            >
              {empresaOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(CURSO_CONTROL_ROUTES.PERSONAS.LIST)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              startIcon={
                loading ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )
              }
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PersonaForm;