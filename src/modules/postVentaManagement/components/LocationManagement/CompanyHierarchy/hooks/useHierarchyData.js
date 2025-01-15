import { useState, useMemo } from 'react';
import { usePostVentaManagement } from '../../../../context/postVentaManagementContext';

export const useHierarchyData = () => {
  const {
    companies,
    buildings,
    sites,
    loading,
    roles,
    error
  } = usePostVentaManagement();

  const [expandedCompanies, setExpandedCompanies] = useState([]);
  const [expandedBuildings, setExpandedBuildings] = useState([]);

  const toggleCompany = (companyId) => {
    setExpandedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const toggleBuilding = (buildingId) => {
    setExpandedBuildings(prev =>
      prev.includes(buildingId)
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  const hierarchyData = useMemo(() => {
    const sortedCompanies = [...companies].sort((a, b) => 
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    const getFilteredBuildings = (companyId) => {
      return buildings
        .filter(building => building.companyId === companyId)
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    };

    const getFilteredSites = (buildingId) => {
      return sites
        .filter(site => site.buildingId === buildingId)
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    };

    return {
      companies: sortedCompanies,
      getFilteredBuildings,
      getFilteredSites,
      expandedCompanies,
      expandedBuildings,
      toggleCompany,
      toggleBuilding,
      loading,
      roles,
      error
    };
  }, [
    companies,
    buildings,
    sites,
    expandedCompanies,
    expandedBuildings,
    loading,
    roles,
    error
  ]);

  return hierarchyData;
};