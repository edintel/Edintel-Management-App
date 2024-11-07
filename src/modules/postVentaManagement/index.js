// src/modules/postVentaManagement/index.js
import React from 'react';
import { PostVentaRoutes } from './routes';
import { AppProviderPostVentaManagement } from './context/postVentaManagementContext';

const PostVentaModule = () => {
  return (
    <AppProviderPostVentaManagement>
      <PostVentaRoutes />
    </AppProviderPostVentaManagement>
  );
};

export default PostVentaModule;