import React, { memo } from 'react';
import { Search, Users } from 'lucide-react';
import Card from '../../../../../components/common/Card';
import DateRangePicker from '../../../../../components/common/DateRangePicker';
import { VIEW_MODES, VIEW_MODE_LABELS } from '../constants';

// Memo-ized ViewModeButton for better performance
const ViewModeButton = memo(({ mode, currentMode, onClick, label }) => (
  <button
    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
      currentMode === mode
        ? "border-primary text-primary"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
    onClick={() => onClick(mode)}
  >
    {label}
  </button>
));

// Main filters component
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
  // Memo-ized handlers to prevent recreation on renders
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handlePersonChange = (e) => setSelectedPerson(e.target.value);

  return (
    <Card className="mb-6">
      <div className="space-y-4">
        <div className="flex border-b border-gray-200">
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
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar por rubro, ST o solicitante..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-transparent border-none focus:outline-none text-sm"
            />
          </div>
          <div className="flex-1">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              maxDate={today.toISOString().split("T")[0]}
            />
          </div>
          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <Users size={16} className="text-gray-400 mr-2" />
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

// Memo-ize the whole component for extra performance
export default memo(ApprovalFilters);