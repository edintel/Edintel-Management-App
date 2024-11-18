import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, X, Check } from "lucide-react";
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
  roles = [],
  onResetFilters,
  hasActiveFilters = false,
}) => {
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const stateOptions = [
    "Iniciada",
    "Técnico asignado",
    "Confirmado por técnico",
    "Trabajo iniciado",
    "Finalizada",
    "Cerrada",
  ];

  const userDropdownRef = useRef(null);

  const users = roles
    .filter((role) => role.employee)
    .map((role) => ({
      id: role.employee.LookupId,
      name: role.employee.LookupValue,
      role: role.role,
    }));

  const handleUserToggle = (userId) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter((id) => id !== userId)
      : [...selectedUsers, userId];
    onUsersChange(newSelection);
  };

  const getSelectedUsersDisplay = () => {
    if (selectedUsers.length === 0) return "Todos los usuarios";
    if (selectedUsers.length === 1) {
      const user = users.find((u) => u.id === selectedUsers[0]);
      return user ? user.name : "1 usuario seleccionado";
    }
    return `${selectedUsers.length} usuarios seleccionados`;
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
            <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
              <Filter size={16} className="text-gray-400 mr-2" />
              <select
                value={selectedState}
                onChange={(e) => onStateChange(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-sm"
              >
                <option value="">Todos los estados</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
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
                  className={`transform transition-transform ${
                    isUsersOpen ? "rotate-45" : "rotate-0"
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
