import React from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import BuildingList from './BuildingList';

const CompanyItem = ({
  company,
  expanded,
  onToggle,
  onAddBuilding,
  onEdit,
  onDelete,
  getFilteredBuildings,
  getFilteredSites,
  expandedBuildings,
  toggleBuilding,
  onAddSite,
  onEditBuilding,
  onDeleteBuilding,
  onEditSite,
  onDeleteSite,
  roles
}) => {
  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="border rounded-lg">
      {/* Company header */}
      <div
        className="flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onToggle(company.id)}
      >
        <button className="p-1">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="flex-1">{company.name}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleAction(e, () => onAddBuilding(company.id))}
            className="p-1 text-gray-500 hover:text-primary transition-colors"
            title="Agregar Edificio"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleAction(e, () => onEdit(company))}
            className="p-1 text-gray-500 hover:text-primary transition-colors"
            title="Editar Empresa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleAction(e, () => onDelete(company))}
            className="p-1 text-gray-500 hover:text-error transition-colors"
            title="Eliminar Empresa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Buildings list */}
      {expanded && (
        <div className="pl-4 pb-4">
          <BuildingList
            buildings={getFilteredBuildings(company.id)}
            getFilteredSites={getFilteredSites}
            expandedBuildings={expandedBuildings}
            toggleBuilding={toggleBuilding}
            onAddSite={onAddSite}
            onEditBuilding={onEditBuilding}
            onDeleteBuilding={onDeleteBuilding}
            onEditSite={onEditSite}
            onDeleteSite={onDeleteSite}
            roles={roles}
          />
        </div>
      )}
    </div>
  );
};

export default CompanyItem;