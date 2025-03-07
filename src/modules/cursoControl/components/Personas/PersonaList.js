// components/Personas/PersonaList.js
import React, { useEffect, useState } from "react";
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
    itemsPerPage,
    setState,
    dataLoaded
  } = useCursoControl();

  // State for pagination managed by the Table component
  const [currentPage, setCurrentPage] = useState(1);
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(itemsPerPage);

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
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setCurrentItemsPerPage(newItemsPerPage);
    setState(prev => ({ ...prev, itemsPerPage: newItemsPerPage }));
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
          data={filteredPersonas}
          isLoading={loading}
          onRowClick={(persona) => navigate(CURSO_CONTROL_ROUTES.PERSONAS.DETAIL(persona.id))}
          paginated={true}
          currentPage={currentPage}
          itemsPerPage={currentItemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
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
      </Card>
    </div>
  );
};

export default PersonaList;