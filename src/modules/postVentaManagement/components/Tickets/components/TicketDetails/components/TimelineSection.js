import React from "react";
import Card from "../../../../../../../components/common/Card";
import TicketTimeline from "../../common/TicketTimeline";

const TimelineSection = ({ ticket }) => {
  if (!ticket) return null;

  const buildTimelineEvents = () => {
    const events = [];

    // Initial creation
    events.push({
      type: "Iniciada",
      date: ticket.created,
      details: {
        "Creado por": ticket.createdBy?.user?.displayName || "Sistema",
      },
    });

    // Tentative date
    if (ticket.tentativeDate) {
      events.push({
        type: "Fecha programada",
        date: ticket.tentativeDate,
      });
    }

    // Tech assignment
    if (ticket.technicians?.length > 0) {
      events.push({
        type: "Técnico asignado",
        date: ticket.technicianAssignedDate,
        details: {
          Técnicos: ticket.technicians
            .map((tech) => tech.LookupValue)
            .join(", "),
        },
      });
    }

    // Tech confirmation
    if (ticket.confirmationDate) {
      events.push({
        type: "Confirmado por técnico",
        date: ticket.confirmationDate,
      });
    }

    // Work started
    if (ticket.workStartDate) {
      events.push({
        type: "Trabajo iniciado",
        date: ticket.workStartDate,
      });
    }

    // Work finished
    if (ticket.workEndDate) {
      events.push({
        type: "Finalizada",
        date: ticket.workEndDate,
      });
    }

    // Ticket closed
    if (ticket.closeDate) {
      events.push({
        type: "Cerrada",
        date: ticket.closeDate,
      });
    }

    return events;
  };

  return (
    <Card title="Línea de Tiempo">
      <TicketTimeline events={buildTimelineEvents()} />
    </Card>
  );
};

export default TimelineSection;
