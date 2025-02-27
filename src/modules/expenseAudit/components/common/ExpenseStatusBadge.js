import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import StatusBadge from '../../../../components/common/StatusBadge';

/**
 * ExpenseStatusBadge - A component to display the status of an expense report
 * 
 * @param {Object} expense - The expense object
 * @returns {JSX.Element} - A StatusBadge component with appropriate styling
 */
const ExpenseStatusBadge = ({ expense, size = 'default' }) => {
  if (!expense) return null;

  // Determine status based on approval states
  if (
    expense.aprobacionAsistente === "No aprobada" ||
    expense.aprobacionJefatura === "No aprobada" ||
    expense.aprobacionContabilidad === "No aprobada"
  ) {
    return (
      <StatusBadge 
        variant="error" 
        icon={<XCircle size={14} />}
        size={size}
      >
        No aprobada
      </StatusBadge>
    );
  }

  if (expense.aprobacionContabilidad === "Aprobada") {
    return (
      <StatusBadge 
        variant="success" 
        icon={<CheckCircle size={14} />}
        size={size}
      >
        Aprobado
      </StatusBadge>
    );
  }

  if (
    expense.aprobacionJefatura === "Aprobada" &&
    expense.aprobacionContabilidad === "Pendiente"
  ) {
    return (
      <StatusBadge 
        variant="info" 
        icon={<AlertCircle size={14} />}
        size={size}
      >
        En Contabilidad
      </StatusBadge>
    );
  }

  if (
    expense.aprobacionAsistente === "Aprobada" &&
    expense.aprobacionJefatura === "Pendiente"
  ) {
    return (
      <StatusBadge 
        variant="info" 
        icon={<AlertCircle size={14} />}
        size={size}
      >
        En Jefatura
      </StatusBadge>
    );
  }

  return (
    <StatusBadge 
      variant="warning" 
      icon={<Clock size={14} />}
      size={size}
    >
      Pendiente
    </StatusBadge>
  );
};

export default ExpenseStatusBadge;