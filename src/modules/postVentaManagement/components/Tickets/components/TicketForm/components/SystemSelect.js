import React from 'react';
import { Settings } from 'lucide-react';
import { cn } from '../../../../../../../utils/cn';

const SystemSelect = ({
  systems,
  availableSystems,
  value = '',
  onChange,
  disabled = false,
  error,
  className
}) => {
  // Filter systems based on what's available for the selected site
  const filteredSystems = systems.filter(system =>
    availableSystems?.some(availableSystem =>
      availableSystem.LookupValue === system.name
    )
  );

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Settings className="w-4 h-4 text-gray-400" />
        Sistema *
      </label>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled || !availableSystems?.length}
        className={cn(
          "w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary",
          (disabled || !availableSystems?.length) && "bg-gray-100",
          error && "border-error focus:border-error focus:ring-error"
        )}
      >
        <option value="">Seleccione un sistema</option>
        {filteredSystems.map(system => (
          <option key={system.id} value={system.id}>
            {system.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
      {!availableSystems?.length && value === '' && (
        <p className="text-sm text-gray-500">
          Seleccione un sitio para ver los sistemas disponibles
        </p>
      )}
    </div>
  );
};

export default SystemSelect;