import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVacaciones } from '../../context/vacacionesContext';
import { useMsal } from '@azure/msal-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import {
  Filter,
  X,
  Clock,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { VACACIONES_ROUTES } from '../../routes';

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

const Approvals = () => {
  const navigate = useNavigate();
  const { vacacionesRequests, loading, userDepartmentRole, updateApprovalStatus, roles, permissionService } = useVacaciones();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;

  const [filters, setFilters] = useState({
    persona: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
  });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [processingId, setProcessingId] = useState(null);

  const role = userDepartmentRole?.role;
  const department = userDepartmentRole?.department?.departamento;
  // Todos los roles del usuario (puede tener más de uno, ej: Jefatura + Gerencia, Administrador + Gerencia)
  const allRoles = userDepartmentRole?.allRoles || (role ? [role] : []);

  const canAccessApprovals = allRoles.some(r =>
    ['Administrador', 'Jefatura', 'Gerencia', 'GerenciaGeneral'].includes(r)
  );

  const canApproveRequest = request => {
    if (request.aprobadoJefatura === false || request.aprobadoRH === false) return false;

    const requesterHighestRole = permissionService?.getUserHighestRole(request.createdBy?.email) || 'Colaborador';

    if (request.aprobadoJefatura === null) {
      // Jefatura aprueba solicitudes de Colaboradores en su depto
      if (allRoles.includes('Jefatura') && request.departamento === department && requesterHighestRole === 'Colaborador') return true;
      // Gerencia aprueba solicitudes de Jefaturas en su depto
      if (allRoles.includes('Gerencia') && request.departamento === department && requesterHighestRole === 'Jefatura') return true;
      // GerenciaGeneral aprueba solicitudes de Gerencias (de cualquier depto)
      if (allRoles.includes('GerenciaGeneral') && requesterHighestRole === 'Gerencia') return true;
    }

    // Administrador aprueba la etapa final (RH) — sin restricción de departamento
    if (allRoles.includes('Administrador')) {
      return request.aprobadoJefatura === true && request.aprobadoRH === null;
    }

    return false;
  };

  const approvalsRequests = useMemo(() => {
    let requests = vacacionesRequests;

    // Administrador y GerenciaGeneral ven TODO — aunque su rol primario sea otro
    const seesAll = allRoles.includes('Administrador') || allRoles.includes('GerenciaGeneral');
    if (!seesAll && (role === 'Jefatura' || role === 'Gerencia')) {
      requests = requests.filter(r => r.departamento === department);
    }
    // Administrador y GerenciaGeneral ven todo

    if (filters.persona) {
      requests = requests.filter(r => {
        const name = (r.nombreSolicitante?.displayName || r.createdBy?.name || '').toLowerCase();
        return name.includes(filters.persona.toLowerCase());
      });
    }

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
  }, [vacacionesRequests, role, department, allRoles, filters]);

  const handleApprovalAction = async (requestId, approved) => {
    const request = approvalsRequests.find(r => r.id === requestId);
    if (!request || !canApproveRequest(request)) {
      alert('No tienes permisos para aprobar esta solicitud en esta etapa');
      return;
    }

    // Determinar etapa por estado de la solicitud, no por rol
    const approvalType = (request.aprobadoJefatura === true && request.aprobadoRH === null)
      ? 'rh'
      : 'jefatura';

    setProcessingId(requestId);
    try {
      await updateApprovalStatus(requestId, approvalType, approved);
    } catch (error) {
      alert('Error al procesar la aprobación. Por favor intenta de nuevo.');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = id => {
    const next = new Set(expandedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedRows(next);
  };

  const clearFilters = () => setFilters({ persona: '', estado: '', fechaDesde: '', fechaHasta: '' });

  const hasFilters = filters.persona || filters.estado || filters.fechaDesde || filters.fechaHasta;

  if (!canAccessApprovals) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle size={64} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso no autorizado</h3>
            <p className="text-sm text-gray-500 mb-4">
              No tienes permisos para acceder a la sección de aprobaciones
            </p>
            <Button variant="outline" onClick={() => navigate(VACACIONES_ROUTES.DASHBOARD)}>
              Volver al Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aprobaciones de Vacaciones</h1>
        <p className="text-sm text-gray-500 mt-1">
          {role === 'Administrador' || role === 'GerenciaGeneral'
            ? 'Todas las solicitudes de todos los departamentos'
            : `Solicitudes del departamento de ${department}`}
        </p>
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
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Solicitante</label>
              <select
                value={filters.persona}
                onChange={e => setFilters(prev => ({ ...prev, persona: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Todos</option>
                {roles && roles
                  .filter(r => r.empleado?.displayName)
                  .sort((a, b) => (a.empleado?.displayName || '').localeCompare(b.empleado?.displayName || ''))
                  .reduce((acc, r) => {
                    if (!acc.find(x => x.empleado.displayName === r.empleado.displayName)) acc.push(r);
                    return acc;
                  }, [])
                  .map((r, i) => (
                    <option key={`${r.empleado.email}-${i}`} value={r.empleado.displayName}>
                      {r.empleado.displayName}
                    </option>
                  ))}
              </select>
            </div>

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
        ) : approvalsRequests.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText size={64} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
              <p className="text-sm text-gray-500 mb-4">
                {hasFilters ? 'Ajusta los filtros de búsqueda' : 'Aún no hay solicitudes en el historial'}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
              )}
            </div>
          </Card>
        ) : (
          approvalsRequests.map(request => {
            const statusInfo = getStatusInfo(request);
            const canApprove = canApproveRequest(request);
            const isExpanded = expandedRows.has(request.id);

            return (
              <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.nombreSolicitante?.displayName || request.createdBy.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.departamento} •{' '}
                        {request.fechaInicio
                          ? new Date(request.fechaInicio + 'T00:00:00').toLocaleDateString('es-CR')
                          : '–'}{' '}
                        al{' '}
                        {request.fechaFin
                          ? new Date(request.fechaFin + 'T00:00:00').toLocaleDateString('es-CR')
                          : '–'}{' '}
                        • {request.diasHabiles} día(s) hábil(es)
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {canApprove && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                          <AlertTriangle size={14} className="mr-1" />
                          Requiere tu acción
                        </span>
                      )}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cédula</p>
                        <p className="text-sm font-medium">{request.numeroCedula || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Días hábiles</p>
                        <p className="text-sm font-medium text-blue-600">{request.diasHabiles}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Jefatura</p>
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
                        <p className="text-xs text-gray-500 mb-1">RH</p>
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
                    </div>

                    {request.motivo && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Motivo</p>
                        <p className="text-sm text-gray-900">{request.motivo}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() =>
                          navigate(`${VACACIONES_ROUTES.REQUESTS}/${request.id}?from=approvals`)
                        }
                      >
                        Ver detalles completos
                      </Button>

                      {canApprove && (
                        <div className="flex items-center gap-3">
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleApprovalAction(request.id, false)}
                            disabled={processingId === request.id}
                            startIcon={<XCircle size={16} />}
                          >
                            {processingId === request.id ? 'Procesando...' : 'Rechazar'}
                          </Button>
                          <Button
                            variant="success"
                            size="small"
                            onClick={() => handleApprovalAction(request.id, true)}
                            disabled={processingId === request.id}
                            startIcon={<CheckCircle size={16} />}
                          >
                            {processingId === request.id ? 'Procesando...' : 'Aprobar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Approvals;
