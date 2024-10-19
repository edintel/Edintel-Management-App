import React from 'react';
import { useAuth } from './AuthProvider';
import './LogoutButton.css';

function LogoutButton() {
  const { logout } = useAuth();

  return (
    <div className="logout-container">
      <button className="logout-button" onClick={logout}>Cerrar sesión</button>
    </div>
  );
}

export default LogoutButton;