import React from 'react';
import { CursoControlRoutes } from './routes';
import { CursoControlProvider } from './context/cursoControlContext';

const CursoControlModule = () => {
  return (
    <CursoControlProvider>
      <CursoControlRoutes />
    </CursoControlProvider>
  );
};

export default CursoControlModule;