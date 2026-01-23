// src/modules/extraHours/components/Request/RequestList.js
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExtraHours } from '../../context/extraHoursContext';
import { useMsal } from '@azure/msal-react';
import Card from '../../../../components/common/Card';
import Table from '../../../../components/common/Table';
import Button from '../../../../components/common/Button';
import {
  Search,
  Filter,
  X,
  Clock,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText
} from 'lucide-react';
import { EXTRA_HOURS_ROUTES } from '../../routes';
import {
  dividirHorasPorSegmento,
  redondearMediaHora
} from '../Service/InsideServices/ExtraHoursCalculationService';

const RequestList = ({ showApprovals = false }) => {
  const navigate = useNavigate();
  const { extraHoursRequests, loading, service, userDepartmentRole } = useExtraHours();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;

  // Estados para filtros
  const [filters, setFilters] = useState({
    st: '',
    dia: '',
    cliente: '',
  });

  // Estado para expandir/contraer filas
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Función para formatear fecha sin problemas de zona horaria
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('es-CR');
  };

  // Filtrar solicitudes según el rol y vista
  const filteredRequests = useMemo(() => {
    let requests = extraHoursRequests;

    if (showApprovals) {
      if (userDepartmentRole?.role === 'Colaborador') {
        return [];
      }
      requests = service?.filterRequestsByDepartment(requests, userDepartmentRole) || [];
    } else {
      requests = requests.filter(req => req.createdBy.email === userEmail);
    }

    if (filters.st || filters.dia || filters.cliente) {
      requests = requests.filter(request => {
        if (!Array.isArray(request.extrasInfo) || request.extrasInfo.length === 0) {
          return false;
        }

        const matchesST = !filters.st || request.extrasInfo.some(
          extra => extra.st && extra.st.toLowerCase().includes(filters.st.toLowerCase())
        );

        const matchesDia = !filters.dia || request.extrasInfo.some(extra => {
          if (!extra.dia) return false;
          const extraDate = extra.dia.split('T')[0];
          return extraDate === filters.dia;
        });

        const matchesCliente = !filters.cliente || request.extrasInfo.some(
          extra => extra.nombreCliente && extra.nombreCliente.toLowerCase().includes(filters.cliente.toLowerCase())
        );

        return matchesST && matchesDia && matchesCliente;
      });
    }

    return requests.sort((a, b) => b.created?.getTime() - a.created?.getTime());
  }, [extraHoursRequests, userEmail, userDepartmentRole, showApprovals, filters, service]);

  // Toggle expansión de fila
  const toggleRowExpansion = (requestId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRows(newExpanded);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      st: '',
      dia: '',
      cliente: '',
    });
  };

  // Navegar al detalle
  const handleRequestClick = (request) => {
    navigate(`${EXTRA_HOURS_ROUTES.REQUESTS}/${request.id}?from=requests`);
  };

  // Función para obtener badge de estado
  const getStatusBadge = (request) => {
    const approvalStatus = service?.getApprovalStatusSummary(request);

    if (
      request.revisadoAsistente === false ||
      request.aprobadoJefatura === false ||
      request.aprobadoRH === false ||
      request.revisadoConta === false
    ) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X size={14} className="mr-1" />
          No aprobada
        </span>
      );
    }

    if (approvalStatus?.allApproved) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check size={14} className="mr-1" />
          Aprobada
        </span>
      );
    }

    if (request.aprobadoJefatura && !request.aprobadoRH) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock size={14} className="mr-1" />
          En RH
        </span>
      );
    }

    if (request.revisadoAsistente && !request.aprobadoJefatura) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock size={14} className="mr-1" />
          En Jefatura
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertTriangle size={14} className="mr-1" />
        Pendiente
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {showApprovals ? 'Solicitudes para Aprobar' : 'Mis Solicitudes de Horas Extras'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {showApprovals 
            ? 'Revisa y aprueba las solicitudes de tu departamento'
            : 'Listado completo de tus solicitudes registradas'}
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
            {(filters.st || filters.dia || filters.cliente) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <X size={16} />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro ST */}
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

            {/* Filtro Día */}
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

            {/* Filtro Cliente */}
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
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText size={64} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron solicitudes
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {filters.st || filters.dia || filters.cliente
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay solicitudes registradas'}
              </p>
              {(filters.st || filters.dia || filters.cliente) && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Header de la solicitud */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Solicitud del {request.fechaPeticion?.toLocaleDateString('es-CR')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.departamento} • {request.extrasInfo?.length || 0} entradas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
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
                      <p className="text-xs text-gray-500 mb-1">Solicitante</p>
                      <p className="text-sm font-medium text-gray-900">
                        {request.nombreSolicitante?.displayName || request.createdBy.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Cédula</p>
                      <p className="text-sm font-medium text-gray-900">
                        {request.numeroCedula || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Tabla de Detalles */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Día
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            ST
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Hora Inicio
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Hora Final
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Cliente
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Horas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {request.extrasInfo?.map((extra, index) => {
                          // ✅ Calcular horas con redondeo
                          let horasCalculadas = 0;
                          if (extra.dia && extra.horaInicio && extra.horaFin) {
                            const { horasDiurnas, horasNocturnas } = dividirHorasPorSegmento(
                              extra.horaInicio,
                              extra.horaFin
                            );
                            horasCalculadas = horasDiurnas + horasNocturnas;
                          }
                          const horasRedondeadas = redondearMediaHora(horasCalculadas);

                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatDate(extra.dia)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {extra.st || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {extra.horaInicio || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {extra.horaFin || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {extra.nombreCliente || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-blue-600">
                                {horasRedondeadas.toFixed(2)} hrs
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Botón Ver Detalles Completos */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleRequestClick(request)}
                    >
                      Ver detalles completos
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RequestList;