import React from 'react';
import { ExpenseAuditRoutes } from './routes';
import { AppProviderExpenseAudit } from './context/expenseAuditContext';

/**
 * ExpenseAuditModule - Main entry point for the Expense Audit module
 * 
 * This component wraps the entire module with the necessary providers
 * and renders the module's routes.
 */
const ExpenseAuditModule = () => {
  return (
    <AppProviderExpenseAudit>
      <ExpenseAuditRoutes />
    </AppProviderExpenseAudit>
  );
};

export default ExpenseAuditModule;