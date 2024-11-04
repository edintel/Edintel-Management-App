import React from 'react';
import { Loader } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">Cargando módulo...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;