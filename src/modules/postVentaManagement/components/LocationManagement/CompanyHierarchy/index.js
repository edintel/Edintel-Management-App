import React, { useState, useCallback } from 'react';
import { Loader2, AlertTriangle, Search } from 'lucide-react';
import { useHierarchyData } from './hooks/useHierarchyData';
import { useHierarchyActions, MODAL_TYPES } from './hooks/useHierarchyActions';
import HierarchyHeader from './HierarchyHeader';
import EmptyState from './EmptyState';
import CompanyList from './CompanyList';
import { CompanyModal, BuildingModal, SiteModal, DeleteModal } from '../modals';

const CompanyHierarchy = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const {
    companies,
    getFilteredBuildings,
    getFilteredSites,
    expandedCompanies,
    expandedBuildings,
    toggleCompany,
    toggleBuilding,
    loading,
    error,
    roles
  } = useHierarchyData();

  const {
    currentModal,
    selectedItem,
    processing,
    error: actionError,
    openModal,
    closeModal,
    handleAddCompany,
    handleEditCompany,
    handleDeleteCompany,
    handleAddBuilding,
    handleEditBuilding,
    handleDeleteBuilding,
    handleAddSite,
    handleEditSite,
    handleDeleteSite,
  } = useHierarchyActions();

  // Search filter function
  const filterHierarchy = useCallback(() => {
    if (!searchTerm) return companies;

    const searchLower = searchTerm.toLowerCase();
    return companies.filter(company => {
      const companyMatch = company.name.toLowerCase().includes(searchLower);
      const buildings = getFilteredBuildings(company.id);
      
      const buildingMatch = buildings.some(building => 
        building.name.toLowerCase().includes(searchLower)
      );
      
      const siteMatch = buildings.some(building => {
        const sites = getFilteredSites(building.id);
        return sites.some(site => 
          site.name.toLowerCase().includes(searchLower)
        );
      });

      return companyMatch || buildingMatch || siteMatch;
    });
  }, [companies, getFilteredBuildings, getFilteredSites, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-error/10 text-error rounded-lg">
        <AlertTriangle className="h-5 w-5" />
        <span>Error loading data: {error}</span>
      </div>
    );
  }

  const filteredCompanies = filterHierarchy();

  const handleModalSubmit = (data) => {
    switch (currentModal?.type) {
      case MODAL_TYPES.ADD_COMPANY:
        return handleAddCompany(data);
      case MODAL_TYPES.EDIT_COMPANY:
        return handleEditCompany(data);
      case MODAL_TYPES.ADD_BUILDING:
        return handleAddBuilding({ ...data, companyId: currentModal.parentId });
      case MODAL_TYPES.EDIT_BUILDING:
        return handleEditBuilding(data);
      case MODAL_TYPES.ADD_SITE:
        return handleAddSite({ ...data, buildingId: currentModal.parentId });
      case MODAL_TYPES.EDIT_SITE:
        return handleEditSite(data);
      default:
        return;
    }
  };

  const handleDelete = () => {
    switch (currentModal?.type) {
      case MODAL_TYPES.DELETE_COMPANY:
        return handleDeleteCompany();
      case MODAL_TYPES.DELETE_BUILDING:
        return handleDeleteBuilding();
      case MODAL_TYPES.DELETE_SITE:
        return handleDeleteSite();
      default:
        return;
    }
  };

  return (
    <div className="space-y-6">
      <HierarchyHeader onAddCompany={() => openModal(MODAL_TYPES.ADD_COMPANY)} />

      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar empresas, edificios o sitios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {filteredCompanies.length === 0 ? (
        searchTerm ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No se encontraron resultados</h3>
            <p className="text-sm">
              No se encontraron coincidencias para "{searchTerm}"
            </p>
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        <CompanyList
          companies={filteredCompanies}
          getFilteredBuildings={getFilteredBuildings}
          getFilteredSites={getFilteredSites}
          expandedCompanies={expandedCompanies}
          expandedBuildings={expandedBuildings}
          toggleCompany={toggleCompany}
          toggleBuilding={toggleBuilding}
          onAddBuilding={(companyId) => openModal(MODAL_TYPES.ADD_BUILDING, null, companyId)}
          onEditCompany={(company) => openModal(MODAL_TYPES.EDIT_COMPANY, company)}
          onDeleteCompany={(company) => openModal(MODAL_TYPES.DELETE_COMPANY, company)}
          onAddSite={(buildingId) => openModal(MODAL_TYPES.ADD_SITE, null, buildingId)}
          onEditBuilding={(building) => openModal(MODAL_TYPES.EDIT_BUILDING, building)}
          onDeleteBuilding={(building) => openModal(MODAL_TYPES.DELETE_BUILDING, building)}
          onEditSite={(site) => openModal(MODAL_TYPES.EDIT_SITE, site)}
          onDeleteSite={(site) => openModal(MODAL_TYPES.DELETE_SITE, site)}
          roles={roles}
        />
      )}

      {/* Modals */}
      {currentModal?.type.includes('company') && (
        <CompanyModal
          isOpen={currentModal.type === MODAL_TYPES.ADD_COMPANY || currentModal.type === MODAL_TYPES.EDIT_COMPANY}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          initialData={selectedItem}
          processing={processing}
          error={actionError}
        />
      )}

      {currentModal?.type.includes('building') && (
        <BuildingModal
          isOpen={currentModal.type === MODAL_TYPES.ADD_BUILDING || currentModal.type === MODAL_TYPES.EDIT_BUILDING}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          companies={companies}
          initialData={selectedItem}
          selectedCompanyId={currentModal.parentId}
          processing={processing}
          error={actionError}
        />
      )}

      {currentModal?.type.includes('site') && (
        <SiteModal
          isOpen={currentModal.type === MODAL_TYPES.ADD_SITE || currentModal.type === MODAL_TYPES.EDIT_SITE}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          initialData={selectedItem}
          selectedBuildingId={currentModal.parentId}
          processing={processing}
          error={actionError}
        />
      )}

      {currentModal?.type.includes('delete') && (
        <DeleteModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={handleDelete}
          itemType={
            currentModal.type === MODAL_TYPES.DELETE_COMPANY 
              ? 'la empresa' 
              : currentModal.type === MODAL_TYPES.DELETE_BUILDING 
                ? 'el edificio' 
                : 'el sitio'
          }
          itemName={selectedItem?.name}
          processing={processing}
          error={actionError}
        />
      )}
    </div>
  );
};

export default CompanyHierarchy;