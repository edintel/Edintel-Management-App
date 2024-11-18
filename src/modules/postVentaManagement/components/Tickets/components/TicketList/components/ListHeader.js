import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Button from "../../../../../../../components/common/Button";
import { POST_VENTA_ROUTES } from "../../../../../routes";
import { usePostVentaManagement } from "../../../../../context/postVentaManagementContext";

const ListHeader = ({ total = 0 }) => {
  const navigate = useNavigate();
  const { userRole } = usePostVentaManagement();

  // Check if user is admin or supervisor
  const canCreateTicket =
    userRole?.role === "Administrativo" || userRole?.role === "Supervisor";

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tickets de Servicio
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} {total === 1 ? "ticket encontrado" : "tickets encontrados"}
        </p>
      </div>

      {canCreateTicket && (
        <Button
          variant="primary"
          startIcon={<Plus size={16} />}
          onClick={() => navigate(POST_VENTA_ROUTES.TICKETS.NEW)}
        >
          Nuevo Ticket
        </Button>
      )}
    </div>
  );
};

export default ListHeader;
