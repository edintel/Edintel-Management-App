import React from 'react';
import { Search, XCircle, Users, CheckSquare } from 'lucide-react';
import Card from '../../../../../components/common/Card';
import Button from '../../../../../components/common/Button';
import DateRangePicker from '../../../../../components/common/DateRangePicker';

const EXPENSE_STATUSES = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Aprobada por Asistente', label: 'Aprobada por Asistente' },
  { value: 'Aprobada por Jefatura', label: 'Aprobada por Jefatura' },
  { value: 'Aprobada por Contabilidad', label: 'Aprobada por Contabilidad' },
  { value: 'No aprobada', label: 'No aprobada' }
];

const ReportFilters = ({
  searchTerm,
  onSearchTermChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedPerson,
  onPersonChange,
  selectedStatuses,
  onStatusesChange,
  people,
  onResetFilters
}) => {
  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 p-4">
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
        <div className="flex-1">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            className="w-full"
          />
        </div>
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
        <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
          <CheckSquare size={16} className="text-gray-400 mr-2" />
          <select
            value={selectedStatuses.length === 1 ? selectedStatuses[0] : ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                onStatusesChange([]);
              } else {
                onStatusesChange([value]);
              }
            }}
            className="w-full bg-transparent border-none focus:outline-none text-sm"
          >
            <option value="">Todos los estados</option>
            {EXPENSE_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
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