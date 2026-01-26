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
  XCircle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { EXTRA_HOURS_ROUTES } from '../../routes';
import {
  canApproveRequest,
  getApprovalTypeByRole,
  getRequestStatus
} from '../../../../utils/permissions.helper';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Approvals = () => {
  const navigate = useNavigate();
  const { extraHoursRequests, loading, service, userDepartmentRole, updateApprovalStatus, roles } = useExtraHours();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;


  const [filters, setFilters] = useState({
    st: '',
    persona: '',
    cliente: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
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



  let requests = extraHoursRequests;
  const role = getPrimaryRole();
  const department = userDepartmentRole?.department?.departamento;



  if (role === 'Administrador') {
    console.log('✅ Administrador - Mostrando TODAS las solicitudes sin filtros');
    // Administradores ven TODO sin filtros
    // No aplicamos ningún filtro, mantener todas las solicitudes
  }
  else if (role === 'AsistenteJefatura' || role === 'Jefatura') {

    requests = requests.filter(req => req.departamento === department);

    if (role === 'Jefatura') {

      const antesJefatura = requests.length;

      requests = requests.filter(req => {
        const pasoAsistente = req.revisadoAsistente !== null;
        return pasoAsistente;
      });


    }
  }

  // Aplicar filtros
  if (filters.st) {
    requests = requests.filter(req =>
      req.extrasInfo?.some(extra =>
        extra.st?.toLowerCase().includes(filters.st.toLowerCase())
      )
    );
  }

  if (filters.persona) {
    requests = requests.filter(req => {
      const nombreCompleto = (req.nombreSolicitante?.displayName || req.createdBy?.name || '').toLowerCase();
      return nombreCompleto.includes(filters.persona.toLowerCase());
    });
  }

  if (filters.cliente) {
    requests = requests.filter(req =>
      req.extrasInfo?.some(extra =>
        extra.nombreCliente?.toLowerCase().includes(filters.cliente.toLowerCase())
      )
    );
  }

  if (filters.estado) {
    requests = requests.filter(req => {
      const status = getRequestStatus(req);
      if (filters.estado === 'pendiente') {
        return status.status === 'pending' || status.status === 'in_jefatura' || status.status === 'in_rh';
      }
      if (filters.estado === 'aprobada') {
        return status.status === 'approved';
      }
      if (filters.estado === 'rechazada') {
        return status.status === 'rejected';
      }
      return true;
    });
  }

  // Filtro por rango de fechas de creación
  if (filters.fechaDesde) {
    const [year, month, day] = filters.fechaDesde.split('-');
    const fechaDesde = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
    requests = requests.filter(req => {
      if (!req.created) return false;
      const fechaCreacion = new Date(req.created);
      const fechaCreacionNormalizada = new Date(
        fechaCreacion.getFullYear(),
        fechaCreacion.getMonth(),
        fechaCreacion.getDate(),
        0, 0, 0, 0
      );
      return fechaCreacionNormalizada >= fechaDesde;
    });
  }

  if (filters.fechaHasta) {
    const [year, month, day] = filters.fechaHasta.split('-');
    const fechaHasta = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);
    requests = requests.filter(req => {
      if (!req.created) return false;
      const fechaCreacion = new Date(req.created);
      const fechaCreacionNormalizada = new Date(
        fechaCreacion.getFullYear(),
        fechaCreacion.getMonth(),
        fechaCreacion.getDate(),
        fechaCreacion.getHours(),
        fechaCreacion.getMinutes(),
        fechaCreacion.getSeconds(),
        fechaCreacion.getMilliseconds()
      );
      return fechaCreacionNormalizada <= fechaHasta;
    });
  }

  return requests.sort((a, b) => b.created?.getTime() - a.created?.getTime());
}, [extraHoursRequests, canAccessApprovals, userDepartmentRole, filters, getPrimaryRole, getRequestStatus, service]);

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
      persona: '',
      cliente: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: '',
    });
  };

  const handleViewDetails = (request) => {
    // Pasar el parámetro 'from' para saber desde dónde se navegó
    navigate(`${EXTRA_HOURS_ROUTES.REQUESTS}/${request.id}?from=approvals`);
  };

  // Función para exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation

    // Título
    doc.setFontSize(16);
    doc.text('Historial de Aprobaciones de Horas Extras', 14, 15);

    // Subtítulo con fecha
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CR')}`, 14, 22);

    // Preparar datos para la tabla
    const tableData = [];
    approvalsRequests.forEach(request => {
      const status = getRequestStatus(request);
      request.extrasInfo?.forEach(extra => {
        const hours = service?.calculateTotalHours([extra]) || 0;
        tableData.push([
          request.nombreSolicitante?.displayName || request.createdBy.name,
          request.departamento,
          formatDate(extra.dia),
          extra.horaInicio || '-',
          extra.horaFin || '-',
          extra.st || '-',
          extra.nombreCliente || '-',
          hours.toFixed(2),
          status.label,
          request.created?.toLocaleDateString('es-CR') || 'N/A'
        ]);
      });
    });

    // Generar tabla
    autoTable(doc, {
      startY: 28,
      head: [['Solicitante', 'Departamento', 'Día', 'Hora Inicio', 'Hora Fin', 'ST', 'Cliente', 'Horas', 'Estado', 'Fecha Creación']],
      body: tableData,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // Guardar PDF
    doc.save(`historial-aprobaciones-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Función para exportar a Excel
  const exportToExcel = () => {
    // Preparar datos para Excel
    const excelData = [];
    approvalsRequests.forEach(request => {
      const status = getRequestStatus(request);
      request.extrasInfo?.forEach(extra => {
        const hours = service?.calculateTotalHours([extra]) || 0;
        excelData.push({
          'Solicitante': request.nombreSolicitante?.displayName || request.createdBy.name,
          'Departamento': request.departamento,
          'Cédula': request.numeroCedula || 'N/A',
          'Día': formatDate(extra.dia),
          'Hora Inicio': extra.horaInicio || '-',
          'Hora Fin': extra.horaFin || '-',
          'ST': extra.st || '-',
          'Cliente': extra.nombreCliente || '-',
          'Horas': hours.toFixed(2),
          'Estado': status.label,
          'Fecha Creación': request.created?.toLocaleDateString('es-CR') || 'N/A'
        });
      });
    });

    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial Aprobaciones');

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 25 }, // Solicitante
      { wch: 15 }, // Departamento
      { wch: 12 }, // Cédula
      { wch: 12 }, // Día
      { wch: 12 }, // Hora Inicio
      { wch: 12 }, // Hora Fin
      { wch: 15 }, // ST
      { wch: 20 }, // Cliente
      { wch: 8 },  // Horas
      { wch: 15 }, // Estado
      { wch: 15 }  // Fecha Creación
    ];
    ws['!cols'] = columnWidths;

    // Guardar Excel
    XLSX.writeFile(wb, `historial-aprobaciones-${new Date().toISOString().split('T')[0]}.xlsx`);
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

      {/* Filtros y Exportación */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filtros</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Botones de exportación */}
              <Button
                variant="outline"
                size="small"
                onClick={exportToPDF}
                disabled={approvalsRequests.length === 0}
                startIcon={<Download size={16} />}
              >
                PDF
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={exportToExcel}
                disabled={approvalsRequests.length === 0}
                startIcon={<FileSpreadsheet size={16} />}
              >
                Excel
              </Button>
              {(filters.st || filters.persona || filters.cliente || filters.estado || filters.fechaDesde || filters.fechaHasta) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-2"
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                Solicitante
              </label>
              <select
                value={filters.persona}
                onChange={(e) => setFilters(prev => ({ ...prev, persona: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {roles && roles
                  .filter(role => role.empleado && role.empleado.displayName) // Filtrar solo roles con empleado válido
                  .sort((a, b) => {
                    const nameA = a.empleado?.displayName || '';
                    const nameB = b.empleado?.displayName || '';
                    return nameA.localeCompare(nameB);
                  })
                  .reduce((uniqueRoles, role) => {
                    // Eliminar duplicados basados en displayName
                    const displayName = role.empleado.displayName;
                    if (!uniqueRoles.find(r => r.empleado.displayName === displayName)) {
                      uniqueRoles.push(role);
                    }
                    return uniqueRoles;
                  }, [])
                  .map((role, index) => {
                    const displayName = role.empleado.displayName;
                    return (
                      <option key={`${role.empleado.email}-${index}`} value={displayName}>
                        {displayName}
                      </option>
                    );
                  })
                }
              </select>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Creación Desde
              </label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Creación Hasta
              </label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
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
        ) : approvalsRequests.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText size={64} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay solicitudes en el historial
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {filters.st || filters.persona || filters.cliente || filters.estado || filters.fechaDesde || filters.fechaHasta
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay solicitudes en tu historial de aprobaciones'}
              </p>
              {(filters.st || filters.persona || filters.cliente || filters.estado || filters.fechaDesde || filters.fechaHasta) && (
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