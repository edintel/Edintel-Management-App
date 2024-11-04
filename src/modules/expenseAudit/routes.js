// src/modules/expenseAudit/routes.js
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../components/AuthProvider';
import Layout from './components/layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import ExpenseForm from './components/Expenses/ExpenseForm';
import ExpenseList from './components/Expenses/ExpenseList';
import ExpenseDetail from './components/Expenses/ExpenseDetail';
import ExpenseEdit from './components/Expenses/ExpenseEdit';
import ApprovalList from './components/Approvals/ApprovalList';
import Reports from './components/Reports/Reports';
import Profile from './components/Profile/Profile';

// Navigation configuration for the module
export const EXPENSE_AUDIT_ROUTES = {
  ROOT: '/expense-audit',
  DASHBOARD: '/expense-audit/dashboard',
  EXPENSES: {
    LIST: '/expense-audit/expenses',
    NEW: '/expense-audit/expenses/new',
    DETAIL: (id) => `/expense-audit/expenses/${id}`,
    EDIT: (id) => `/expense-audit/expenses/${id}/edit`,
  },
  APPROVALS: '/expense-audit/approvals',
  REPORTS: '/expense-audit/reports',
  PROFILE: '/expense-audit/profile',
};

// Breadcrumb configurations
export const BREADCRUMB_CONFIG = {
  '/expense-audit': { label: 'Inicio', link: '/expense-audit' },
  '/expense-audit/dashboard': { label: 'Dashboard', link: '/expense-audit/dashboard' },
  '/expense-audit/expenses': { label: 'Gastos', link: '/expense-audit/expenses' },
  '/expense-audit/expenses/new': { label: 'Nuevo Gasto', link: '/expense-audit/expenses/new' },
  '/expense-audit/approvals': { label: 'Aprobaciones', link: '/expense-audit/approvals' },
  '/expense-audit/reports': { label: 'Reportes', link: '/expense-audit/reports' },
  '/expense-audit/profile': { label: 'Perfil', link: '/expense-audit/profile' },
};

// Route protection component for approval-related routes
const ApprovalRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const canApprove =
    user?.role === "Jefe" ||
    user?.role === "Asistente" ||
    user?.department?.toLowerCase().includes("contabilidad");

  if (!canApprove) {
    return <Navigate to={EXPENSE_AUDIT_ROUTES.DASHBOARD} state={{ from: location }} replace />;
  }

  return children;
};

// Main navigation items for the module
export const MODULE_NAVIGATION = (user) => {
  const canApprove =
    user?.role === "Jefe" ||
    user?.role === "Asistente" ||
    user?.department?.toLowerCase().includes("contabilidad");

  const items = [
    {
      name: "Dashboard",
      path: EXPENSE_AUDIT_ROUTES.DASHBOARD,
      icon: "Home",
    },
    {
      name: "Gastos",
      path: EXPENSE_AUDIT_ROUTES.EXPENSES.LIST,
      icon: "FileText",
    }
  ];

  if (canApprove) {
    items.push(
      {
        name: "Aprobaciones",
        path: EXPENSE_AUDIT_ROUTES.APPROVALS,
        icon: "CheckCircle",
      },
      {
        name: "Reportes",
        path: EXPENSE_AUDIT_ROUTES.REPORTS,
        icon: "BarChart",
      }
    );
  }

  return items;
};

// Layout wrapper for the module
const ModuleLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Build breadcrumbs based on current location
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      if (BREADCRUMB_CONFIG[currentPath]) {
        breadcrumbs.push(BREADCRUMB_CONFIG[currentPath]);
      } else if (path.match(/^\d+$/)) {
        // Handle dynamic routes (like expense details)
        breadcrumbs.push({
          label: 'Detalle',
          link: currentPath,
        });
      }
    });

    return breadcrumbs;
  };

  return (
    <Layout
      navigation={MODULE_NAVIGATION(user)}
      breadcrumbs={getBreadcrumbs()}
      moduleTitle="Gestión de Gastos"
    >
      {children}
    </Layout>
  );
};

// Main routes component
export const ExpenseAuditRoutes = () => {
  return (
    <Routes>
      {/* Default redirect */}
      <Route 
        path="/" 
        element={<Navigate to={EXPENSE_AUDIT_ROUTES.DASHBOARD} replace />} 
      />

      {/* Dashboard */}
      <Route 
        path="dashboard" 
        element={
          <ModuleLayout>
            <Dashboard />
          </ModuleLayout>
        } 
      />

      {/* Expenses routes */}
      <Route 
        path="expenses" 
        element={
          <ModuleLayout>
            <ExpenseList />
          </ModuleLayout>
        } 
      />
      <Route 
        path="expenses/new" 
        element={
          <ModuleLayout>
            <ExpenseForm />
          </ModuleLayout>
        } 
      />
      <Route 
        path="expenses/:id" 
        element={
          <ModuleLayout>
            <ExpenseDetail />
          </ModuleLayout>
        } 
      />
      <Route 
        path="expenses/:id/edit" 
        element={
          <ModuleLayout>
            <ExpenseEdit />
          </ModuleLayout>
        } 
      />

      {/* Protected approval routes */}
      <Route 
        path="approvals" 
        element={
          <ApprovalRoute>
            <ModuleLayout>
              <ApprovalList />
            </ModuleLayout>
          </ApprovalRoute>
        } 
      />
      <Route 
        path="reports" 
        element={
          <ApprovalRoute>
            <ModuleLayout>
              <Reports />
            </ModuleLayout>
          </ApprovalRoute>
        } 
      />

      {/* Profile */}
      <Route 
        path="profile" 
        element={
          <ModuleLayout>
            <Profile />
          </ModuleLayout>
        } 
      />

      {/* Catch-all redirect */}
      <Route 
        path="*" 
        element={<Navigate to={EXPENSE_AUDIT_ROUTES.DASHBOARD} replace />} 
      />
    </Routes>
  );
};

export default ExpenseAuditRoutes;