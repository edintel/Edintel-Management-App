import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useExpenseAudit } from '../context/expenseAuditContext';
import { EXPENSE_AUDIT_ROUTES } from "../routes";
import LoadingScreen from '../../../components/LoadingScreen';

/**
 * ApprovalRoute - Protected route component for approval-related pages
 * 
 * This component restricts access to approval-related pages to users
 * with Jefe or Asistente roles only.
 */
export const ApprovalRoute = ({ children }) => {
  const location = useLocation();
  const { permissionService, service, initialized, loading } = useExpenseAudit();
  
  // Show loading screen while initializing
  if (!initialized || loading) {
    return <LoadingScreen />;
  }
  
  if (!permissionService || !service) {
    console.error("Permission service or base service not initialized");
    return <LoadingScreen />;
  }
  
  // Get current user email from MSAL
  const userEmail = service.msalInstance.getAllAccounts()[0]?.username;
  
  if (!userEmail) {
    console.error("User email not found");
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has Jefe or Asistente role in any department
  const hasAdminRole = permissionService.hasRole(userEmail, "Jefe") || 
                       permissionService.hasRole(userEmail, "Asistente");
  
  // Redirect to dashboard if user doesn't have access
  if (!hasAdminRole) {
    return <Navigate to={EXPENSE_AUDIT_ROUTES.DASHBOARD} replace state={{ from: location }} />;
  }
  
  return children;
};

export default ApprovalRoute;