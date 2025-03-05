import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Save, Loader, AlertTriangle } from "lucide-react";
import { useCursoControl } from "../../context/cursoControlContext";
import { CURSO_CONTROL_ROUTES } from "../../routes";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";

const CursoForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createCurso, personas } = useCursoControl();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get pre-filled data from navigation state if available
  const prefillData = location.state?.prefillData || {};

  const cursoOptions = [
    "BN Padron",
    "Allergan",
    "Visados Walmart",
    "Credomatic",
    "Phillips",
    "Equifax",
    "ICE Subastación",
    "Curso Alturas",
    "Visado Walmart con Alturas",
    "Bayer cuartos limpios",
    "Abbott",
    "Viant"
  ];

  const [formData, setFormData] = useState({
    title: prefillData.title || "", // This is the persona name
    personaId: prefillData.personaId || "",
    curso: prefillData.curso || "",
    fecha: "",
    notas: ""
  });

  // If we have prefillData, find the matching persona to get the complete data
  useEffect(() => {
    if (prefillData.personaId && !formData.title) {
      const selectedPersona = personas.find(p => p.id === prefillData.personaId);
      if (selectedPersona) {
        setFormData(prev => ({
          ...prev,
          title: selectedPersona.title || prev.title
        }));
      }
    }
  }, [personas, prefillData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "title") {
      const selectedPersona = personas.find(p => p.title === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        personaId: selectedPersona?.id || ""
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!formData.title || !formData.curso || !formData.fecha) {
        throw new Error("Por favor complete todos los campos requeridos");
      }
      
      const formattedData = {
        ...formData,
        fecha: new Date(formData.fecha)
      };
      
      await createCurso(formattedData);
      navigate(CURSO_CONTROL_ROUTES.CURSOS.LIST);
    } catch (err) {
      console.error("Error creating curso:", err);
      setError(err.message || "Error al crear el curso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Card title="Nuevo Curso">
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
              Persona *
            </label>
            <select
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            >
              <option value="">Seleccione una persona</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.title}>
                  {persona.title} ({persona.empresa})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="curso"
              className="block text-sm font-medium text-gray-700"
            >
              Curso *
            </label>
            <select
              id="curso"
              name="curso"
              value={formData.curso}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            >
              <option value="">Seleccione un curso</option>
              {cursoOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="fecha"
              className="block text-sm font-medium text-gray-700"
            >
              Fecha *
            </label>
            <input
              type="date"
              id="fecha"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="notas"
              className="block text-sm font-medium text-gray-700"
            >
              Notas
            </label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
              placeholder="Ingrese notas adicionales sobre el curso"
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(CURSO_CONTROL_ROUTES.CURSOS.LIST)}
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

export default CursoForm;