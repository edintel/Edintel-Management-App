import React, { useState } from 'react';
import { usePostVentaManagement } from '../../context/postVentaManagementContext';
import { Alert, AlertDescription } from '../../../../components/common/Alert';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Search } from 'lucide-react';

const SystemsManagement = () => {
  const { systems, sites, service, loading, error, loadPostVentaData, userRole } = usePostVentaManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState(null);

  const hasManagementPermission = (userRole) => {
    return userRole?.role === "Administrativo" || 
           userRole?.role === "Supervisor" || 
           userRole?.role === "Comercial";
  };

  // Calculate usage statistics for each system
  const getSystemUsage = (systemName) => {
    return sites.filter(site => 
      site.systems?.some(sys => sys.LookupValue === systemName)
    ).length;
  };

  // Filter systems based on search term
  const filteredSystems = systems.filter(system =>
    system.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({ name: '' });
    setIsAddModalOpen(true);
  };

  const handleEdit = (system) => {
    setSelectedSystem(system);
    setFormData({ name: system.name });
    setIsEditModalOpen(true);
  };

  const handleDelete = (system) => {
    setSelectedSystem(system);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setActionError(null);

    try {
      if (isAddModalOpen) {
        await service.createSystem(formData);
      } else if (isEditModalOpen) {
        await service.updateSystem(selectedSystem.id, formData);
      }

      // Refresh data after successful operation
      await loadPostVentaData();

      // Close modals and reset state
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedSystem(null);
      setFormData({ name: '' });
    } catch (err) {
      setActionError(err.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setProcessing(true);
    setActionError(null);

    try {
      await service.deleteSystem(selectedSystem.id);
      // Refresh data after successful delete
      await loadPostVentaData();
      
      setIsDeleteModalOpen(false);
      setSelectedSystem(null);
    } catch (err) {
      setActionError(err.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading systems: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar sistemas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          disabled={!hasManagementPermission(userRole)}
        >
          <Plus className="h-4 w-4" />
          Agregar Sistema
        </button>
      </div>

      {/* Systems grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSystems.map((system) => (
          <div
            key={system.id}
            className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium truncate">{system.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(system)}
                  className="p-1 text-gray-500 hover:text-primary transition-colors"
                  title="Editar"
                  disabled={!hasManagementPermission(userRole)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(system)}
                  className="p-1 text-gray-500 hover:text-error transition-colors"
                  title="Eliminar"
                  disabled={!hasManagementPermission(userRole)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Usado en {getSystemUsage(system.name)} sitios
            </p>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">
              {isAddModalOpen ? 'Agregar Sistema' : 'Editar Sistema'}
            </h2>
            
            {actionError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Sistema
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedSystem(null);
                    setFormData({ name: '' });
                    setActionError(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={processing}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Procesando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Confirmar Eliminación</h2>
            
            {actionError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            <p className="text-gray-600 mb-6">
              ¿Está seguro que desea eliminar el sistema "{selectedSystem?.name}"? 
              {getSystemUsage(selectedSystem?.name) > 0 && (
                <span className="text-error">
                  Este sistema está siendo utilizado en {getSystemUsage(selectedSystem?.name)} sitios.
                </span>
              )}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedSystem(null);
                  setActionError(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredSystems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium">No se encontraron sistemas</h3>
          <p className="text-sm">
            {searchTerm ? 'Intente con otra búsqueda' : 'Agregue un nuevo sistema para comenzar'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemsManagement;