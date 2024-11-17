import React from 'react';
import BuildingItem from './BuildingItem';

const BuildingList = ({
  buildings,
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
  if (buildings.length === 0) {
    return (
      <div className="py-4 px-6 text-sm text-gray-500 border-l">
        No hay edificios registrados
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {buildings.map((building) => (
        <BuildingItem
          key={building.id}
          building={building}
          expanded={expandedBuildings.includes(building.id)}
          onToggle={toggleBuilding}
          getFilteredSites={getFilteredSites}
          onAddSite={onAddSite}
          onEdit={onEditBuilding}
          onDelete={onDeleteBuilding}
          onEditSite={onEditSite}
          onDeleteSite={onDeleteSite}
          roles={roles}
        />
      ))}
    </div>
  );
};

export default BuildingList;