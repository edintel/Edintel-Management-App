import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

function Login() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center w-[90%] max-w-md">
        <img 
          src="/LogoEdintel.png" 
          alt="Edintel S.A. Logo" 
          className="w-32 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-primary mb-2">Edintel S.A.</h1>
        <h2 className="text-xl text-gray-700 mb-8">Inicio de sesión</h2>
        <form onSubmit={handleLogin}>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión con Microsoft'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;