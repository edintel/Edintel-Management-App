import React from "react";
import {
  CheckCircle,
  Clock,
  User,
  Play,
  AlertTriangle,
  Lock,
  Calendar,
  UserPlus,
  FileUp,
} from "lucide-react";

const TicketTimeline = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No hay eventos en la línea de tiempo
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch (type) {
      case "Iniciada":
        return Clock;
      case "Fecha programada":
        return Calendar;
      case "Técnico asignado":
        return User;
      case "Confirmado por técnico":
        return CheckCircle;
      case "Trabajo iniciado":
        return Play;
      case "Trabajo Parcial":
        return AlertTriangle;
      case "Reasignación de técnico":
        return UserPlus;
      case "Boleta Parcial Subida":
        return FileUp;
      case "Finalizada":
        return CheckCircle;
      case "Cerrada":
        return Lock;
      default:
        return Clock;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case "Iniciada":
        return "bg-gray-100 text-gray-600 border-gray-300";
      case "Fecha programada":
        return "bg-blue-100 text-blue-600 border-blue-300";
      case "Técnico asignado":
        return "bg-yellow-100 text-yellow-600 border-yellow-300";
      case "Confirmado por técnico":
        return "bg-info/10 text-info border-info/30";
      case "Trabajo iniciado":
        return "bg-info/10 text-info border-info/30";
      case "Trabajo Parcial":
        return "bg-warning/10 text-warning border-warning/30";
      case "Reasignación de técnico":
        return "bg-purple-100 text-purple-600 border-purple-300";
      case "Boleta Parcial Subida":
        return "bg-indigo-100 text-indigo-600 border-indigo-300";
      case "Finalizada":
        return "bg-success/10 text-success border-success/30";
      case "Cerrada":
        return "bg-success/10 text-success border-success/30";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Fecha no válida";
    }
  };

  // Ordenar eventos por fecha
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="space-y-6">
      {sortedEvents.map((event, index) => {
        const Icon = getEventIcon(event.type);
        const isLast = index === sortedEvents.length - 1;

        return (
          <div key={index} className="relative pl-16">
            {/* Línea vertical */}
            {!isLast && (
              <div className="absolute left-[31px] top-8 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Ícono del evento */}
            <div
              className={`absolute left-4 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventColor(
                event.type
              )}`}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Contenido del evento */}
            <div className="pb-6">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{event.type}</h4>
                <span className="text-sm text-gray-500">
                  {formatDate(event.date)}
                </span>
              </div>


              {event.description && (
                <p className="text-sm text-gray-600 mb-2 italic">
                  {event.description}
                </p>
              )}

              {event.details && (
                <div className="mt-2 space-y-1">
                  {Object.entries(event.details).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-700">{key}: </span>

                      {key === "Link" && value ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Ver documento
                        </a>
                      ) : (
                        <span className="text-gray-600">{value}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TicketTimeline;