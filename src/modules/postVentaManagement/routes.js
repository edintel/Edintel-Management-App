import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PostVentaDashboard from './components/Dashboard/PostVentaDashboard';
import TicketList from './components/Tickets/components/TicketList';
import TicketDetails from './components/Tickets/components/TicketDetails';
import TicketForm from './components/Tickets/components/TicketForm';
import Profile from './components/Profile/Profile';
import LocationManagementPage from './components/LocationManagement/LocationManagementPage';
import { usePostVentaManagement } from './context/postVentaManagementContext';
import LoadingScreen from '../../components/LoadingScreen';

const ROLES = {
  ADMIN: "Administrativo",
  SUPERVISOR: "Supervisor",
  TECHNICIAN: "Técnico",
  COMERCIAL: "Comercial"
};

// Navigation configuration for the module
export const POST_VENTA_ROUTES = {
  ROOT: '/post-venta',
  DASHBOARD: '/post-venta/dashboard',
  TICKETS: {
    LIST: '/post-venta/tickets',
    NEW: '/post-venta/tickets/new',
    DETAIL: (id) => `/post-venta/tickets/${id}`,
    EDIT: (id) => `/post-venta/tickets/${id}/edit`
  },
  LOCATIONS: '/post-venta/locations',
  PROFILE: '/post-venta/profile',
};

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { userRole, loading } = usePostVentaManagement();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!userRole || !allowedRoles.includes(userRole.role)) {
    return <Navigate to="/post-venta/dashboard" state={{ from: location }} replace />;
  }

  return children;
};

// Main routes component
export const PostVentaRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PostVentaDashboard />} />
        
        <Route path="tickets">
          <Route index element={<TicketList />} />
          <Route 
            path="new" 
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.COMERCIAL]}>
                <TicketForm />
              </ProtectedRoute>
            } 
          />
          <Route path=":id" element={<TicketDetails />} />
        </Route>

        <Route 
          path="locations" 
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR]}>
              <LocationManagementPage />
            </ProtectedRoute>
          }
        />

        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default PostVentaRoutes;