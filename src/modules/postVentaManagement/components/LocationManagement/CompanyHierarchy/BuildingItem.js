import React from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Building } from 'lucide-react';
import SiteList from './SiteList';

const BuildingItem = ({
  building,
  expanded,
  onToggle,
  getFilteredSites,
  onAddSite,
  onEdit,
  onDelete,
  onEditSite,
  onDeleteSite,
  roles,
}) => {
  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="border-l">
      {/* Building header */}
      <div
        className="flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onToggle(building.id)}
      >
        <button className="p-1">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <Building className="h-4 w-4 text-gray-400" />
        <span className="flex-1">{building.name}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleAction(e, () => onAddSite(building.id))}
            className="p-1 text-gray-500 hover:text-primary transition-colors"
            title="Agregar Sitio"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleAction(e, () => onEdit(building))}
            className="p-1 text-gray-500 hover:text-primary transition-colors"
            title="Editar Edificio"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleAction(e, () => onDelete(building))}
            className="p-1 text-gray-500 hover:text-error transition-colors"
            title="Eliminar Edificio"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sites list */}
      {expanded && (
        <div className="pl-8">
          <SiteList
            sites={getFilteredSites(building.id)}
            onEdit={onEditSite}
            onDelete={onDeleteSite}
            roles={roles}
          />
        </div>
      )}
    </div>
  );
};

export default BuildingItem;