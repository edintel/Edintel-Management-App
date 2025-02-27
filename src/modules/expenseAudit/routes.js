import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import ExpenseForm from './components/Expenses/ExpenseForm';
import ExpenseList from './components/Expenses/ExpenseList';
import ExpenseDetail from './components/Expenses/ExpenseDetail';
import ExpenseEdit from './components/Expenses/ExpenseEdit';
import ApprovalList from './components/Approvals/ApprovalList';
import Reports from './components/Reports/Reports';
import Profile from './components/Profile/Profile';
import { ApprovalRoute } from './components/ApprovalRoute';

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

// Main routes component
export const ExpenseAuditRoutes = () => {
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
          element={<Dashboard />}
        />

        {/* Expenses routes */}
        <Route 
          path="expenses" 
          element={<ExpenseList />}
        />
        <Route 
          path="expenses/new" 
          element={<ExpenseForm />}
        />
        <Route 
          path="expenses/:id" 
          element={<ExpenseDetail />}
        />
        <Route 
          path="expenses/:id/edit" 
          element={<ExpenseEdit />}
        />

        {/* Protected approval routes */}
        <Route 
          path="approvals" 
          element={
            <ApprovalRoute>
              <ApprovalList />
            </ApprovalRoute>
          }
        />

        {/* Protected reports route */}
        <Route 
          path="reports" 
          element={
            <ApprovalRoute>
              <Reports />
            </ApprovalRoute>
          }
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

export default ExpenseAuditRoutes;