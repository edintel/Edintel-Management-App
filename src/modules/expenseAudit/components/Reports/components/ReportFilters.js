import React from 'react';
import { Search, XCircle, Users } from 'lucide-react';
import Card from '../../../../../components/common/Card';
import Button from '../../../../../components/common/Button';
import DateRangePicker from '../../../../../components/common/DateRangePicker';
import MultiSelect from '../../../../../components/common/MultiSelect';

const EXPENSE_STATUSES = [
  { id: 'Aprobada por Asistente', displayName: 'Aprobada por Asistente', email: '' },
  { id: 'Aprobada por Jefatura', displayName: 'Aprobada por Jefatura', email: '' },
  { id: 'Aprobada por Contabilidad', displayName: 'Aprobada por Contabilidad', email: '' },
  { id: 'No aprobada', displayName: 'No aprobada', email: '' },
  { id: 'Pendiente', displayName: 'Pendiente', email: '' }
];

const ReportFilters = ({
  searchTerm,
  onSearchTermChange,
  dateRange,
  onDateRangeChange,
  selectedPerson,
  onPersonChange,
  selectedStatuses,
  onStatusesChange,
  people,
  onResetFilters
}) => {
  // Create mapped version of selected statuses for MultiSelect
  const mappedSelectedStatuses = selectedStatuses.map(status => ({
    id: status,
    displayName: status,
    email: ''
  }));

  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Search Input */}
        <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar por rubro, ST o solicitante..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-sm"
          />
        </div>
        
        {/* Date Range Picker */}
        <div className="flex-1">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onStartDateChange={(date) => 
              onDateRangeChange({ ...dateRange, startDate: date })
            }
            onEndDateChange={(date) =>
              onDateRangeChange({ ...dateRange, endDate: date })
            }
            className="w-full"
          />
        </div>
        
        {/* Person Selector */}
        <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
          <Users size={16} className="text-gray-400 mr-2" />
          <select
            value={selectedPerson}
            onChange={(e) => onPersonChange(e.target.value)}
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
        
        {/* Status Multi-Select */}
        <div className="flex-1">
          <MultiSelect
            options={EXPENSE_STATUSES}
            value={mappedSelectedStatuses}
            onChange={(selected) => onStatusesChange(selected.map(s => s.id))}
            placeholder="Seleccionar estados..."
            searchPlaceholder="Buscar estado..."
          />
        </div>
        
        {/* Reset Button */}
        <Button
          variant="outline"
          size="small"
          startIcon={<XCircle size={16} />}
          onClick={onResetFilters}
          className="md:self-center"
        >
          Limpiar filtros
        </Button>
      </div>
    </Card>
  );
};

export default ReportFilters;