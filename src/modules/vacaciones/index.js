import React from 'react';
import { VacacionesRoutes } from './routes';
import { VacacionesProvider } from './context/vacacionesContext';

const VacacionesModule = () => {
  return (
    <VacacionesProvider>
      <VacacionesRoutes />
    </VacacionesProvider>
  );
};

export default VacacionesModule;
