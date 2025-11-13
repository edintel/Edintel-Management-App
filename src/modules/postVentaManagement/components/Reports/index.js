import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, Filter, Search, AlertCircle, CheckCircle, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { usePostVentaManagement } from '../../context/postVentaManagementContext';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import * as XLSX from 'xlsx';

const Reports = () => {
  const { serviceTickets, sites, buildings, companies, systems, loadPostVentaData, loading } = usePostVentaManagement();

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    ticketType: '',
    status: '',
    company: '',
    building: '',
    site: ''
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'created',
    direction: 'desc'
  });

  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    // Establecer fechas por defecto (último mes)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    setFilters({
      ...filters,
      dateFrom: lastMonth.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    });
  }, []);


  // Función para calcular días hábiles entre dos fechas
  const calculateBusinessDays = (startDate, endDate) => {
    if (!startDate || !endDate) return null;

    // Normalizar fechas a medianoche para evitar problemas con horas
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // Si las fechas son iguales, retornar 0
    if (start.getTime() === end.getTime()) return 0;

    let businessDays = 0;
    const current = new Date(start);

    // Empezar desde el día siguiente al de inicio
    current.setDate(current.getDate() + 1);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Contar solo de lunes (1) a viernes (5)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return businessDays;
  };

  // Función para formatear fecha y hora
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString)
    return date.toLocaleString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear solo fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CR');
  };

  // Procesar tickets con información adicional
  const processedTickets = useMemo(() => {
    return serviceTickets.map(ticket => {
      const site = sites.find(s => s.id === ticket.siteId);
      const building = site ? buildings.find(b => b.id === site.buildingId) : null;
      const company = building ? companies.find(c => c.id === building.companyId) : null;
      const system = systems.find(s => s.id === ticket.systemId);

      // Calcular tiempo de resolución
      const openDate = ticket.created || ticket.technicianAssignedDate;
      const closeDate = ticket.workEndDate;
      const resolutionDays = calculateBusinessDays(openDate, closeDate);

      // Determinar si cumple SLA (2 días hábiles para correctivos)
      const isCorrectiveType = ticket.type?.includes('Correctiva');
      const meetsSLA = !isCorrectiveType || (resolutionDays !== null && resolutionDays <= 2);

      return {
        ...ticket,
        siteName: site?.name || '-',
        buildingName: building?.name || '-',
        companyName: company?.name || '-',
        systemName: system?.name || '-',
        resolutionDays,
        meetsSLA,
        isCorrectiveType
      };
    });
  }, [serviceTickets, sites, buildings, companies, systems]);


  // Filtrar tickets
  const filteredTickets = useMemo(() => {
    return processedTickets.filter(ticket => {
      // NUEVO: Excluir tickets con esperandoEquipo
      if (ticket.waitingEquiment) {
        return false;
      }

      // Filtro por rango de fechas
      if (filters.dateFrom && filters.dateTo) {
        const ticketDate = new Date(ticket.created);
        const fromDate = new Date(filters.dateFrom);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59); // Incluir todo el día final

        if (ticketDate < fromDate || ticketDate > toDate) {
          return false;
        }
      }

      // Filtro por tipo
      if (filters.ticketType && ticket.type !== filters.ticketType) {
        return false;
      }

      // Filtro por estado
      if (filters.status && ticket.state !== filters.status) {
        return false;
      }

      // Filtro por empresa
      if (filters.company && ticket.companyName !== filters.company) {
        return false;
      }

      // Filtro por edificio
      if (filters.building && ticket.buildingName !== filters.building) {
        return false;
      }

      // Filtro por sitio
      if (filters.site && ticket.siteName !== filters.site) {
        return false;
      }

      return true;
    });
  }, [processedTickets, filters]);

  // Ordenar tickets
  const sortedTickets = useMemo(() => {
    const sorted = [...filteredTickets];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [filteredTickets, sortConfig]);

  // Estadísticas
  const statistics = useMemo(() => {

   

    const correctiveTickets = filteredTickets.filter(t => t.isCorrectiveType);
    // Filtrar por tickets que tengan workEndDate (trabajo finalizado)
    const completedCorrectiveTickets = correctiveTickets.filter(t => t.workEndDate);
    const meetingSLA = completedCorrectiveTickets.filter(t => t.meetsSLA);

    return {
      total: filteredTickets.length,
      corrective: correctiveTickets.length,
      preventive: filteredTickets.filter(t => t.type === 'Preventiva').length,
      completed: filteredTickets.filter(t => t.state === 'Cerrada').length,
      inProgress: filteredTickets.filter(t => t.state !== 'Cerrada' && t.state !== 'Iniciada').length,
      pending: filteredTickets.filter(t => t.state === 'Iniciada').length,
      slaCompliance: completedCorrectiveTickets.length > 0
        ? Math.round((meetingSLA.length / completedCorrectiveTickets.length) * 100)
        : 100,
      avgResolutionTime: completedCorrectiveTickets.length > 0
        ? Math.round(completedCorrectiveTickets.reduce((acc, t) => acc + (t.resolutionDays || 0), 0) / completedCorrectiveTickets.length * 10) / 10
        : 0
    };
  }, [filteredTickets]);

  // Manejar cambios en filtros
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Manejar ordenamiento
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Toggle fila expandida
  const toggleRowExpansion = (ticketId) => {
    setExpandedRows(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const exportData = sortedTickets.map(ticket => ({
      'ST': ticket.stNumber || '-',
      'Estado': ticket.state || '-',
      'Tipo': ticket.type || '-',
      'Descripción': ticket.scope || '-',
      'Empresa': ticket.companyName,
      'Edificio': ticket.buildingName,
      'Sitio': ticket.siteName,
      'Sistema': ticket.systemName,
      'Fecha Creación': formatDateTime(ticket.created),
      'Fecha Técnico Asignado': formatDateTime(ticket.technicianAssignedDate),
      'Fecha Confirmación': formatDateTime(ticket.confirmationDate),
      'Fecha Trabajo Iniciado': formatDateTime(ticket.workStartDate),
      'Fecha Trabajo Finalizado': formatDateTime(ticket.workEndDate),
      'Fecha Cierre': formatDateTime(ticket.closeDate),
      'Días Resolución': ticket.resolutionDays || '-',
      'Cumple (2 días)': ticket.isCorrectiveType ? (ticket.meetsSLA ? 'Sí' : 'No') : 'N/A',
      'Técnicos Asignados': ticket.technicians?.map(t => t.LookupValue).join(', ') || '-',
      'Notas': ticket.notes || '-',
      'Link': ticket.link || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Tickets');

    // Ajustar anchos de columna
    const maxWidth = 50;
    const wscols = [
      { wch: 15 }, // ST
      { wch: 20 }, // Estado
      { wch: 20 }, // Tipo
      { wch: maxWidth }, // Descripción
      { wch: 25 }, // Empresa
      { wch: 25 }, // Edificio
      { wch: 25 }, // Sitio
      { wch: 20 }, // Sistema
      { wch: 20 }, // Fecha Creación
      { wch: 20 }, // Fecha Técnico Asignado
      { wch: 20 }, // Fecha Confirmación
      { wch: 20 }, // Fecha Trabajo Iniciado
      { wch: 20 }, // Fecha Trabajo Finalizado
      { wch: 20 }, // Fecha Cierre
      { wch: 15 }, // Días Resolución
      { wch: 15 }, // Cumple SLA
      { wch: 30 }, // Técnicos
      { wch: maxWidth }, // Notas
      { wch: 30 }  // Link
    ];
    ws['!cols'] = wscols;

    const fileName = `Reporte_Tickets_${filters.dateFrom}_${filters.dateTo}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getSortIcon = (column) => {
    if (sortConfig.key !== column) {
      return null;
    }
    return sortConfig.direction === 'asc' ?
      <ChevronUp className="inline w-4 h-4 ml-1" /> :
      <ChevronDown className="inline w-4 h-4 ml-1" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Reportes de Gestión Post Venta
        </h1>
        <p className="text-gray-600">
          Análisis de cumplimiento de tiempos de atención
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="p-4">
            <div className="text-3xl font-bold">{statistics.total}</div>
            <div className="text-blue-100">Total de Tickets</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="p-4">
            <div className="text-3xl font-bold">{statistics.slaCompliance}%</div>
            <div className="text-green-100">Cumplimiento</div>
            <div className="text-xs text-green-200 mt-1">
              (Correctivos ≤ 2 días hábiles)
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <div className="p-4">
            <div className="text-3xl font-bold">{statistics.avgResolutionTime}</div>
            <div className="text-yellow-100">Días Promedio Resolución</div>
            <div className="text-xs text-yellow-200 mt-1">
              (Solo correctivos cerrados)
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="p-4">
            <div className="text-3xl font-bold">{statistics.completed}</div>
            <div className="text-purple-100">Tickets Cerrados</div>
            <div className="text-xs text-purple-200 mt-1">
              {statistics.inProgress} en progreso | {statistics.pending} pendientes
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <Filter className="mr-2" size={20} />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Ticket
              </label>
              <select
                value={filters.ticketType}
                onChange={(e) => handleFilterChange('ticketType', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos</option>
                <option value="Correctiva-Cobrable">Correctiva Cobrable</option>
                <option value="Correctiva-No Cobrable">Correctiva No Cobrable</option>
                <option value="Preventiva">Preventiva</option>
                <option value="Instalación">Instalación</option>
                <option value="Proyectos">Proyectos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos</option>
                <option value="Iniciada">Iniciada</option>
                <option value="Técnico asignado">Técnico asignado</option>
                <option value="Confirmado por técnico">Confirmado por técnico</option>
                <option value="Trabajo iniciado">Trabajo iniciado</option>
                <option value="Finalizada">Finalizada</option>
                <option value="Cerrada">Cerrada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa
              </label>
              <select
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas</option>
                {[...new Set(processedTickets.map(t => t.companyName))].sort().map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edificio
              </label>
              <select
                value={filters.building}
                onChange={(e) => handleFilterChange('building', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!filters.company}
              >
                <option value="">Todos</option>
                {filters.company &&
                  [...new Set(processedTickets
                    .filter(t => t.companyName === filters.company)
                    .map(t => t.buildingName))].sort().map(building => (
                      <option key={building} value={building}>{building}</option>
                    ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sitio
              </label>
              <select
                value={filters.site}
                onChange={(e) => handleFilterChange('site', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!filters.building}
              >
                <option value="">Todos</option>
                {filters.building &&
                  [...new Set(processedTickets
                    .filter(t => t.buildingName === filters.building)
                    .map(t => t.siteName))].sort().map(site => (
                      <option key={site} value={site}>{site}</option>
                    ))
                }
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters({
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                    ticketType: '',
                    status: '',
                    company: '',
                    building: '',
                    site: ''
                  });
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de resultados */}
      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Detalle de Tickets ({sortedTickets.length} registros)
            </h2>
            <Button
              variant="primary"
              startIcon={<Download size={16} />}
              onClick={exportToExcel}
              disabled={sortedTickets.length === 0}
            >
              Exportar a Excel
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-3 text-left"></th>
                  <th
                    className="px-2 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('stNumber')}
                  >
                    ST {getSortIcon('stNumber')}
                  </th>
                  <th
                    className="px-2 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('state')}
                  >
                    Estado {getSortIcon('state')}
                  </th>
                  <th
                    className="px-2 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    Tipo {getSortIcon('type')}
                  </th>
                  <th className="px-2 py-3 text-left">Empresa</th>
                  <th className="px-2 py-3 text-left">Sitio</th>
                  <th
                    className="px-2 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created')}
                  >
                    Fecha Apertura {getSortIcon('created')}
                  </th>
                  <th
                    className="px-2 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('workEndDate')}
                  >
                    Fecha Trabajo Finalizado {getSortIcon('workEndDate')}
                  </th>
                  <th
                    className="px-2 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('closeDate')}
                  >
                    Fecha Cierre {getSortIcon('closeDate')}
                  </th>
                  <th
                    className="px-2 py-3 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('resolutionDays')}
                  >
                    Días {getSortIcon('resolutionDays')}
                  </th>
                  <th className="px-2 py-3 text-center">Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8">
                      <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedTickets.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-gray-500">
                      No se encontraron tickets con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  sortedTickets.map(ticket => (
                    <React.Fragment key={ticket.id}>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-2 py-2">
                          <button
                            onClick={() => toggleRowExpansion(ticket.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedRows[ticket.id] ?
                              <ChevronUp size={16} /> :
                              <ChevronDown size={16} />
                            }
                          </button>
                        </td>
                        <td className="px-2 py-2 font-medium">{ticket.stNumber || '-'}</td>
                        <td className="px-2 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${ticket.state === 'Cerrada' ? 'bg-green-100 text-green-800' :
                            ticket.state === 'Iniciada' ? 'bg-gray-100 text-gray-800' :
                              ticket.state === 'Trabajo iniciado' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {ticket.state}
                          </span>
                        </td>
                        <td className="px-2 py-2">{ticket.type || '-'}</td>
                        <td className="px-2 py-2">{ticket.companyName}</td>
                        <td className="px-2 py-2">{ticket.siteName}</td>
                        <td className="px-2 py-2">{formatDate(ticket.created)}</td>
                        <td className="px-2 py-2">{formatDate(ticket.workEndDate)}</td>
                        <td className="px-2 py-2">{formatDate(ticket.closeDate)}</td>
                        <td className="px-2 py-2 text-center">
                          {ticket.resolutionDays || '-'}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {ticket.isCorrectiveType ? (
                            ticket.meetsSLA ? (
                              <CheckCircle className="inline text-green-600" size={16} />
                            ) : (
                              <AlertCircle className="inline text-red-600" size={16} />
                            )
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                      {expandedRows[ticket.id] && (
                        <tr className="bg-gray-50">
                          <td colSpan="10" className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h4 className="font-semibold mb-2">Información General</h4>
                                <div className="space-y-1">
                                  <div><span className="font-medium">Alcance:</span> {ticket.scope || '-'}</div>
                                  <div><span className="font-medium">Sistema:</span> {ticket.systemName}</div>
                                  <div><span className="font-medium">Edificio:</span> {ticket.buildingName}</div>
                                  <div><span className="font-medium">Técnicos:</span> {ticket.technicians?.map(t => t.LookupValue).join(', ') || '-'}</div>
                                  {ticket.notes && (
                                    <div><span className="font-medium">Notas:</span> {ticket.notes}</div>
                                  )}
                                  {ticket.link && (
                                    <div>
                                      <span className="font-medium">Link:</span>
                                      <a href={ticket.link} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline">
                                        Ver documento
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Línea de Tiempo</h4>
                                <div className="space-y-1">
                                  <div><span className="font-medium">Creación:</span> {formatDateTime(ticket.created)}</div>
                                  {ticket.technicianAssignedDate && (
                                    <div><span className="font-medium">Técnico Asignado:</span> {formatDateTime(ticket.technicianAssignedDate)}</div>
                                  )}
                                  {ticket.confirmationDate && (
                                    <div><span className="font-medium">Confirmación:</span> {formatDateTime(ticket.confirmationDate)}</div>
                                  )}
                                  {ticket.workStartDate && (
                                    <div><span className="font-medium">Trabajo Iniciado:</span> {formatDateTime(ticket.workStartDate)}</div>
                                  )}
                                  {ticket.workEndDate && (
                                    <div><span className="font-medium">Trabajo Finalizado:</span> {formatDateTime(ticket.workEndDate)}</div>
                                  )}
                                  {ticket.workEndDate && (
                                    <div><span className="font-medium">Cierre:</span> {formatDateTime(ticket.closeDate)}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="text-green-600 mr-1" size={14} />
                <span>Cumple (≤2 días hábiles)</span>
              </div>
              <div className="flex items-center">
                <AlertCircle className="text-red-600 mr-1" size={14} />
                <span>No cumple  (2 días hábiles)</span>
              </div>
              <div className="flex items-center">
                <Clock className="text-gray-400 mr-1" size={14} />
                <span>Aplica solo para tickets correctivos</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Reports;