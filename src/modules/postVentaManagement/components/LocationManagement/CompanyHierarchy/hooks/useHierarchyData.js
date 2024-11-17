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
    const getFilteredBuildings = (companyId) => 
      buildings.filter(building => building.companyId === companyId);

    const getFilteredSites = (buildingId) => 
      sites.filter(site => site.buildingId === buildingId);

    return {
      companies,
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