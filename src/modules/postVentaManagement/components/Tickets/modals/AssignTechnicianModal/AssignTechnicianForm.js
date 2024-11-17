import React, { useState, useEffect } from 'react';
import { usePostVentaManagement } from '../../../../context/postVentaManagementContext';
import { Search } from 'lucide-react';

const AssignTechnicianForm = ({
  onSubmit, 
  initialData = null,
}) => {
  const { roles } = usePostVentaManagement();
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const uniqueRoles = [...new Set(roles.map(role => role.role))];

  useEffect(() => {
    if (initialData?.technicians) {
      setSelectedAssignees(
        initialData.technicians.map(tech => tech.LookupId)
      );
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(selectedAssignees);
  };

  const handleAssigneeToggle = (employeeId) => {
    setSelectedAssignees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      }
      return [...prev, employeeId];
    });
  };

  // Filter roles based on search term and role filter
  const filteredRoles = roles.filter(role => {
    const matchesSearch = 
      role.employee?.LookupValue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.employee?.Email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter ? role.role === roleFilter : true;
    
    return role.employee && matchesSearch && matchesRole;
  });

  return (
    <form id="technicianForm" onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Todos los roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Assignees List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Disponible
          </label>
          <div className="space-y-2">
            {filteredRoles.map((role, index) => {
              // Create a unique key by combining role ID and employee ID
              const uniqueKey = `${role.id}_${role.employee?.LookupId || 'no-emp'}_${index}`;
              return (
                <div 
                  key={uniqueKey}
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    id={`assignee-${uniqueKey}`}
                    checked={selectedAssignees.includes(role.employee?.LookupId)}
                    onChange={() => handleAssigneeToggle(role.employee?.LookupId)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label 
                    htmlFor={`assignee-${uniqueKey}`}
                    className="ml-3 flex-1 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {role.employee?.LookupValue}
                      </p>
                      <p className="text-sm text-gray-500">
                        {role.employee?.Email}
                      </p>
                    </div>
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {role.role}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {selectedAssignees.length === 0 && (
          <p className="text-sm text-warning mt-2">
            Debe seleccionar al menos una persona
          </p>
        )}

        {filteredRoles.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No se encontraron resultados
          </p>
        )}
      </div>
    </form>
  );
}

export default AssignTechnicianForm;