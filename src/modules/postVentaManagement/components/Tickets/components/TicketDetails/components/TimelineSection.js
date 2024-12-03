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
      const tentativeDate = new Date(ticket.tentativeDate);
      tentativeDate.setHours(tentativeDate.getHours() - 2);
      events.push({
        type: "Fecha programada",
        date: tentativeDate.toISOString(),
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

    // Work finished with notes
    if (ticket.workEndDate) {
      const event = {
        type: "Finalizada",
        date: ticket.workEndDate
      };
      if (ticket.notes) {
        event.details = {
          "Notas": ticket.notes
        };
      }
      events.push(event);
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