import React from "react";
import { X } from "lucide-react";
import { useCursoControl } from "../../context/cursoControlContext";
import Button from "../../../../components/common/Button";
const FilterBar = () => {
  const {
    filters,
    setFilters,
    cursosTipos, // Use cursosTipos from context instead of deriving from cursos
    personas,
    empresas,
  } = useCursoControl();

  // No longer need to extract course types from cursos
  const uniquePersonas = [...new Set(personas.map((p) => p.title))]
    .filter(Boolean)
    .sort();

  const handleResetFilters = () => {
    setFilters({
      curso: "",
      persona: "",
      empresa: "",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Curso
          </label>
          <select
            value={filters.curso}
            onChange={(e) => setFilters({ curso: e.target.value })}
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          >
            <option value="">Todos los cursos</option>
            {cursosTipos.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {/* Persona filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Persona
          </label>
          <select
            value={filters.persona}
            onChange={(e) => setFilters({ persona: e.target.value })}
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          >
            <option value="">Todas las personas</option>
            {uniquePersonas.map((persona) => (
              <option key={persona} value={persona}>
                {persona}
              </option>
            ))}
          </select>
        </div>
        {/* Empresa filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empresa
          </label>
          <select
            value={filters.empresa}
            onChange={(e) => setFilters({ empresa: e.target.value })}
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((empresa) => (
              <option key={empresa} value={empresa}>
                {empresa}
              </option>
            ))}
          </select>
        </div>
        {/* Reset filters button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            size="default"
            startIcon={<X size={16} />}
            onClick={handleResetFilters}
            className="w-full md:w-auto"
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
    </div>
  );
};
export default FilterBar;
