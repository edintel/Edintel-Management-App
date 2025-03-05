// components/Cursos/CursoDetail.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, AlertTriangle, Loader } from "lucide-react";
import { useCursoControl } from "../../context/cursoControlContext";
import { CURSO_CONTROL_ROUTES } from "../../routes";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog";

const CursoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cursos, personas, deleteCurso } = useCursoControl();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    title: "¿Confirmar eliminación?",
    message: "¿Está seguro que desea eliminar este curso? Esta acción no se puede deshacer."
  });

  useEffect(() => {
    const loadCurso = () => {
      try {
        const foundCurso = cursos.find(c => c.id === id);
        if (foundCurso) {
          setCurso(foundCurso);
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

  // Get persona information - we can directly use the personaId from curso
  // if it's available, otherwise fall back to title matching
  const getPersonaInfo = () => {
    if (!curso) return null;
    
    if (curso.personaId) {
      return personas.find(p => p.id === curso.personaId) || null;
    }
    
    // Fallback to title matching if personaId is not available
    return personas.find(p => p.title === curso.personaTitle) || null;
  };

  const personaInfo = getPersonaInfo();

  const handleDelete = () => {
    setDeleteDialog(prev => ({ ...prev, isOpen: true }));
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCurso(id);
      navigate(CURSO_CONTROL_ROUTES.CURSOS.LIST);
    } catch (error) {
      console.error("Error deleting curso:", error);
      setError("Error al eliminar el curso");
    } finally {
      setDeleteDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle size={48} className="text-error mb-4" />
        <h2 className="text-xl font-semibold mb-4">{error || "Curso no encontrado"}</h2>
        <Button
          variant="outline"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate(CURSO_CONTROL_ROUTES.CURSOS.LIST)}
        >
          Volver a la lista
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate(CURSO_CONTROL_ROUTES.CURSOS.LIST)}
        >
          Volver
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-error hover:bg-error/10"
            startIcon={<Trash2 size={16} />}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
          <Button
            variant="outline"
            startIcon={<Edit size={16} />}
            onClick={() => navigate(CURSO_CONTROL_ROUTES.CURSOS.EDIT(id))}
          >
            Editar
          </Button>
        </div>
      </div>
      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Detalles del Curso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-sm text-gray-500 block">Persona</span>
              <p className="text-gray-900 font-medium">{curso.personaTitle || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Empresa</span>
              <p className="text-gray-900 font-medium">{curso.empresa || personaInfo?.empresa || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Curso</span>
              <p className="text-gray-900 font-medium">{curso.curso || "Pendiente"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Fecha</span>
              <p className="text-gray-900 font-medium">
                {curso.fecha ? curso.fecha.toLocaleDateString("es-CR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }) : "Pendiente"}
              </p>
            </div>
          </div>
          {curso.notas && (
            <div>
              <span className="text-sm text-gray-500 block mb-2">Notas</span>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{curso.notas}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        type="delete"
        title={deleteDialog.title}
        message={deleteDialog.message}
      />
    </div>
  );
};

export default CursoDetail;