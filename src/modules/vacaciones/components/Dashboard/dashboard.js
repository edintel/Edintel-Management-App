import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVacaciones } from '../../context/vacacionesContext';
import { useMsal } from '@azure/msal-react';
import Card from '../../../../components/common/Card';
import Table from '../../../../components/common/Table';
import Button from '../../../../components/common/Button';
import { Plus, Calendar, Check, AlertTriangle, X, Clock, FileText } from 'lucide-react';
import { VACACIONES_ROUTES } from '../../routes';
import RequestForm from '../Request/RequestForm';

const getStatusInfo = (request) => {
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

const StatusBadge = ({ request }) => {
  const info = getStatusInfo(request);
  const colorMap = {
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };
  const iconMap = {
    rejected: <X size={14} className="mr-1" />,
    approved: <Check size={14} className="mr-1" />,
    in_rh: <Clock size={14} className="mr-1" />,
    pending: <AlertTriangle size={14} className="mr-1" />,
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorMap[info.color]}`}>
      {iconMap[info.status]}
      {info.label}
    </span>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { vacacionesRequests, loading, error, userDepartmentRole } = useVacaciones();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;
  const [showFormModal, setShowFormModal] = useState(false);

  const userRequests = vacacionesRequests.filter(r => r.createdBy.email === userEmail);

  const getLastMonthRange = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    lastMonth.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    return { start: lastMonth, end: today };
  };

  const { start, end } = getLastMonthRange();

  const recentRequests = [...userRequests]
    .sort((a, b) => b.created?.getTime() - a.created?.getTime())
    .slice(0, 5);

  const stats = [
    {
      title: 'Total Solicitudes',
      value: userRequests.length,
      subtitle: 'Historial completo',
      icon: <Calendar className="text-blue-600" size={24} />,
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pendientes',
      value: userRequests.filter(r => getStatusInfo(r).status === 'pending').length,
      subtitle: 'En espera de aprobación',
      icon: <AlertTriangle className="text-yellow-600" size={24} />,
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Aprobadas',
      value: userRequests.filter(r => getStatusInfo(r).status === 'approved').length,
      subtitle: 'Completadas',
      icon: <Check className="text-green-600" size={24} />,
      bgColor: 'bg-green-100',
    },
    {
      title: 'Rechazadas',
      value: userRequests.filter(r => getStatusInfo(r).status === 'rejected').length,
      subtitle: 'No aprobadas',
      icon: <X className="text-red-600" size={24} />,
      bgColor: 'bg-red-100',
    },
  ];

  const columns = [
    {
      key: 'fechaInicio',
      header: 'Fecha Inicio',
      render: value => value ? new Date(value + 'T00:00:00').toLocaleDateString('es-CR') : 'N/A',
    },
    {
      key: 'fechaFin',
      header: 'Fecha Fin',
      render: value => value ? new Date(value + 'T00:00:00').toLocaleDateString('es-CR') : 'N/A',
    },
    {
      key: 'diasHabiles',
      header: 'Días Hábiles',
      render: value => `${value || 0} días`,
    },
    {
      key: 'departamento',
      header: 'Departamento',
      render: value => value || 'N/A',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (_, row) => <StatusBadge request={row} />,
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-600">
        <AlertTriangle size={48} className="mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al cargar los datos</h2>
        <p className="text-gray-600">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Vacaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            {start.toLocaleDateString('es-CR')} – {end.toLocaleDateString('es-CR')}
          </p>
        </div>

        <button
          onClick={() => setShowFormModal(true)}
          className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 hover:bg-blue-900 transition-colors text-sm font-medium shadow-md rounded-lg"
        >
          <Plus size={18} />
          <span>Nueva Solicitud</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 ${stat.bgColor} rounded-lg`}>{stat.icon}</div>
              <div className="flex-1">
                <h3 className="text-sm text-gray-600">{stat.title}</h3>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card
        title="Mis Solicitudes Recientes"
        subtitle={`Últimas ${recentRequests.length} solicitudes`}
        action={
          recentRequests.length > 0 && (
            <Button variant="outline" size="small" onClick={() => navigate(VACACIONES_ROUTES.REQUESTS)}>
              Ver todas
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          data={recentRequests}
          isLoading={loading}
          onRowClick={req => navigate(`${VACACIONES_ROUTES.REQUESTS}/${req.id}`)}
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12">
              <FileText size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay solicitudes</h3>
              <p className="text-sm text-gray-500 mb-4">Aún no has registrado solicitudes de vacaciones</p>
              <button
                onClick={() => setShowFormModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Nueva Solicitud
              </button>
            </div>
          }
        />
      </Card>

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

export default Dashboard;
