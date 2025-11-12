// src/modules/postVentaManagement/components/Tickets/modals/AssignTechnicianModal/ReassignTechModal.js
import React, { useState, useEffect } from "react";
import { X, UserPlus, AlertCircle, Loader2, Lock } from "lucide-react";
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

  // ✨ NUEVO: Obtener todos los técnicos que ya han sido asignados (bloqueados)
  const getLockedTechnicians = () => {
    const locked = new Set();
    
    // Técnicos iniciales
    if (ticket?.technicians) {
      ticket.technicians.forEach(tech => locked.add(tech.LookupId));
    }
    
    // Técnicos de reasignaciones previas (del historial)
    if (ticket?.reassignmentHistory && Array.isArray(ticket.reassignmentHistory)) {
      ticket.reassignmentHistory.forEach(entry => {
        if (entry.type === "reassignment") {
          // Agregar tanto técnicos anteriores como nuevos al set de bloqueados
          entry.previousTechnicians?.forEach(tech => locked.add(tech.id));
          entry.newTechnicians?.forEach(tech => locked.add(tech.id));
        }
      });
    }
    
    // Técnicos reasignados actuales
    if (ticket?.reassignedTechnicians) {
      ticket.reassignedTechnicians.forEach(tech => locked.add(tech.LookupId));
    }
    
    return locked;
  };

  const lockedTechnicians = getLockedTechnicians();

  // Filter by search term
  const filteredTechnicians = technicians.filter((role) =>
    role.employee?.LookupValue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (ticket?.reassignedTechnicians && isOpen) {
      // Pre-seleccionar los técnicos reasignados actuales
      setSelectedTechs(ticket.reassignedTechnicians.map((tech) => tech.LookupId));
    } else if (ticket?.technicians && isOpen) {
      // Si no hay reasignados, pre-seleccionar los originales
      setSelectedTechs(ticket.technicians.map((tech) => tech.LookupId));
    }
  }, [ticket, isOpen]);

  const handleTechToggle = (techId) => {
    // ✨ NUEVO: No permitir des-seleccionar técnicos bloqueados
    if (lockedTechnicians.has(techId)) {
      return; // No hacer nada si está bloqueado
    }

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
                  Esta acción agregará técnicos al ticket. Los técnicos ya asignados
                  quedan bloqueados y no se pueden desasignar. La reasignación quedará
                  registrada en el timeline.
                </p>
              </div>
            </div>
          </div>

          {/* ✨ NUEVO: Mostrar técnicos bloqueados */}
          {lockedTechnicians.size > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-700">
                  Técnicos bloqueados (ya asignados):
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(lockedTechnicians).map((techId) => {
                  const tech = technicians.find(
                    (t) => t.employee?.LookupId === techId
                  );
                  return tech ? (
                    <span
                      key={techId}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-sm flex items-center gap-1"
                    >
                      <Lock className="h-3 w-3" />
                      {tech.employee.LookupValue}
                    </span>
                  ) : null;
                })}
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
              Seleccionar técnicos adicionales:
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredTechnicians.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron técnicos
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTechnicians.map((role) => {
                    const techId = role.employee?.LookupId;
                    const isSelected = selectedTechs.includes(techId);
                    const isLocked = lockedTechnicians.has(techId);

                    return (
                      <label
                        key={techId}
                        className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isLocked ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTechToggle(techId)}
                          disabled={isLocked}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:cursor-not-allowed"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {role.employee?.LookupValue}
                            {isLocked && <Lock className="h-3 w-3 text-gray-500" />}
                          </p>
                          <p className="text-xs text-gray-500">
                            {role.employee?.Email}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            role.role === "Técnico"
                              ? "bg-blue-100 text-blue-700"
                              : role.role === "Supervisor"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {role.role}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedTechs.length} técnico(s) seleccionado(s)
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || selectedTechs.length === 0}
              startIcon={
                loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )
              }
            >
              {loading ? "Reasignando..." : "Reasignar Técnicos"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReassignTechModal;