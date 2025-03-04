import React, { memo } from 'react';
import { Search, Users } from 'lucide-react';
import Card from '../../../../../components/common/Card';
import DateRangePicker from '../../../../../components/common/DateRangePicker';
import { VIEW_MODES, VIEW_MODE_LABELS } from '../constants';

const ViewModeButton = memo(({ mode, currentMode, onClick, label }) => (
  <button
    className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
      currentMode === mode
        ? "border-primary text-primary"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
    onClick={() => onClick(mode)}
  >
    {label}
  </button>
));

const ApprovalFilters = ({
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  selectedPerson,
  setSelectedPerson,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  people,
  today
}) => {
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handlePersonChange = (e) => setSelectedPerson(e.target.value);
  
  return (
    <Card className="mb-6">
      <div className="space-y-4">
        <div className="flex overflow-x-auto border-b border-gray-200 pb-1">
          {Object.entries(VIEW_MODES).map(([key, mode]) => (
            <ViewModeButton
              key={mode}
              mode={mode}
              currentMode={viewMode}
              onClick={setViewMode}
              label={VIEW_MODE_LABELS[mode] || key}
            />
          ))}
        </div>
        
        <div className="flex flex-col space-y-4 p-4">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por rubro, ST o solicitante..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-transparent border-none focus:outline-none text-sm"
            />
          </div>
          
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            maxDate={today.toISOString().split("T")[0]}
          />
          
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <Users size={16} className="text-gray-400 mr-2 flex-shrink-0" />
            <select
              value={selectedPerson}
              onChange={handlePersonChange}
              className="w-full bg-transparent border-none focus:outline-none text-sm"
            >
              <option value="">Todos los solicitantes</option>
              {people.map((person) => (
                <option key={person.id} value={person.email}>
                  {person.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default memo(ApprovalFilters);