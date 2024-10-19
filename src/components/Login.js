import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import './Login.css';

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
    <div className="login-container">
      <div className="login-box">
        <img src="/LogoEdintel.png" alt="Edintel S.A. Logo" className="logo" />
        <h1>Edintel S.A.</h1>
        <h2>Inicio de sesión</h2>
        <form onSubmit={handleLogin}>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión con Microsoft'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;