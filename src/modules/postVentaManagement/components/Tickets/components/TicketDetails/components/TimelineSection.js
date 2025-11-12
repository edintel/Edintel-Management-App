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

    
    if (ticket.workNotDone) {
      const event = {
        type: "Trabajo Parcial",
        date: ticket.workNotDone
      };
      
      const details = {};
      
      if (ticket.notes) {
        details["Notas"] = ticket.notes;
      }
      
    
      if (ticket.reassignedTechnicians?.length > 0) {
        details["Técnicos reasignados"] = ticket.reassignedTechnicians
          .map(tech => tech.LookupValue)
          .join(", ");
      }
      
      
      if (ticket.lastReassignmentDate) {
        details["Última reasignación"] = new Date(ticket.lastReassignmentDate).toLocaleString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      
      if (Object.keys(details).length > 0) {
        event.details = details;
      }
      
      events.push(event);
    }

   
    if (ticket.reassignmentHistory && Array.isArray(ticket.reassignmentHistory)) {
      ticket.reassignmentHistory.forEach((entry) => {
        if (entry.type === "reassignment") {
          // Evento de reasignación
          events.push({
            type: "Reasignación de técnico",
            date: entry.date,
            description: "Técnicos reasignados durante trabajo parcial",
            details: {
              "Técnicos anteriores": entry.previousTechnicians
                .map(t => t.name)
                .join(", "),
              "Nuevos técnicos": entry.newTechnicians
                .map(t => t.name)
                .join(", ")
            }
          });
        } else if (entry.type === "partial_document") {
          // Evento de subida de boleta parcial
          events.push({
            type: "Boleta Parcial Subida",
            date: entry.date,
            description: "Documento de trabajo parcial agregado",
            details: {
              "Archivo": entry.fileName,
              "Link": entry.fileUrl
            }
          });
        }
      });
    }

   
    if (ticket.lastReassignmentDate && 
        ticket.reassignedTechnicians?.length > 0 &&
        (!ticket.reassignmentHistory || ticket.reassignmentHistory.length === 0)) {
      events.push({
        type: "Reasignación de técnico",
        date: ticket.lastReassignmentDate,
        description: "Técnicos reasignados para completar el trabajo parcial",
        details: {
          "Técnicos anteriores": ticket.technicians
            .map(t => t.LookupValue)
            .join(", "),
          "Nuevos técnicos": ticket.reassignedTechnicians
            .map(t => t.LookupValue)
            .join(", "),
          "Estado de confirmación": ticket.postReassignmentConfirmation
            ? "✅ Confirmado"
            : "⏳ Pendiente de confirmación"
        }
      });
    }

    // Confirmación post-reasignación
    if (ticket.postReassignmentConfirmation) {
      events.push({
        type: "Confirmado por técnico",
        date: ticket.postReassignmentConfirmation,
        details: {
          "Tipo": "Post-reasignación"
        }
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