// src/modules/postVentaManagement/components/Dashboard/PostVentaDashboard.js
import React from "react";
import { usePostVentaManagement } from "../../context/postVentaManagementContext";
import Card from "../../../../components/common/Card";
import { Calendar, CheckSquare, Clock } from "lucide-react";
import LoadingScreen from "../../../../components/LoadingScreen";

const PostVentaDashboard = () => {
  const { getTicketsAssignedToMe, loading } = usePostVentaManagement();

  const assignedTickets = getTicketsAssignedToMe();

  if (loading) {
    return <LoadingScreen />;
  }

  // Calculate summary statistics
  const stats = {
    total: assignedTickets.length,
    pending: assignedTickets.filter(
      (ticket) => ticket.state === "Técnico asignado"
    ).length,
    confirmed: assignedTickets.filter(
      (ticket) => ticket.state === "Confirmado por técnico"
    ).length,
    inProgress: assignedTickets.filter(
      (ticket) => ticket.state === "Trabajo iniciado"
    ).length,
    completed: assignedTickets.filter((ticket) =>
      ["Finalizada", "Cerrada"].includes(ticket.state)
    ).length,
  };

  const statCards = [
    {
      title: "Total Tickets",
      value: stats.total,
      icon: <CheckSquare className="w-6 h-6 text-primary" />,
      bgColor: "bg-primary/10",
    },
    {
      title: "Pendientes confirmación",
      value: stats.pending,
      icon: <Clock className="w-6 h-6 text-warning" />,
      bgColor: "bg-warning/10",
    },
    {
      title: "Espera a iniciar",
      value: stats.confirmed,
      icon: <Clock className="w-6 h-6 text-success" />,
      bgColor: "bg-success/10",
    },
    {
      title: "En Progreso",
      value: stats.inProgress,
      icon: <Calendar className="w-6 h-6 text-info" />,
      bgColor: "bg-info/10",
    },
    {
      title: "Completados",
      value: stats.completed,
      icon: <CheckSquare className="w-6 h-6 text-success" />,
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Post Venta
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Resumen de mis tickets asignados
          </p>
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
    </div>
  );
};

export default PostVentaDashboard;
