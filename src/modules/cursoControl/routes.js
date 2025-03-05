import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import CursoList from './components/Cursos/CursoList';
import CursoForm from './components/Cursos/CursoForm';
import CursoDetail from './components/Cursos/CursoDetail';
import CursoEdit from './components/Cursos/CursoEdit';
import PersonaList from './components/Personas/PersonaList';
import PersonaForm from './components/Personas/PersonaForm';
import PersonaDetail from './components/Personas/PersonaDetail';
import PersonaEdit from './components/Personas/PersonaEdit';

export const CURSO_CONTROL_ROUTES = {
  ROOT: '/curso-control',
  CURSOS: {
    LIST: '/curso-control/cursos',
    NEW: '/curso-control/cursos/new',
    DETAIL: (id) => `/curso-control/cursos/${id}`,
    EDIT: (id) => `/curso-control/cursos/${id}/edit`,
  },
  PERSONAS: {
    LIST: '/curso-control/personas',
    NEW: '/curso-control/personas/new',
    DETAIL: (id) => `/curso-control/personas/${id}`,
    EDIT: (id) => `/curso-control/personas/${id}/edit`,
  }
};

export const CursoControlRoutes = () => {
  return (
    <Layout>
      <Routes>
        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to="cursos" replace />}
        />
        
        {/* Cursos routes */}
        <Route
          path="cursos"
          element={<CursoList />}
        />
        <Route
          path="cursos/new"
          element={<CursoForm />}
        />
        <Route
          path="cursos/:id"
          element={<CursoDetail />}
        />
        <Route
          path="cursos/:id/edit"
          element={<CursoEdit />}
        />
        
        {/* Personas routes */}
        <Route
          path="personas"
          element={<PersonaList />}
        />
        <Route
          path="personas/new"
          element={<PersonaForm />}
        />
        <Route
          path="personas/:id"
          element={<PersonaDetail />}
        />
        <Route
          path="personas/:id/edit"
          element={<PersonaEdit />}
        />
        
        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="cursos" replace />}
        />
      </Routes>
    </Layout>
  );
};

export default CursoControlRoutes;