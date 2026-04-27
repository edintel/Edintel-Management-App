import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVacaciones } from '../../context/vacacionesContext';
import { useMsal } from '@azure/msal-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import { Plus, Filter, X, Clock, Check, AlertTriangle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { VACACIONES_ROUTES } from '../../routes';
import RequestForm from './RequestForm';

const getStatusInfo = request => {
  if (request.aprobadoJefatura === false || request.aprobadoRH === false) {
    return { label: 'Rechazada', color: 'red', status: 'rejected' };
  }
  if (request.aprobadoJefatura === true && request.aprobadoRH === true) {
    return { label: 'Aprobada', color: 'green', status: 'approved' };
  }
  if (request.aprobadoJefatura === true && request.aprobadoRH === null) {
    return { label: 'En RH', color: 'blue', status: 'in_rh' };
  }
  return { label: 'Pendiente', color: 'yellow', status: 'pending' };
};

const colorMap = {
  red: 'bg-red-100 text-red-800',
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
};

const RequestList = () => {
  const navigate = useNavigate();
  const { vacacionesRequests, loading, userDepartmentRole } = useVacaciones();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;
  const [showFormModal, setShowFormModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [filters, setFilters] = useState({ estado: '', fechaDesde: '', fechaHasta: '' });

  const filteredRequests = useMemo(() => {
    let requests = vacacionesRequests.filter(r => r.createdBy.email === userEmail);

    if (filters.estado) {
      requests = requests.filter(r => getStatusInfo(r).status === filters.estado);
    }

    if (filters.fechaDesde) {
      const desde = new Date(filters.fechaDesde + 'T00:00:00');
      requests = requests.filter(r => r.fechaInicio && new Date(r.fechaInicio + 'T00:00:00') >= desde);
    }

    if (filters.fechaHasta) {
      const hasta = new Date(filters.fechaHasta + 'T23:59:59');
      requests = requests.filter(r => r.fechaInicio && new Date(r.fechaInicio + 'T00:00:00') <= hasta);
    }

    return requests.sort((a, b) => b.created?.getTime() - a.created?.getTime());
  }, [vacacionesRequests, userEmail, filters]);

  const toggleExpand = id => {
    const next = new Set(expandedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedRows(next);
  };

  const clearFilters = () => setFilters({ estado: '', fechaDesde: '', fechaHasta: '' });

  const hasFilters = filters.estado || filters.fechaDesde || filters.fechaHasta;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes de Vacaciones</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredRequests.length} solicitud(es) encontrada(s)</p>
        </div>
        <button
          onClick={() => setShowFormModal(true)}
          className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 hover:bg-blue-900 transition-colors text-sm font-medium shadow-md rounded-lg"
        >
          <Plus size={18} />
          Nueva Solicitud
        </button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filtros</h3>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <X size={16} />
                Limpiar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={filters.estado}
                onChange={e => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="in_rh">En RH</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio Desde</label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={e => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio Hasta</label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={e => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Lista */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText size={64} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
              <p className="text-sm text-gray-500 mb-4">
                {hasFilters ? 'Ajusta los filtros de búsqueda' : 'Aún no has solicitado vacaciones'}
              </p>
              {!hasFilters && (
                <button
                  onClick={() => setShowFormModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus size={16} />
                  Nueva Solicitud
                </button>
              )}
            </div>
          </Card>
        ) : (
          filteredRequests.map(request => {
            const statusInfo = getStatusInfo(request);
            const isExpanded = expandedRows.has(request.id);

            return (
              <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.fechaInicio
                          ? new Date(request.fechaInicio + 'T00:00:00').toLocaleDateString('es-CR')
                          : 'N/A'}{' '}
                        –{' '}
                        {request.fechaFin
                          ? new Date(request.fechaFin + 'T00:00:00').toLocaleDateString('es-CR')
                          : 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.diasHabiles} día(s) hábil(es) • {request.departamento} •{' '}
                        Solicitada el {request.created?.toLocaleDateString('es-CR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorMap[statusInfo.color]}`}>
                        {statusInfo.label}
                      </span>
                      <button
                        onClick={() => toggleExpand(request.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4">
                    {request.motivo && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Motivo / Observaciones</p>
                        <p className="text-sm text-gray-900">{request.motivo}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Cédula</p>
                        <p className="text-sm font-medium">{request.numeroCedula || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Jefatura</p>
                        <p className={`text-sm font-medium ${
                          request.aprobadoJefatura === true ? 'text-green-600'
                          : request.aprobadoJefatura === false ? 'text-red-600'
                          : 'text-gray-500'
                        }`}>
                          {request.aprobadoJefatura === true ? 'Aprobado'
                            : request.aprobadoJefatura === false ? 'Rechazado'
                            : 'Pendiente'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">RH</p>
                        <p className={`text-sm font-medium ${
                          request.aprobadoRH === true ? 'text-green-600'
                          : request.aprobadoRH === false ? 'text-red-600'
                          : 'text-gray-500'
                        }`}>
                          {request.aprobadoRH === true ? 'Aprobado'
                            : request.aprobadoRH === false ? 'Rechazado'
                            : 'Pendiente'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Días hábiles</p>
                        <p className="text-sm font-medium text-blue-600">{request.diasHabiles}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => navigate(`${VACACIONES_ROUTES.REQUESTS}/${request.id}`)}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {showFormModal && (
        <RequestForm
          onClose={() => setShowFormModal(false)}
          initialDepartamento={userDepartmentRole?.department?.departamento || ''}
          initialNombreSolicitante={accounts[0]?.name || ''}
        />
      )}
    </div>
  );
};

export default RequestList;
