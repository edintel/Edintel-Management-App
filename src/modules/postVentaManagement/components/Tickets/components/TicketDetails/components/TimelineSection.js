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

    // Partial work - CON TODO EL HISTORIAL
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

      // ✅ Procesar historial completo
      if (ticket.reassignmentHistory && Array.isArray(ticket.reassignmentHistory)) {
        // Separar reasignaciones y documentos
        const reassignments = ticket.reassignmentHistory.filter(entry => entry.type === "reassignment");
        const documents = ticket.reassignmentHistory.filter(entry => entry.type === "partial_document");

        // Agregar reasignaciones al detalle
        if (reassignments.length > 0) {
          reassignments.forEach((entry, index) => {
            const timestamp = new Date(entry.date).toLocaleString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const previousTechs = entry.previousTechnicians?.map(t => t.name).join(", ") || "N/A";
            const newTechs = entry.newTechnicians?.map(t => t.name).join(", ") || "N/A";

            details[`Reasignación ${index + 1}`] = `${timestamp}\n  De: ${previousTechs}\n  A: ${newTechs}`;
          });
        }

        // Agregar documentos parciales al detalle
        if (documents.length > 0) {
          documents.forEach((entry, index) => {
            const timestamp = new Date(entry.date).toLocaleString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            details[`Boleta Parcial ${index + 1}`] = `${timestamp}\n  Archivo: ${entry.fileName}`;
          });
        }

        // Resumen final
        if (reassignments.length > 0 || documents.length > 0) {
          details["Resumen"] = `${reassignments.length} reasignación(es), ${documents.length} boleta(s) subida(s)`;
        }
      } else {
        // Fallback: Si NO hay historial detallado pero hay reasignación
        if (ticket.reassignedTechnicians?.length > 0) {
          details["Técnicos reasignados"] = ticket.reassignedTechnicians
            .map(tech => tech.LookupValue)
            .join(", ");

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

    // Closed
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