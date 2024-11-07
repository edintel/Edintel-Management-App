// src/modules/postVentaManagement/components/Dashboard/PostVentaDashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostVentaManagement } from '../../context/postVentaManagementContext';
import Card from '../../../../components/common/Card';
import Table from '../../../../components/common/Table';
import { Calendar, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { POST_VENTA_ROUTES } from '../../routes';

const PostVentaDashboard = () => {
  const navigate = useNavigate();
  const { 
    getTicketsAssignedToMe, 
    getSiteDetails, 
    loading,
  } = usePostVentaManagement();

  const assignedTickets = getTicketsAssignedToMe();

  // Calculate summary statistics
  const stats = {
    total: assignedTickets.length,
    pending: assignedTickets.filter(ticket => ticket.state === 'Iniciada').length,
    inProgress: assignedTickets.filter(ticket => 
      ['Técnico asignado', 'Confirmado por tecnico', 'Trabajo iniciado'].includes(ticket.state)
    ).length,
    completed: assignedTickets.filter(ticket => 
      ['Finalizada', 'Cerrada'].includes(ticket.state)
    ).length
  };

  const getStatusClass = (state) => {
    switch (state) {
      case 'Cerrada':
      case 'Finalizada':
        return 'text-success bg-success/10';
      case 'Trabajo iniciado':
      case 'Confirmado por tecnico':
        return 'text-info bg-info/10';
      case 'Técnico asignado':
        return 'text-warning bg-warning/10';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const columns = [
    {
      key: "stNumber",
      header: "ST",
      render: value => value || 'N/A'
    },
    {
      key: "siteId",
      header: "Sitio",
      render: value => {
        const site = getSiteDetails(value);
        return site?.site?.name || 'N/A';
      }
    },
    {
      key: "tentativeDate",
      header: "Fecha",
      render: value => value ? new Date(value).toLocaleDateString() : 'No programada'
    },
    {
      key: "state",
      header: "Estado",
      render: value => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(value)}`}>
          {value}
        </span>
      )
    }
  ];

  const handleRowClick = (ticket) => {
    navigate(POST_VENTA_ROUTES.TICKETS.DETAIL(ticket.id));
  };

  const statCards = [
    {
      title: "Total Tickets",
      value: stats.total,
      icon: <CheckSquare className="w-6 h-6 text-primary" />,
      bgColor: "bg-primary/10"
    },
    {
      title: "Pendientes",
      value: stats.pending,
      icon: <Clock className="w-6 h-6 text-warning" />,
      bgColor: "bg-warning/10"
    },
    {
      title: "En Progreso",
      value: stats.inProgress,
      icon: <Calendar className="w-6 h-6 text-info" />,
      bgColor: "bg-info/10"
    },
    {
      title: "Completados",
      value: stats.completed,
      icon: <CheckSquare className="w-6 h-6 text-success" />,
      bgColor: "bg-success/10"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Post Venta</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de tickets asignados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center gap-4 p-6">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card 
        title="Tickets Asignados"
        subtitle={`${assignedTickets.length} tickets en total`}
      >
        <Table
          columns={columns}
          data={assignedTickets}
          onRowClick={handleRowClick}
          isLoading={loading}
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No hay tickets asignados
              </h3>
              <p className="text-sm text-gray-500">
                No tienes tickets asignados en este momento
              </p>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default PostVentaDashboard;