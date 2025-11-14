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

    // Technician assigned
    if (ticket.technicians?.length > 0) {
      events.push({
        type: "Técnico asignado",
        date: ticket.technicianAssignedDate,
        details: {
          "Técnicos iniciales": ticket.technicians
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

    // Partial work
    if (ticket.workNotDone) {
      const event = {
        type: "Trabajo Parcial",
        date: ticket.workNotDone
      };

      const details = {};

      // Agregar notas si existen
      if (ticket.notes) {
        details["Notas"] = ticket.notes;
      }

      // Verificar si hay reasignación de técnicos
      const hasReassignment = ticket.reassignedTechnicians?.length > 0;

      if (hasReassignment) {
        // Mostrar técnicos reasignados
        details["Técnicos reasignados"] = ticket.reassignedTechnicians
          .map(tech => tech.LookupValue)
          .join(", ");

        // Mostrar fecha de reasignación si existe
        if (ticket.lastReassignmentDate) {
          details["Fecha de reasignación"] = new Date(ticket.lastReassignmentDate).toLocaleString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }

      // Contar cuántas boletas parciales se han subido
      const partialDocuments = ticket.reassignmentHistory?.filter(
        entry => entry.type === "partial_document"
      ) || [];

      if (partialDocuments.length > 0) {
        details["Boletas parciales subidas"] = partialDocuments.length;
      }

      // Solo agregar detalles si hay algo que mostrar
      if (Object.keys(details).length > 0) {
        event.details = details;
      }

      events.push(event);
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

    
    if (ticket.closeDate) {
      const event = {
        type: "Cerrada",
        date: ticket.closeDate,
      };
      
      
      if (ticket.closeNotes) {
        event.details = {
          "Notas de Cierre": ticket.closeNotes
        };
      }
      
      events.push(event);
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