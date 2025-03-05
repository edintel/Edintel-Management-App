import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, AlertTriangle, Loader, UserCircle } from "lucide-react";
import { useCursoControl } from "../../context/cursoControlContext";
import { CURSO_CONTROL_ROUTES } from "../../routes";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import Table from "../../../../components/common/Table";
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog";

const PersonaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { personas, cursos, deletePersona } = useCursoControl();
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    title: "¿Confirmar eliminación?",
    message: "¿Está seguro que desea eliminar esta persona? Esta acción no se puede deshacer y eliminará también todos los cursos asociados."
  });

  // Load persona data
  useEffect(() => {
    const loadPersona = () => {
      try {
        const foundPersona = personas.find(p => p.id === id);
        if (foundPersona) {
          setPersona(foundPersona);
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

  // Get all cursos for this persona
  const getPersonaCursos = () => {
    if (!persona) return [];
    const byId = cursos.filter(c => c.personaId === persona.id);
    if (byId.length > 0) return byId;
    
    return cursos.filter(c => c.personaTitle === persona.title);
  };

  const personaCursos = getPersonaCursos();

  // Define table columns for cursos
  const cursosColumns = [
    {
      key: "curso",
      header: "Curso",
      render: (value) => value || "-",
    },
    {
      key: "fecha",
      header: "Fecha",
      render: (value) =>
        value
          ? value.toLocaleDateString("es-CR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "-",
    }
  ];

  const handleDelete = () => {
    setDeleteDialog(prev => ({ ...prev, isOpen: true }));
  };

  const handleConfirmDelete = async () => {
    try {
      await deletePersona(id);
      navigate(CURSO_CONTROL_ROUTES.PERSONAS.LIST);
    } catch (error) {
      console.error("Error deleting persona:", error);
      setError("Error al eliminar la persona");
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

  if (error || !persona) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle size={48} className="text-error mb-4" />
        <h2 className="text-xl font-semibold mb-4">{error || "Persona no encontrada"}</h2>
        <Button
          variant="outline"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate(CURSO_CONTROL_ROUTES.PERSONAS.LIST)}
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
          onClick={() => navigate(CURSO_CONTROL_ROUTES.PERSONAS.LIST)}
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
            onClick={() => navigate(CURSO_CONTROL_ROUTES.PERSONAS.EDIT(id))}
          >
            Editar
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="p-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{persona.title}</h2>
            <p className="text-gray-500">{persona.empresa}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Cursos Asociados</h3>
          <Table
            columns={cursosColumns}
            data={personaCursos}
            isLoading={false}
            onRowClick={(curso) => navigate(CURSO_CONTROL_ROUTES.CURSOS.DETAIL(curso.id))}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-gray-500">No hay cursos asociados a esta persona</p>
              </div>
            }
          />
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

export default PersonaDetail;