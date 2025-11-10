// src/modules/postVentaManagement/components/Tickets/modals/ReassignTechModal.js
import React, { useState, useEffect } from "react";
import { X, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import Button from "../../../../../../components/common/Button";
import { usePostVentaManagement } from "../../../../context/postVentaManagementContext";

const ReassignTechModal = ({ isOpen, onClose, ticket, onReassign }) => {
  const { roles } = usePostVentaManagement();
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get only technicians and supervisors
  const technicians = roles.filter(
    (role) => role.role === "Técnico" || role.role === "Supervisor" || role.role === "Administrativo"
  );

  // Filter by search term
  const filteredTechnicians = technicians.filter((role) =>
    role.employee?.LookupValue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (ticket?.technicians && isOpen) {
      setSelectedTechs(ticket.technicians.map((tech) => tech.LookupId));
    }
  }, [ticket, isOpen]);

  const handleTechToggle = (techId) => {
    setSelectedTechs((prev) => {
      if (prev.includes(techId)) {
        return prev.filter((id) => id !== techId);
      }
      return [...prev, techId];
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (selectedTechs.length === 0) {
      setError("Debe seleccionar al menos un técnico");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onReassign(ticket.id, selectedTechs);
      setSelectedTechs([]);
      setSearchTerm("");
      onClose();
    } catch (err) {
      setError(err.message || "Error al reasignar técnicos");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSelectedTechs(ticket?.technicians?.map((tech) => tech.LookupId) || []);
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Reasignar Técnicos - Trabajo Parcial
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="text-blue-600 flex-shrink-0 h-5 w-5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">
                  Reasignación en estado Trabajo Parcial
                </p>
                <p>
                  Esta acción reasignará los técnicos del ticket manteniendo el
                  estado actual. La reasignación quedará registrada en el
                  timeline.
                </p>
              </div>
            </div>
          </div>

          {/* Current Technicians */}
          {ticket?.technicians && ticket.technicians.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Técnicos actuales:
              </p>
              <div className="flex flex-wrap gap-2">
                {ticket.technicians.map((tech) => (
                  <span
                    key={tech.LookupId}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {tech.LookupValue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar técnico:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Technician Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Seleccionar nuevos técnicos:
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredTechnicians.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No hay técnicos disponibles
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredTechnicians.map((role, index) => {
                    const uniqueKey = `${role.id}_${role.employee?.LookupId || 'no-emp'}_${index}`;
                    return (
                      <label
                        key={uniqueKey}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTechs.includes(role.employee?.LookupId)}
                          onChange={() => handleTechToggle(role.employee?.LookupId)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {role.employee?.LookupValue}
                          </p>
                          <p className="text-xs text-gray-500">
                            {role.employee?.Email}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {role.role}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Count */}
          {selectedTechs.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedTechs.length} técnico(s) seleccionado(s)
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || selectedTechs.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Reasignando...
                </>
              ) : (
                'Reasignar Técnicos'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReassignTechModal;