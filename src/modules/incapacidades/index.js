import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { IncapacidadesProvider } from './context/incapacidadesContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/Dashboard/dashboard';
import RequestForm from './components/Request/RequestForm';
import RequestList from './components/Request/RequestList';
import RequestDetail from './components/Request/RequestDetail';

const IncapacidadesModule = () => (
  <IncapacidadesProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/nueva" element={<RequestForm />} />
        <Route path="/mis-incapacidades" element={<RequestList />} />
        <Route path="/todas" element={<RequestList showAll />} />
        <Route path="/detalle/:id" element={<RequestDetail />} />
        <Route path="*" element={<Navigate to="/incapacidades" replace />} />
      </Routes>
    </Layout>
  </IncapacidadesProvider>
);

export default IncapacidadesModule;
