import React from 'react';
import SiteItem from './SiteItem';

const SiteList = ({ sites, onEdit, onDelete, roles }) => {
  if (sites.length === 0) {
    return (
      <div className="py-4 px-6 text-sm text-gray-500 border-l">
        No hay sitios registrados
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sites.map((site) => (
        <SiteItem
          key={site.id}
          site={site}
          onEdit={onEdit}
          onDelete={onDelete}
          roles={roles}
        />
      ))}
    </div>
  );
};

export default SiteList;