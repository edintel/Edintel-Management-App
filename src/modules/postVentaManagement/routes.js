// src/modules/postVentaManagement/routes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PostVentaDashboard from './components/Dashboard/PostVentaDashboard';
import TicketList from './components/Tickets/TicketList';
import TicketDetails from './components/Tickets/TicketDetails';

// Navigation configuration for the module
export const POST_VENTA_ROUTES = {
  ROOT: '/post-venta',
  DASHBOARD: '/post-venta/dashboard',
  TICKETS: {
    LIST: '/post-venta/tickets',
    DETAIL: (id) => `/post-venta/tickets/${id}`,
  },
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
        <Route 
          path="tickets" 
          element={<TicketList />} 
        />
        <Route 
          path="tickets/:id" 
          element={<TicketDetails />} 
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