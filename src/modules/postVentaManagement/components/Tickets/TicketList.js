// src/modules/postVentaManagement/components/Tickets/TicketList.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostVentaManagement } from '../../context/postVentaManagementContext';
import Card from '../../../../components/common/Card';
import Table from '../../../../components/common/Table';
import Button from '../../../../components/common/Button';
import DateRangePicker from '../../../../components/common/DateRangePicker';
import { 
  Search, 
  Filter, 
  Download,
  FileDown,
  Building,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { POST_VENTA_ROUTES } from '../../routes';

const TicketList = () => {
  const navigate = useNavigate();
  const { 
    serviceTickets, 
    getSiteDetails,
    service,
    loading 
  } = usePostVentaManagement();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const handleFileDownload = async (itemId, fileName) => {
    if (!itemId) return;

    try {
      const { url, token } = await service.getImageContent(
        service.siteId,
        service.driveId,
        itemId
      );

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error downloading file');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const columns = [
    {
      key: 'stNumber',
      header: 'ST',
      render: (value) => value || 'N/A'
    },
    {
      key: 'siteId',
      header: 'Sitio',
      render: (value) => {
        const siteDetails = getSiteDetails(value);
        return (
          <div className="space-y-1">
            <div className="font-medium">{siteDetails?.site?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">
              {siteDetails?.building?.name || 'N/A'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (value) => value || 'N/A'
    },
    {
      key: 'tentativeDate',
      header: 'Fecha Tentativa',
      render: (value) => value ? new Date(value).toLocaleDateString('es-CR') : 'No programada'
    },
    {
      key: 'state',
      header: 'Estado',
      render: (value) => {
        const getStatusClass = (status) => {
          switch (status) {
            case 'Cerrada':
            case 'Finalizada':
              return 'bg-success/10 text-success';
            case 'Trabajo iniciado':
            case 'Confirmado por tecnico':
              return 'bg-info/10 text-info';
            case 'Técnico asignado':
              return 'bg-warning/10 text-warning';
            default:
              return 'bg-gray-100 text-gray-700';
          }
        };

        return (
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(value)}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'files',
      header: 'Archivos',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.descriptionId && (
            <Button
              variant="ghost"
              size="small"
              className="text-primary hover:text-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                handleFileDownload(row.descriptionId, `ST_${row.stNumber}_descripcion.pdf`);
              }}
            >
              <FileText size={16} />
            </Button>
          )}
          {row.serviceTicketId && (
            <Button
              variant="ghost"
              size="small"
              className="text-primary hover:text-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                handleFileDownload(row.serviceTicketId, `ST_${row.stNumber}_boleta.pdf`);
              }}
            >
              <Download size={16} />
            </Button>
          )}
          {row.reportId && (
            <Button
              variant="ghost"
              size="small"
              className="text-primary hover:text-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                handleFileDownload(row.reportId, `ST_${row.stNumber}_informe.pdf`);
              }}
            >
              <FileDown size={16} />
            </Button>
          )}
        </div>
      )
    }
  ];

  const filterTickets = () => {
    return serviceTickets.filter(ticket => {
      // Date range filter
      if (startDate && endDate) {
        const ticketDate = ticket.tentativeDate ? new Date(ticket.tentativeDate).getTime() : 0;
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
        if (ticketDate < start || ticketDate > end) return false;
      }

      // Status filter
      if (selectedState && ticket.state !== selectedState) return false;

      // Search term filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const siteDetails = getSiteDetails(ticket.siteId);
        return (
          ticket.stNumber?.toLowerCase().includes(search) ||
          siteDetails?.site?.name?.toLowerCase().includes(search) ||
          siteDetails?.building?.name?.toLowerCase().includes(search) ||
          ticket.type?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  };

  const filteredTickets = filterTickets();

  const stateOptions = [
    'Iniciada',
    'Técnico asignado',
    'Confirmado por tecnico',
    'Trabajo iniciado',
    'Finalizada',
    'Cerrada'
  ];

  const handleRowClick = (ticket) => {
    navigate(POST_VENTA_ROUTES.TICKETS.DETAIL(ticket.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets de Servicio</h1>
        <p className="text-sm text-gray-500 mt-1">
          {filteredTickets.length} tickets encontrados
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar por ST, sitio o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-sm"
            />
          </div>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            className="flex-1"
          />

          <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
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
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredTickets}
          isLoading={loading}
          onRowClick={handleRowClick}
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No se encontraron tickets
              </h3>
              <p className="text-sm text-gray-500">
                Intenta ajustar los filtros para ver más resultados
              </p>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default TicketList;