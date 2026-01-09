// src/modules/extraHours/routes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';


// Layout
import Layout from './components/layout/Layout';

// Components
import Dashboard from './components/Dashboard/dashboard';
import RequestList from './components/Request/RequestList';
import RequestDetail from './components/Request/RequestDetail';
import Approvals from './components/Approvals/Approvals';

// Constantes de rutas
export const EXTRA_HOURS_ROUTES = {
  BASE: '/extra-hours',
  DASHBOARD: '/extra-hours/',
  REQUESTS: '/extra-hours/requests',
  REQUEST_DETAIL: '/extra-hours/requests/:id',
  APPROVALS: '/extra-hours/approvals',
};

export function ExtraHoursRoutes() {
  return (
    
      <Layout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="requests" element={<RequestList />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="approvals" element={<Approvals/>} />
        </Routes>
      </Layout>
 
  );
}