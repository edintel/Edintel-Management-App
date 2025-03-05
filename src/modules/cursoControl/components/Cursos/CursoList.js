import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, AlertTriangle } from "lucide-react";
import { useCursoControl } from "../../context/cursoControlContext";
import { CURSO_CONTROL_ROUTES } from "../../routes";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import Table from "../../../../components/common/Table";
import FilterBar from "../common/FilterBar";
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog";

const CursoList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading,
    error,
    getFilteredCursos,
    refreshData,
    currentPage,
    itemsPerPage,
    setState,
    dataLoaded
  } = useCursoControl();
  
  // State for confirmation dialog when clicking on a virtual "pendiente" row
  const [createDialog, setCreateDialog] = useState({
    isOpen: false,
    persona: null,
    curso: ""
  });

  const columns = [
    {
      key: "personaTitle",
      header: "Persona",
      render: (value) => value || "-",
    },
    {
      key: "empresa",
      header: "Empresa",
      render: (value) => value || "-",
    },
    {
      key: "curso",
      header: "Curso",
      render: (value) => value || "Pendiente",
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
          : "Pendiente",
    },
  ];

  const filteredCursos = getFilteredCursos();
  const totalPages = Math.ceil(filteredCursos.length / itemsPerPage);
  const currentPageData = filteredCursos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (!dataLoaded && !loading) {
      refreshData();
    }
  }, [refreshData, dataLoaded, loading]);

  const handleAddCurso = () => {
    navigate(CURSO_CONTROL_ROUTES.CURSOS.NEW);
  };

  const handlePageChange = (newPage) => {
    setState(prev => ({ ...prev, currentPage: newPage }));
  };
  
  // Handle row click with special handling for virtual rows
  const handleRowClick = (curso) => {
    if (curso.isVirtual) {
      // Show confirmation dialog to create a new curso
      setCreateDialog({
        isOpen: true,
        persona: {
          id: curso.personaId,
          title: curso.personaTitle
        },
        curso: curso.curso
      });
    } else {
      navigate(CURSO_CONTROL_ROUTES.CURSOS.DETAIL(curso.id));
    }
  };
  
  // Handle confirmation to create new curso
  const handleConfirmCreate = () => {
    navigate(CURSO_CONTROL_ROUTES.CURSOS.NEW, {
      state: {
        prefillData: {
          personaId: createDialog.persona.id,
          title: createDialog.persona.title,
          curso: createDialog.curso
        }
      }
    });
    setCreateDialog(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Cursos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredCursos.length} cursos encontrados
          </p>
        </div>
        <Button
          variant="primary"
          startIcon={<Plus size={16} />}
          onClick={handleAddCurso}
        >
          Nuevo Curso
        </Button>
      </div>
      <FilterBar />
      {error && (
        <div className="mb-6 p-4 bg-error/10 text-error rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}
      <Card>
        <Table
          columns={columns}
          data={currentPageData}
          isLoading={loading}
          onRowClick={handleRowClick}
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No se encontraron cursos
              </h3>
              <p className="text-sm text-gray-500">
                {loading ? "Cargando..." : "Intenta ajustar los filtros o crea un nuevo curso"}
              </p>
            </div>
          }
        />
        {filteredCursos.length > itemsPerPage && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-500">
              Mostrando {Math.min(filteredCursos.length, (currentPage - 1) * itemsPerPage + 1)}-
              {Math.min(filteredCursos.length, currentPage * itemsPerPage)} de {filteredCursos.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm mx-2">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* Confirmation dialog for creating new curso */}
      <ConfirmationDialog
        isOpen={createDialog.isOpen}
        onClose={() => setCreateDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmCreate}
        type="info"
        title="Crear Nuevo Curso"
        message={`¿Desea crear un nuevo curso "${createDialog.curso}" para ${createDialog.persona?.title}?`}
      />
    </div>
  );
};

export default CursoList;