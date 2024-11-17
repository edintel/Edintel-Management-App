import React from 'react';
import CompanyItem from './CompanyItem';

const CompanyList = ({
  companies,
  getFilteredBuildings,
  getFilteredSites,
  expandedCompanies,
  expandedBuildings,
  toggleCompany,
  toggleBuilding,
  onAddBuilding,
  onEditCompany,
  onDeleteCompany,
  onAddSite,
  onEditBuilding,
  onDeleteBuilding,
  onEditSite,
  onDeleteSite,
  roles
}) => {
  return (
    <div className="space-y-4">
      {companies.map((company) => (
        <CompanyItem
          key={company.id}
          company={company}
          expanded={expandedCompanies.includes(company.id)}
          onToggle={toggleCompany}
          onAddBuilding={onAddBuilding}
          onEdit={onEditCompany}
          onDelete={onDeleteCompany}
          getFilteredBuildings={getFilteredBuildings}
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
      ))}
    </div>
  );
};

export default CompanyList;