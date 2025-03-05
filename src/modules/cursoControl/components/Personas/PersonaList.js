// components/Personas/PersonaList.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlertTriangle } from "lucide-react";
import { useCursoControl } from "../../context/cursoControlContext";
import { CURSO_CONTROL_ROUTES } from "../../routes";
import Card from "../../../../components/common/Card";
import Button from "../../../../components/common/Button";
import Table from "../../../../components/common/Table";
import FilterBar from "./FilterBar";

const PersonaList = () => {
  const navigate = useNavigate();
  const {
    loading,
    error,
    getFilteredPersonas,
    refreshData,
    personasCurrentPage,
    itemsPerPage,
    setState,
    dataLoaded
  } = useCursoControl();

  const columns = [
    {
      key: "title",
      header: "Nombre",
      render: (value) => value || "-",
    },
    {
      key: "empresa",
      header: "Empresa",
      render: (value) => value || "-",
    }
  ];

  const filteredPersonas = getFilteredPersonas();
  const totalPages = Math.ceil(filteredPersonas.length / itemsPerPage);
  const currentPageData = filteredPersonas.slice(
    (personasCurrentPage - 1) * itemsPerPage,
    personasCurrentPage * itemsPerPage
  );

  useEffect(() => {
    // Only refresh if we haven't loaded data yet and we're not currently loading
    if (!dataLoaded && !loading) {
      refreshData();
    }
  }, [refreshData, dataLoaded, loading]);

  const handleAddPersona = () => {
    navigate(CURSO_CONTROL_ROUTES.PERSONAS.NEW);
  };

  const handlePageChange = (newPage) => {
    setState(prev => ({ ...prev, personasCurrentPage: newPage }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredPersonas.length} personas encontradas
          </p>
        </div>
        <Button
          variant="primary"
          startIcon={<Plus size={16} />}
          onClick={handleAddPersona}
        >
          Nueva Persona
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
          onRowClick={(persona) => navigate(CURSO_CONTROL_ROUTES.PERSONAS.DETAIL(persona.id))}
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No se encontraron personas
              </h3>
              <p className="text-sm text-gray-500">
                {loading ? "Cargando..." : "No hay personas en el sistema"}
              </p>
            </div>
          }
        />
        {filteredPersonas.length > itemsPerPage && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-500">
              Mostrando {Math.min(filteredPersonas.length, (personasCurrentPage - 1) * itemsPerPage + 1)}-
              {Math.min(filteredPersonas.length, personasCurrentPage * itemsPerPage)} de {filteredPersonas.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(Math.max(1, personasCurrentPage - 1))}
                disabled={personasCurrentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm mx-2">
                Página {personasCurrentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(Math.min(totalPages, personasCurrentPage + 1))}
                disabled={personasCurrentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PersonaList;