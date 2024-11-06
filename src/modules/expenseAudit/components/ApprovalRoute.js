import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useExpenseAudit } from '../context/expenseAuditContext';
import { EXPENSE_AUDIT_ROUTES } from "../routes";
import LoadingScreen from '../../../components/LoadingScreen';

export const ApprovalRoute = ({ children }) => {
  const location = useLocation();
  const { userDepartmentRole, initialized } = useExpenseAudit();

  if (!initialized) {
    return <LoadingScreen />;
  }

  const canApprove = userDepartmentRole && (
    userDepartmentRole.role === "Jefe" || 
    userDepartmentRole.role === "Asistente"
  );

  if (!canApprove) {
    return <Navigate to={EXPENSE_AUDIT_ROUTES.DASHBOARD} replace state={{ from: location }} />;
  }

  return children;
};