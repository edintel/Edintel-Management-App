import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, X, Check, PackageX } from "lucide-react";
import Card from "../../../../../../../components/common/Card";
import Button from "../../../../../../../components/common/Button";
import DateRangePicker from "../../../../../../../components/common/DateRangePicker";

const ListFilters = ({
  searchTerm,
  onSearchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedState,
  onStateChange,
  selectedUsers = [],
  onUsersChange,
  waitingEquipment = false,
  onWaitingEquipmentChange,
  roles = [],
  onResetFilters,
  hasActiveFilters = false,
}) => {
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  
  // Estados sin "Esperando equipo" porque ahora es un filtro separado
  const stateOptions = [
    "Iniciada",
    "Técnico asignado",
    "Confirmado por técnico",
    "Trabajo iniciado",
    "Trabajo Parcial",
    "Finalizada",
    "Cerrada",
  ];

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  const userDropdownRef = useRef(null);

  const users = (roles
    .filter((role) => role.employee)
    .map((role) => ({
      id: role.employee.LookupId,
      name: role.employee.LookupValue,
      role: role.role,
    }))).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  const handleUserToggle = (userId) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter((id) => id !== userId)
      : [...selectedUsers, userId];
    onUsersChange(newSelection);
  };

  const handleStatusToggle = (status) => {
    const newSelection = selectedState.includes(status)
      ? selectedState.filter(s => s !== status)
      : [...selectedState, status];
    onStateChange(newSelection);
  };

  const getSelectedUsersDisplay = () => {
    if (selectedUsers.length === 0) return "Todos los usuarios";
    if (selectedUsers.length === 1) {
      const user = users.find((u) => u.id === selectedUsers[0]);
      return user ? user.name : "1 usuario seleccionado";
    }
    return `${selectedUsers.length} usuarios seleccionados`;
  };

  const getSelectedStatusDisplay = () => {
    if (selectedState.length === 0) return "Todos los estados";
    if (selectedState.length === 1) return selectedState[0];
    return `${selectedState.length} estados seleccionados`;
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUsersOpen(false);
      }
    };

    if (isUsersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUsersOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setIsStatusOpen(false);
      }
    };

    if (isStatusOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStatusOpen]);

  return (
    <Card>
      <div className="p-4 space-y-4">
        {/* Search and Date Range */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar por ST, empresa, edificio, sitio o tipo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-sm"
            />
          </div>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            className="flex-1"
          />
        </div>

        {/* Status and Users Filters */}
        <div className="flex-1 relative" ref={userDropdownRef}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative" ref={statusDropdownRef}>
              <div
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 cursor-pointer"
              >
                <div className="flex items-center">
                  <Filter size={16} className="text-gray-400 mr-2" />
                  <span className="text-sm truncate">
                    {getSelectedStatusDisplay()}
                  </span>
                </div>
                <X
                  size={16}
                  className={`transform transition-transform ${isStatusOpen ? "rotate-45" : "rotate-0"
                    }`}
                />
              </div>

              {isStatusOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border max-h-64 overflow-y-auto">
                  {stateOptions.map((state) => (
                    <div
                      key={state}
                      onClick={() => handleStatusToggle(state)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="text-sm font-medium">{state}</span>
                      {selectedState.includes(state) && (
                        <Check size={16} className="text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <div
                onClick={() => setIsUsersOpen(!isUsersOpen)}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 cursor-pointer"
              >
                <div className="flex items-center">
                  <Filter size={16} className="text-gray-400 mr-2" />
                  <span className="text-sm truncate">
                    {getSelectedUsersDisplay()}
                  </span>
                </div>
                <X
                  size={16}
                  className={`transform transition-transform ${isUsersOpen ? "rotate-45" : "rotate-0"
                    }`}
                />
              </div>

              {isUsersOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserToggle(user.id)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div>
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({user.role})
                        </span>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <Check size={16} className="text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filtro de Esperando Equipo */}
            <div className="flex-1">
              <div
                onClick={() => onWaitingEquipmentChange(!waitingEquipment)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                  waitingEquipment 
                    ? "bg-warning/10 border border-warning/30" 
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <PackageX 
                    size={16} 
                    className={`mr-2 ${waitingEquipment ? "text-warning" : "text-gray-400"}`} 
                  />
                  <span className={`text-sm ${waitingEquipment ? "font-medium text-warning" : ""}`}>
                    Esperando equipo
                  </span>
                </div>
                {waitingEquipment && (
                  <Check size={16} className="text-warning" />
                )}
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                startIcon={<X size={16} />}
                onClick={onResetFilters}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ListFilters;