import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Loader, AlertTriangle } from "lucide-react";
import { useCursoControl } from "../../context/cursoControlContext";
import { CURSO_CONTROL_ROUTES } from "../../routes";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";

const PersonaEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { personas, updatePersona } = useCursoControl();
  const [loading, setLoading] = useState(true);
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
    empresa: ""
  });

  // Load persona data
  useEffect(() => {
    const loadPersona = () => {
      try {
        const foundPersona = personas.find(p => p.id === id);
        if (foundPersona) {
          setFormData({
            title: foundPersona.title || "",
            empresa: foundPersona.empresa || "Edintel"
          });
        } else {
          setError("Persona no encontrada");
        }
      } catch (err) {
        console.error("Error loading persona:", err);
        setError("Error al cargar los datos de la persona");
      } finally {
        setLoading(false);
      }
    };

    if (personas.length > 0) {
      loadPersona();
    }
  }, [id, personas]);

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

      const nameExists = personas.some(
        p => p.id !== id && 
        p.title.toLowerCase() === formData.title.toLowerCase()
      );
      
      if (nameExists) {
        throw new Error(`La persona "${formData.title}" ya existe en el sistema`);
      }

      await updatePersona(id, formData);
      navigate(CURSO_CONTROL_ROUTES.PERSONAS.DETAIL(id));
    } catch (err) {
      console.error("Error updating persona:", err);
      setError(err.message || "Error al actualizar la persona");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Card title="Editar Persona">
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
              onClick={() => navigate(CURSO_CONTROL_ROUTES.PERSONAS.DETAIL(id))}
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

export default PersonaEdit;