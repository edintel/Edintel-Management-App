import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PostVentaDashboard from './components/Dashboard/PostVentaDashboard';
import TicketList from './components/Tickets/components/TicketList';
import TicketDetails from './components/Tickets/components/TicketDetails';
import TicketForm from './components/Tickets/components/TicketForm';
import Profile from './components/Profile/Profile';
import LocationManagementPage from './components/LocationManagement/LocationManagementPage';

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

// Main routes component
export const PostVentaRoutes = () => {
  return (
    <Layout>
      <Routes>
        {/* Default redirect */}
        <Route 
          path="/" 
          element={<Navigate to="dashboard" replace />} 
        />

        {/* Dashboard */}
        <Route 
          path="dashboard" 
          element={<PostVentaDashboard />}
        />

        {/* Tickets routes */}
        <Route path="tickets">
          <Route index element={<TicketList />} />
          <Route path="new" element={<TicketForm />} />
          <Route path=":id" element={<TicketDetails />} />
          <Route path=":id/edit" element={<TicketForm />} />
        </Route>

        {/* Location Management */}
        <Route 
          path="locations" 
          element={<LocationManagementPage />}
        />

        {/* Profile */}
        <Route 
          path="profile" 
          element={<Profile />}
        />

        {/* Catch-all redirect */}
        <Route 
          path="*" 
          element={<Navigate to="dashboard" replace />} 
        />
      </Routes>
    </Layout>
  );
};

export default PostVentaRoutes;