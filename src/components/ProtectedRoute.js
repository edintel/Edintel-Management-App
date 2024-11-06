import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import LoadingScreen from './LoadingScreen';

export function ProtectedRoute({ children }) {
  const { user, inProgress } = useAuth();
  const location = useLocation();

  if (inProgress === "login") {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}