// src/modules/extraHours/components/Dashboard/dashboard.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExtraHours } from "../../context/extraHoursContext";
import { useMsal } from "@azure/msal-react";
import Card from "../../../../components/common/Card";
import Table from "../../../../components/common/Table";
import Button from "../../../../components/common/Button";
import { Plus, Clock, Check, AlertTriangle, X, FileText } from "lucide-react";
import { EXTRA_HOURS_ROUTES } from "../../routes";
import RequestForm from "../Request/RequestForm";

const Dashboard = () => {
  const navigate = useNavigate();
  const { extraHoursRequests, loading, error, service , userDepartmentRole} = useExtraHours();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;
  const [showFormModal, setShowFormModal] = useState(false);

  // Define date range for the dashboard (last 30 days)
  const getLastMonthRange = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    lastMonth.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    return { start: lastMonth, end: today };
  };

  const { start: lastMonthStart, end: lastMonthEnd } = getLastMonthRange();

  // Filter requests for the current user
  const userRequests = extraHoursRequests.filter(
    (request) => request.createdBy.email === userEmail
  );

  // Filter for requests created in the last month
  const currentMonthRequests = userRequests.filter((request) => {
    const requestDate = new Date(request.created);
    return requestDate >= lastMonthStart && requestDate <= lastMonthEnd;
  });

  // Get recent requests (last 5)
  const recentRequests = [...userRequests]
    .sort((a, b) => b.created?.getTime() - a.created?.getTime())
    .slice(0, 5);

  // Table columns configuration
  const requestColumns = [
    {
      key: "fechaPeticion",
      header: "Fecha",
      render: (value) =>
        value
          ? value.toLocaleDateString("es-CR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          : "N/A",
    },
    {
      key: "departamento",
      header: "Departamento",
      render: (value) => value || "N/A",
    },
    {
      key: "extrasInfo",
      header: "Total Horas",
      render: (_, row) => {
        const totalHours = service?.calculateTotalHours(row.extrasInfo) || 0;
        return `${totalHours.toFixed(2)} hrs`;
      },
    },
    {
      key: "extrasInfo",
      header: "Entradas",
      render: (value) => value?.length || 0,
    },
    {
      key: "status",
      header: "Estado",
      render: (_, row) => {
        const approvalStatus = service?.getApprovalStatusSummary(row);

        // Check for rejection
        if (
          row.revisadoAsistente === false ||
          row.aprobadoJefatura === false ||
          row.aprobadoRH === false ||
          row.revisadoConta === false
        ) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <X size={14} className="mr-1" />
              No aprobada
            </span>
          );
        }

        // Check for full approval
        if (approvalStatus?.allApproved) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Check size={14} className="mr-1" />
              Aprobada
            </span>
          );
        }

        // Partial approvals
        if (row.aprobadoJefatura && !row.aprobadoRH) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Clock size={14} className="mr-1" />
              En RH
            </span>
          );
        }

        if (row.revisadoAsistente && !row.aprobadoJefatura) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Clock size={14} className="mr-1" />
              En Jefatura
            </span>
          );
        }

        // Default to pending
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle size={14} className="mr-1" />
            Pendiente
          </span>
        );
      },
    },
  ];

  // Calculate dashboard statistics
  const totalHours = currentMonthRequests.reduce((sum, request) => {
    return sum + (service?.calculateTotalHours(request.extrasInfo) || 0);
  }, 0);

  const pendingRequests = currentMonthRequests.filter((request) => {
    const status = service?.getApprovalStatusSummary(request);
    return !status?.allApproved &&
      request.revisadoAsistente !== false &&
      request.aprobadoJefatura !== false &&
      request.aprobadoRH !== false &&
      request.revisadoConta !== false;
  }).length;

  const approvedRequests = currentMonthRequests.filter((request) => {
    const status = service?.getApprovalStatusSummary(request);
    return status?.allApproved;
  }).length;

  const rejectedRequests = currentMonthRequests.filter(
    (request) =>
      request.revisadoAsistente === false ||
      request.aprobadoJefatura === false ||
      request.aprobadoRH === false ||
      request.revisadoConta === false
  ).length;

  const stats = [
    {
      title: "Total Horas",
      value: `${totalHours.toFixed(2)} hrs`,
      subtitle: `${currentMonthRequests.length} solicitudes`,
      icon: <Clock className="text-blue-600" size={24} />,
      bgColor: "bg-blue-100",
    },
    {
      title: "Pendientes",
      value: pendingRequests,
      subtitle: "Por aprobar",
      icon: <AlertTriangle className="text-yellow-600" size={24} />,
      bgColor: "bg-yellow-100",
    },
    {
      title: "Aprobadas",
      value: approvedRequests,
      subtitle: "Completadas",
      icon: <Check className="text-green-600" size={24} />,
      bgColor: "bg-green-100",
    },
    {
      title: "No Aprobadas",
      value: rejectedRequests,
      subtitle: "Rechazadas",
      icon: <X className="text-red-600" size={24} />,
      bgColor: "bg-red-100",
    },
  ];

  // ✅ Navegar al detalle de una solicitud
  const handleRequestClick = (request) => {
    navigate(`${EXTRA_HOURS_ROUTES.REQUESTS}/${request.id}`);
  };

  // ✅ Navegar a la lista completa de solicitudes
  const handleViewAllRequests = () => {
    navigate(EXTRA_HOURS_ROUTES.REQUESTS);
  };

  // Show error state if necessary
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-600">
        <AlertTriangle size={48} className="mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al cargar los datos</h2>
        <p className="text-gray-600">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header con título y botón */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {/* Título - Lado Izquierdo */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Horas Extras
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Últimos 30 días: {lastMonthStart.toLocaleDateString("es-CR")} -{" "}
            {lastMonthEnd.toLocaleDateString("es-CR")}
          </p>
        </div>

        {/* Botón Nueva HE - Lado Derecho */}
        <button
           onClick={() => setShowFormModal(true)}  
          className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2  hover:bg-blue-800 transition-colors text-sm font-medium shadow-md"
        >
          <Plus size={18} />
          <span>Nueva HE</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                {stat.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm text-gray-600">{stat.title}</h3>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Requests Table */}
      <Card
        title="Mis Horas Extras Recientes"
        subtitle={`Últimas ${recentRequests.length} solicitudes registradas`}
        action={
          recentRequests.length > 0 && (
            <Button variant="outline" size="small" onClick={handleViewAllRequests}>
              Ver todas
            </Button>
          )
        }
      >
        <Table
          columns={requestColumns}
          data={recentRequests}
          isLoading={loading}
          onRowClick={handleRequestClick}
          emptyMessage={
            <div className="flex flex-col items-center justify-center py-12">
              <FileText size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No se encontraron solicitudes
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Aún no has registrado solicitudes de horas extras
              </p>
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

      {/* Modal Form */}
      {showFormModal && (<RequestForm
        onClose={() => setShowFormModal(false)}
        initialDepartamento={userDepartmentRole?.department?.departamento || ''}
        initialNombreSolicitante={accounts[0]?.name || ''}
      />)}
    </div>
  );
};

export default Dashboard;