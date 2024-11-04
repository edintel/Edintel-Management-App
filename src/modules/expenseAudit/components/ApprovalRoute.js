import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../components/AuthProvider';
import { EXPENSE_AUDIT_ROUTES } from "../routes"

export const ApprovalRoute = ({ children }) => {
  const { user } = useAuth();

  const canApprove =
    user?.role === "Jefe" ||
    user?.role === "Asistente" ||
    user?.department?.toLowerCase().includes("contabilidad");

  if (!canApprove) {
    return <Navigate to={EXPENSE_AUDIT_ROUTES.DASHBOARD} replace />;
  }

  return children;
};