// src/modules/extraHours/components/Approvals/Approvals.js
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExtraHours } from '../../context/extraHoursContext';
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
  XCircle
} from 'lucide-react';
import { EXTRA_HOURS_ROUTES } from '../../routes';
import {
  canApproveRequest,
  getApprovalTypeByRole,
  getRequestStatus
} from '../../../../utils/permissions.helper';

const Approvals = () => {
  const navigate = useNavigate();
  const { extraHoursRequests, loading, service, userDepartmentRole, updateApprovalStatus } = useExtraHours();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;


  const [filters, setFilters] = useState({
    st: '',
    dia: '',
    cliente: '',
    estado: '',
  });

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [processingId, setProcessingId] = useState(null);

  // Función para formatear fecha sin problemas de zona horaria
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Extraer solo la parte de fecha (YYYY-MM-DD)
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    // Crear fecha local (sin conversión de zona horaria)
    return new Date(year, month - 1, day).toLocaleDateString('es-CR');
  };


  const canAccessApprovals = useMemo(() => {
    const role = userDepartmentRole?.role;


    const roles = Array.isArray(role) ? role : (role ? [role] : []);

    const hasAccess = roles.some(r =>
      r === 'Administrador' || r === 'AsistenteJefatura' || r === 'Jefatura'
    );

    return hasAccess;
  }, [userDepartmentRole]);


  const getPrimaryRole = () => {
    const role = userDepartmentRole?.role;

    if (!role) return null;

    const roles = Array.isArray(role) ? role : [role];

    // Prioridad: Administrador > Jefatura > AsistenteJefatura > Colaborador
    if (roles.includes('Administrador')) return 'Administrador';
    if (roles.includes('Jefatura')) return 'Jefatura';
    if (roles.includes('AsistenteJefatura')) return 'AsistenteJefatura';
    return roles[0];
  };

  // Filtrar solicitudes para aprobación
  const approvalsRequests = useMemo(() => {
    if (!canAccessApprovals) {
      return [];
    }

    let requests = extraHoursRequests;
    const role = getPrimaryRole();
    const department = userDepartmentRole?.department?.departamento;

    if (role === 'Administrador') {
      // Administradores ven TODO sin filtros
      // No aplicamos ningún filtro, mantener todas las solicitudes
    }
    else if (role === 'AsistenteJefatura' || role === 'Jefatura') {
      // Filtrar por departamento (TODAS las del departamento)
      requests = requests.filter(req => req.departamento === department);

      // Para AsistenteJefatura: mostrar TODAS las solicitudes del departamento
      // Para Jefatura: mostrar TODAS las que pasaron por AsistenteJefatura (revisadoAsistente !== null)
      if (role === 'Jefatura') {
        requests = requests.filter(req => {
          // Jefatura solo ve las que pasaron por AsistenteJefatura
          const pasoAsistente = req.revisadoAsistente !== null;
          return pasoAsistente;
        });
      }
    }

    // Aplicar filtros adicionales
    if (filters.st || filters.dia || filters.cliente || filters.estado) {
      requests = requests.filter(request => {
        // Verificar que extrasInfo exista y sea un array
        const hasExtrasInfo = Array.isArray(request.extrasInfo) && request.extrasInfo.length > 0;

        // Filtrar por ST
        const matchesST = !filters.st || (hasExtrasInfo && request.extrasInfo.some(
          extra => extra.st && extra.st.toLowerCase().includes(filters.st.toLowerCase())
        ));

        // Filtrar por fecha
        const matchesDia = !filters.dia || (hasExtrasInfo && request.extrasInfo.some(extra => {
          if (!extra.dia) return false;
          // Extraer solo la parte de fecha sin procesar con Date (evita problemas de zona horaria)
          // extra.dia viene en formato YYYY-MM-DD desde SharePoint
          const extraDate = extra.dia.split('T')[0]; // Obtener solo la parte de fecha
          return extraDate === filters.dia;
        }));

        // Filtrar por cliente
        const matchesCliente = !filters.cliente || (hasExtrasInfo && request.extrasInfo.some(
          extra => extra.nombreCliente && extra.nombreCliente.toLowerCase().includes(filters.cliente.toLowerCase())
        ));

        // Filtrar por estado
        let matchesEstado = true;
        if (filters.estado) {
          const statusInfo = getRequestStatus(request);
          if (filters.estado === 'pendiente') {
            matchesEstado = statusInfo.status === 'pending' ||
              statusInfo.status === 'in_jefatura' ||
              statusInfo.status === 'in_rh';
          } else if (filters.estado === 'aprobada') {
            matchesEstado = statusInfo.status === 'approved';
          } else if (filters.estado === 'rechazada') {
            matchesEstado = statusInfo.status === 'rejected';
          }
        }

        return matchesST && matchesDia && matchesCliente && matchesEstado;
      });
    }

    return requests.sort((a, b) => b.created?.getTime() - a.created?.getTime());
  }, [extraHoursRequests, userDepartmentRole, canAccessApprovals, filters]);

  // Manejar aprobación/rechazo usando el helper
  const handleApprovalAction = async (requestId, approved) => {
    const request = approvalsRequests.find(r => r.id === requestId);

    if (!request) {
      alert('No se encontró la solicitud');
      return;
    }

    const role = getPrimaryRole();

    // Crear un userDepartmentRole temporal con rol único
    const tempUserDeptRole = {
      ...userDepartmentRole,
      role: role
    };

    // Verificar permisos usando el helper
    if (!canApproveRequest(request, tempUserDeptRole)) {
      alert('No tienes permisos para aprobar esta solicitud en esta etapa');
      return;
    }

    const approvalType = getApprovalTypeByRole(role);

    if (!approvalType) {
      alert('Rol no válido para aprobación');
      return;
    }

    setProcessingId(requestId);

    try {
      await updateApprovalStatus(requestId, approvalType, approved);
    } catch (error) {
      alert('Error al procesar la aprobación. Por favor intenta de nuevo.');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleRowExpansion = (requestId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRows(newExpanded);
  };

  const clearFilters = () => {
    setFilters({
      st: '',
      dia: '',
      cliente: '',
      estado: '',
    });
  };

  const handleViewDetails = (request) => {
    // Pasar el parámetro 'from' para saber desde dónde se navegó
    navigate(`${EXTRA_HOURS_ROUTES.REQUESTS}/${request.id}?from=approvals`);
  };

  // Status badge usando el helper
  const getStatusBadge = (request) => {
    const statusInfo = getRequestStatus(request);

    const colorClasses = {
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      rejected: <X size={14} className="mr-1" />,
      approved: <Check size={14} className="mr-1" />,
      in_rh: <Clock size={14} className="mr-1" />,
      in_jefatura: <Clock size={14} className="mr-1" />,
      pending: <AlertTriangle size={14} className="mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo.color]}`}>
        {icons[statusInfo.status]}
        {statusInfo.label}
      </span>
    );
  };

  // Si no tiene acceso, mostrar mensaje
  if (!canAccessApprovals) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle size={64} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Acceso no autorizado
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              No tienes permisos para acceder a la sección de aprobaciones
            </p>
            <Button variant="outline" onClick={() => navigate(EXTRA_HOURS_ROUTES.DASHBOARD)}>
              Volver al Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Historial de Aprobaciones de Horas Extras
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {getPrimaryRole() === 'Administrador'
            ? 'Historial completo de TODAS las solicitudes de TODOS los departamentos (sin importar el estado)'
            : `Historial completo de solicitudes del departamento de ${userDepartmentRole?.department?.departamento}`}
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
            {(filters.st || filters.dia || filters.cliente || filters.estado) && (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ST (Service Ticket)
              </label>
              <input
                type="text"
                value={filters.st}
                onChange={(e) => setFilters(prev => ({ ...prev, st: e.target.value }))}
                placeholder="Buscar por ST..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Día
              </label>
              <input
                type="date"
                value={filters.dia}
                onChange={(e) => setFilters(prev => ({ ...prev, dia: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <input
                type="text"
                value={filters.cliente}
                onChange={(e) => setFilters(prev => ({ ...prev, cliente: e.target.value }))}
                placeholder="Buscar por cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobada">Aprobadas</option>
                <option value="rechazada">Rechazadas</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Solicitudes */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </Card>
        ) : approvalsRequests.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText size={64} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay solicitudes en el historial
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {filters.st || filters.dia || filters.cliente || filters.estado
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay solicitudes en tu historial de aprobaciones'}
              </p>
              {(filters.st || filters.dia || filters.cliente || filters.estado) && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </Card>
        ) : (
          approvalsRequests.map((request) => {
            const role = getPrimaryRole();
            const tempUserDeptRole = { ...userDepartmentRole, role };
            const canApprove = canApproveRequest(request, tempUserDeptRole);

            return (
              <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Solicitud de {request.nombreSolicitante?.displayName || request.createdBy.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {request.departamento} • {request.fechaPeticion?.toLocaleDateString('es-CR')} • {request.extrasInfo?.length || 0} entradas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Indicador de acción requerida */}
                      {canApprove && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                          <AlertTriangle size={14} className="mr-1" />
                          Requiere tu acción
                        </span>
                      )}
                      {getStatusBadge(request)}
                      <button
                        onClick={() => toggleRowExpansion(request.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {expandedRows.has(request.id) ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contenido expandible */}
                {expandedRows.has(request.id) && (
                  <div className="p-4">
                    {/* Información General */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Horas</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {service?.calculateTotalHours(request.extrasInfo).toFixed(2)} hrs
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cédula</p>
                        <p className="text-sm font-medium text-gray-900">
                          {request.numeroCedula || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Creada</p>
                        <p className="text-sm font-medium text-gray-900">
                          {request.created?.toLocaleDateString('es-CR')}
                        </p>
                      </div>
                    </div>

                    {/* Tabla de Detalles */}
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Día</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora Inicio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora Fin</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ST</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {request.extrasInfo?.map((extra, index) => {
                            const hours = service?.calculateTotalHours([extra]) || 0;
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {formatDate(extra.dia)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{extra.horaInicio || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{extra.horaFin || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{extra.st || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{extra.nombreCliente || '-'}</td>
                                <td className="px-4 py-3 text-sm font-medium text-blue-600">
                                  {hours.toFixed(2)} hrs
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleViewDetails(request)}
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