import React from 'react';
import { ExpenseAuditRoutes } from './routes';
import { AppProviderExpenseAudit } from './context/expenseAuditContext';

const ExpenseAuditModule = () => {
  return (
    <AppProviderExpenseAudit>
      <ExpenseAuditRoutes />
    </AppProviderExpenseAudit>
  );
};

export default ExpenseAuditModule;