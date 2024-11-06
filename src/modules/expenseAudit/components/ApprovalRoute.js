import React from 'react';
import { Navigate } from 'react-router-dom';
import { useExpenseAudit } from '../context/expenseAuditContext';
import { EXPENSE_AUDIT_ROUTES } from "../routes";

export const ApprovalRoute = ({ children }) => {
  const { userDepartmentRole, loading } = useExpenseAudit();

  if (loading) return null;

  const canApprove = 
    userDepartmentRole?.role === "Jefe" || 
    userDepartmentRole?.role === "Asistente" || 
    (userDepartmentRole?.department?.departamento || "").toLowerCase().includes("contabilidad");

  if (!canApprove) {
    return <Navigate to={EXPENSE_AUDIT_ROUTES.DASHBOARD} replace />;
  }

  return children;
};