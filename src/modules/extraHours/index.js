// src/modules/extraHours/index.js
import React from 'react';
import { ExtraHoursRoutes } from './routes';
import { ExtraHoursProvider } from './context/extraHoursContext';

/**
 * ExtraHoursModule - Main entry point for the Extra Hours module
 * 
 * This component wraps the entire module with the necessary providers
 * and renders the module's routes.
 */
const ExtraHoursModule = () => {
  return (
    <ExtraHoursProvider>
      <ExtraHoursRoutes />
    </ExtraHoursProvider>
  );
};

export default ExtraHoursModule;