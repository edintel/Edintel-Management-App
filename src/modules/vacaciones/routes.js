import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from './components/layout/Layout';
import Dashboard from './components/Dashboard/dashboard';
import RequestList from './components/Request/RequestList';
import RequestDetail from './components/Request/RequestDetail';
import Approvals from './components/Approvals/Approvals';
import Profile from './components/Profile/Profile';

export const VACACIONES_ROUTES = {
  BASE: '/vacaciones',
  DASHBOARD: '/vacaciones/',
  REQUESTS: '/vacaciones/requests',
  REQUEST_DETAIL: '/vacaciones/requests/:id',
  APPROVALS: '/vacaciones/approvals',
  PROFILE: '/vacaciones/profile',
};

export function VacacionesRoutes() {
  return (
    <Layout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="requests" element={<RequestList />} />
        <Route path="requests/:id" element={<RequestDetail />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
}
