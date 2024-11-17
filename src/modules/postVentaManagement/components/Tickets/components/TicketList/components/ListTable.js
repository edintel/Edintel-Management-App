// src/modules/postVentaManagement/components/Tickets/components/TicketList/components/ListTable.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Card from '../../../../../../../components/common/Card';
import Table from '../../../../../../../components/common/Table';
import TicketStatusBadge from '../../common/TicketStatusBadge';
import TicketActionsMenu from './TicketActionsMenu';
import { POST_VENTA_ROUTES } from '../../../../../routes';
import { MODAL_TYPES } from '../../../modals';

const ListTable = ({
  tickets = [],
  getSiteDetails,
  onOpenModal,  // Single handler for all modal actions
  systems = [],
  loading = false,
}) => {
  const navigate = useNavigate();

  const handleAction = (type, ticket) => {
    if (onOpenModal) {
      onOpenModal(type, ticket);
    }
  };

  const handleRowClick = (ticket) => {
    navigate(POST_VENTA_ROUTES.TICKETS.DETAIL(ticket.id));
  };

  const columns = [
    {
      key: "stNumber",
      header: "ST",
      render: (value, row) => (
        <div className="flex items-center gap-4">
          <span className="font-medium">{value}</span>
          {row.technicians?.length > 0 && (
            <div className="flex -space-x-2">
              {row.technicians.slice(0, 3).map((tech, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ring-2 ring-white"
                  title={tech.LookupValue}
                >
                  {tech.LookupValue.charAt(0)}
                </div>
              ))}
              {row.technicians.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 ring-2 ring-white">
                  +{row.technicians.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: "siteId",
      header: "Sitio",
      render: (value) => {
        const siteDetails = getSiteDetails(value);
        return (
          <div className="space-y-1">
            <div className="text-sm text-gray-500">
              {siteDetails?.company?.name || "N/A"}
            </div>
            <div className="text-sm text-gray-900">
              {siteDetails?.building?.name || "N/A"}
            </div>
            <div className="font-medium">
              {siteDetails?.site?.name || "N/A"}
            </div>
          </div>
        );
      },
    },
    {
      key: "systemId",
      header: "Sistema",
      render: (value) => {
        const system = systems.find((s) => s.id === value);
        return (
          <div className="max-w-[150px] break-words">
            {system?.name || "N/A"}
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Tipo",
      render: (value) => value || "N/A",
    },
    {
      key: "state",
      header: "Estado",
      render: (value) => <TicketStatusBadge status={value} />,
    },
    {
      key: "tentativeDate",
      header: "Fecha Tentativa",
      render: (value) =>
        value ? new Date(value).toLocaleDateString("es-CR") : "No programada",
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (_, row) => (
        <TicketActionsMenu
          ticket={row}
          onAssignTech={() => handleAction(MODAL_TYPES.ASSIGN_TECH, row)}
          onUpdateStatus={() => handleAction(MODAL_TYPES.UPDATE_STATUS, row)}
          onScheduleTicket={() => handleAction(MODAL_TYPES.SCHEDULE_DATE, row)}
          onEdit={() => handleAction(MODAL_TYPES.EDIT_TICKET, row)}
          onDelete={() => handleAction(MODAL_TYPES.DELETE_TICKET, row)}
        />
      ),
    },
  ];

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertTriangle size={48} className="text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        No se encontraron tickets
      </h3>
      <p className="text-sm text-gray-500">
        Intenta ajustar los filtros para ver más resultados
      </p>
    </div>
  );

  return (
    <Card>
      <div className="overflow-hidden">
        <Table
          columns={columns}
          data={tickets}
          isLoading={loading}
          onRowClick={handleRowClick}
          emptyMessage={emptyState}
        />
      </div>
    </Card>
  );
};

export default ListTable;