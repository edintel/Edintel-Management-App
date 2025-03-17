import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Loader, AlertTriangle } from "lucide-react";
import { useCursoControl } from "../../context/cursoControlContext";
import { CURSO_CONTROL_ROUTES } from "../../routes";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
const CursoEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cursos, updateCurso, personas, cursosTipos } = useCursoControl();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Removed hard-coded cursoOptions array, now using cursosTipos from context

  const [formData, setFormData] = useState({
    title: "",
    curso: "",
    fecha: "",
    notas: "",
  });
  // Load curso data
  useEffect(() => {
    const loadCurso = () => {
      try {
        const foundCurso = cursos.find((c) => c.id === id);
        if (foundCurso) {
          setFormData({
            title: foundCurso.title || "",
            personaId: foundCurso.personaId || "",
            curso: foundCurso.curso || "",
            fecha: foundCurso.fecha
              ? foundCurso.fecha.toISOString().split("T")[0]
              : "",
            notas: foundCurso.notas || "",
          });
        } else {
          setError("Curso no encontrado");
        }
      } catch (err) {
        console.error("Error loading curso:", err);
        setError("Error al cargar los datos del curso");
      } finally {
        setLoading(false);
      }
    };
    if (cursos.length > 0) {
      loadCurso();
    }
  }, [id, cursos]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        fecha: new Date(formData.fecha),
      };
      const personaExists = personas.some((p) => p.title === formData.title);
      if (!personaExists) {
        throw new Error(
          `La persona "${formData.title}" no existe en el sistema. Debe agregarla primero.`
        );
      }
      await updateCurso(id, formattedData);
      navigate(CURSO_CONTROL_ROUTES.CURSOS.DETAIL(id));
    } catch (err) {
      console.error("Error updating curso:", err);
      setError(err.message || "Error al actualizar el curso");
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
      <Card title="Editar Curso">
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
              {cursosTipos.map((option) => (
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
              Fecha vencimiento *
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
              onClick={() => navigate(CURSO_CONTROL_ROUTES.CURSOS.DETAIL(id))}
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
export default CursoEdit;
