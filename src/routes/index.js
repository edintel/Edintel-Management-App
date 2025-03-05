import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from "../components/Login";
import LogoutHandler from '../components/LogoutHandler';
import { ProtectedRoute } from '../components/ProtectedRoute';
import MainMenu from '../components/MainMenu';
import LoadingScreen from '../components/LoadingScreen';

const CursoControlModule = React.lazy(() => import('../modules/cursoControl'));
const ExpenseAuditModule = React.lazy(() => import('../modules/expenseAudit'));
const PostVentaModule = React.lazy(() => import('../modules/postVentaManagement'))
const StyleGuide = React.lazy(() => import('../components/StyleGuide/StyleGuide'));

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<LogoutHandler />} />

      <Route path="/" element={<ProtectedRoute><MainMenu /></ProtectedRoute>} />

      <Route path="/curso-control/*" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingScreen />}>
            <CursoControlModule />
          </Suspense>
        </ProtectedRoute>
      } />

      <Route path="/expense-audit/*" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingScreen />}>
            <ExpenseAuditModule />
          </Suspense>
        </ProtectedRoute>
      } />

      <Route path="/post-venta/*" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingScreen />}>
            <PostVentaModule />
          </Suspense>
        </ProtectedRoute>
      } />

      <Route path="/styleguide" element={
        <Suspense fallback={<LoadingScreen />}>
          <StyleGuide />
        </Suspense>
      } />
    </Routes>
  );
};

export default AppRoutes;