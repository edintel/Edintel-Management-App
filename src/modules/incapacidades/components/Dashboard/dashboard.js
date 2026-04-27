import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useIncapacidades } from '../../context/incapacidadesContext';
import Card from '../../../../components/common/Card';
import Table from '../../../../components/common/Table';
import Button from '../../../../components/common/Button';
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { INCAPACIDADES_ROUTES } from '../../routes';

const StatusBadge = ({ recibido }) => {
  if (recibido === true) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle size={12} className="mr-1" />
        Recibida
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <Clock size={12} className="mr-1" />
      Pendiente
    </span>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const { requests, loading, error, userRole } = useIncapacidades();

  const userEmail = accounts[0]?.username;

  // Always show only the user's own requests on the dashboard
  const myRequests = requests.filter(r => r.createdBy?.email === userEmail);

  const recentRequests = [...myRequests]
    .sort((a, b) => (b.created?.getTime() || 0) - (a.created?.getTime() || 0))
    .slice(0, 5);

  const stats = [
    {
      label: 'Total',
      value: myRequests.length,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      subtitle: 'Historial completo',
    },
    {
      label: 'Recibidas por RH',
      value: myRequests.filter(r => r.recibido === true).length,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      subtitle: 'Confirmadas por RH',
    },
    {
      label: 'Pendientes',
      value: myRequests.filter(r => r.recibido !== true).length,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      subtitle: 'Sin confirmar aún',
    },
  ];

  const columns = [
    {
      key: 'fechaInicio',
      header: 'Fecha Inicio',
      render: value =>
        value ? new Date(value + 'T00:00:00').toLocaleDateString('es-CR') : 'N/A',
    },
    {
      key: 'fechaFin',
      header: 'Fecha Fin',
      render: value =>
        value ? new Date(value + 'T00:00:00').toLocaleDateString('es-CR') : 'N/A',
    },
    {
      key: 'diasIncapacidad',
      header: 'Días Hábiles',
      render: value => `${value || 0} días`,
    },
    {
      key: 'departamento',
      header: 'Departamento',
      render: value => value || 'N/A',
    },
    {
      key: 'recibido',
      header: 'Estado',
      render: (value, row) => <StatusBadge recibido={row.recibido} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Incapacidades</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de incapacidades médicas</p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'Administrador' && (
            <Button variant="outline" onClick={() => navigate(INCAPACIDADES_ROUTES.ALL_REQUESTS)}>
              Ver todas las incapacidades
            </Button>
          )}
          <button
            onClick={() => navigate(INCAPACIDADES_ROUTES.NEW_REQUEST)}
            className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 hover:bg-blue-900 transition-colors text-sm font-medium shadow-md rounded-lg"
          >
            <Plus size={18} />
            <span>Nueva incapacidad</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map(stat => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.subtitle}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card
        title="Mis Incapacidades Recientes"
        subtitle={`Últimas ${recentRequests.length} incapacidades`}
        action={
          myRequests.length > 0 && (
            <Button
              variant="outline"
              onClick={() => navigate(INCAPACIDADES_ROUTES.MY_REQUESTS)}
            >
              Ver todas
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          data={recentRequests}
          isLoading={loading}
          onRowClick={req => navigate(`${INCAPACIDADES_ROUTES.DETAIL_BASE}/${req.id}`)}
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12">
              <FileText size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay incapacidades</h3>
              <p className="text-sm text-gray-500 mb-4">
                Aún no has registrado incapacidades médicas
              </p>
              <button
                onClick={() => navigate(INCAPACIDADES_ROUTES.NEW_REQUEST)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Nueva incapacidad
              </button>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default Dashboard;
