import React, { useState, useEffect } from 'react';
import { Building2, Building, MapPin } from 'lucide-react';
import { cn } from '../../../../../../../utils/cn';

const LocationSelect = ({ 
  companies, 
  buildings,
  sites,
  value = { companyId: '', buildingId: '', siteId: '' },
  onChange,
  error,
  disabled = false,
  className
}) => {
  const [selectedCompany, setSelectedCompany] = useState(value.companyId);
  const [selectedBuilding, setSelectedBuilding] = useState(value.buildingId);
  const [selectedSite, setSelectedSite] = useState(value.siteId);

  // Filter buildings based on selected company
  const filteredBuildings = buildings.filter(
    building => building.companyId === selectedCompany
  );

  // Filter sites based on selected building
  const filteredSites = sites.filter(
    site => site.buildingId === selectedBuilding
  );

  useEffect(() => {
    // Reset dependent fields when parent selection changes
    if (selectedCompany !== value.companyId) {
      setSelectedBuilding('');
      setSelectedSite('');
    } else if (selectedBuilding !== value.buildingId) {
      setSelectedSite('');
    }
  }, [selectedCompany, selectedBuilding, value]);

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    onChange({ companyId, buildingId: '', siteId: '' });
  };

  const handleBuildingChange = (e) => {
    const buildingId = e.target.value;
    setSelectedBuilding(buildingId);
    onChange({ ...value, buildingId, siteId: '' });
  };

  const handleSiteChange = (e) => {
    const siteId = e.target.value;
    setSelectedSite(siteId);
    onChange({ ...value, siteId });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Company Select */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          Empresa *
        </label>
        <select
          value={selectedCompany}
          onChange={handleCompanyChange}
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
            disabled && "bg-gray-100",
            error?.companyId && "border-error focus:border-error focus:ring-error"
          )}
        >
          <option value="">Seleccione una empresa</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
        {error?.companyId && (
          <p className="text-sm text-error">{error.companyId}</p>
        )}
      </div>

      {/* Building Select */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-400" />
          Edificio *
        </label>
        <select
          value={selectedBuilding}
          onChange={handleBuildingChange}
          disabled={disabled || !selectedCompany}
          className={cn(
            "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
            (disabled || !selectedCompany) && "bg-gray-100",
            error?.buildingId && "border-error focus:border-error focus:ring-error"
          )}
        >
          <option value="">Seleccione un edificio</option>
          {filteredBuildings.map(building => (
            <option key={building.id} value={building.id}>{building.name}</option>
          ))}
        </select>
        {error?.buildingId && (
          <p className="text-sm text-error">{error.buildingId}</p>
        )}
      </div>

      {/* Site Select */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          Sitio *
        </label>
        <select
          value={selectedSite}
          onChange={handleSiteChange}
          disabled={disabled || !selectedBuilding}
          className={cn(
            "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
            (disabled || !selectedBuilding) && "bg-gray-100",
            error?.siteId && "border-error focus:border-error focus:ring-error"
          )}
        >
          <option value="">Seleccione un sitio</option>
          {filteredSites.map(site => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
        </select>
        {error?.siteId && (
          <p className="text-sm text-error">{error.siteId}</p>
        )}
      </div>
    </div>
  );
};

export default LocationSelect;