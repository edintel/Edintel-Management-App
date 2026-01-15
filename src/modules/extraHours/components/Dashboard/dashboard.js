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
  const { extraHoursRequests, loading, error, service, userDepartmentRole } = useExtraHours();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;
  const [showFormModal, setShowFormModal] = useState(false);

  // ==================== LÓGICA DE CÁLCULO DE HORAS ====================

  // Feriados fijos de Costa Rica
  const feriadosFijos = [
    { mes: 1, dia: 1 },    // 1 enero
    { mes: 4, dia: 11 },   // 11 abril (Juan Santamaría)
    { mes: 5, dia: 1 },    // 1 mayo
    { mes: 7, dia: 25 },   // 25 julio (Anexión Guanacaste)
    { mes: 8, dia: 2 },    // 2 agosto (Virgen de los Ángeles)
    { mes: 8, dia: 15 },   // 15 agosto (Día de la Madre)
    { mes: 8, dia: 31 },   // 31 agosto (Día de la Persona Negra)
    { mes: 9, dia: 15 },   // 15 septiembre (Independencia)
    { mes: 12, dia: 1 },   // 1 diciembre (Abolición del Ejército)
    { mes: 12, dia: 25 },  // 25 diciembre (Navidad)
  ];

  const calcularPascua = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  };

  const esFeriado = (fecha) => {
    const mes = fecha.getMonth() + 1;
    const dia = fecha.getDate();
    const year = fecha.getFullYear();

    const esFeriadoFijo = feriadosFijos.some(
      feriado => feriado.mes === mes && feriado.dia === dia
    );

    if (esFeriadoFijo) return true;

    const pascua = calcularPascua(year);
    const juevesSanto = new Date(pascua);
    juevesSanto.setDate(pascua.getDate() - 3);
    const viernesSanto = new Date(pascua);
    viernesSanto.setDate(pascua.getDate() - 2);

    const fechaStr = fecha.toDateString();
    return (
      fechaStr === juevesSanto.toDateString() ||
      fechaStr === viernesSanto.toDateString()
    );
  };

  const esDomingo = (fecha) => {
    return fecha.getDay() === 0;
  };

  const dividirHorasPorSegmento = (horaInicio, horaFin) => {
    const [hi, mi] = horaInicio.split(':').map(Number);
    const [hf, mf] = horaFin.split(':').map(Number);

    let inicio = hi + mi / 60;
    let fin = hf + mf / 60;

    if (fin < inicio) {
      fin += 24;
    }

    let horasDiurnas = 0;
    let horasNocturnas = 0;

    if (inicio >= 6 && fin <= 22) {
      horasDiurnas = fin - inicio;
    } else if ((inicio >= 22 && fin <= 30) || (inicio >= 0 && fin <= 6)) {
      horasNocturnas = fin - inicio;
    } else if (inicio >= 6 && inicio < 22 && fin > 22) {
      horasDiurnas = 22 - inicio;
      horasNocturnas = fin - 22;
    } else if (inicio >= 0 && inicio < 6 && fin > 6) {
      horasNocturnas = 6 - inicio;
      horasDiurnas = fin - 6;
    } else if (inicio >= 6 && inicio < 22 && fin > 30) {
      horasDiurnas = 22 - inicio;
      horasNocturnas = 8;
      horasDiurnas += (fin - 30);
    }

    return { horasDiurnas, horasNocturnas };
  };

  const redondearMediaHora = (horasDecimales) => {
    return Math.round(horasDecimales * 2) / 2;
  };

  /**
   * Calcula el total de horas de una solicitud con redondeo
   */
  const calcularTotalHorasConRedondeo = (extrasInfo) => {
    if (!Array.isArray(extrasInfo) || extrasInfo.length === 0) {
      return 0;
    }

    let totalHoras = 0;

    extrasInfo.forEach(extra => {
      if (!extra.dia || !extra.horaInicio || !extra.horaFin) return;

      const { horasDiurnas, horasNocturnas } = dividirHorasPorSegmento(
        extra.horaInicio,
        extra.horaFin
      );

      totalHoras += horasDiurnas + horasNocturnas;
    });

    return redondearMediaHora(totalHoras);
  };

  // ==================== FIN DE LÓGICA DE CÁLCULO ====================

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
        // ✅ Usar cálculo con redondeo
        const totalHours = calcularTotalHorasConRedondeo(row.extrasInfo);
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

  // Calculate dashboard statistics with rounding
  const totalHours = currentMonthRequests.reduce((sum, request) => {
    // ✅ Usar cálculo con redondeo
    return sum + calcularTotalHorasConRedondeo(request.extrasInfo);
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
          className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 hover:bg-blue-900 transition-colors text-sm font-medium shadow-md rounded-lg"
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