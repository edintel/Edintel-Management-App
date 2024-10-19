import React from 'react';
import { useAuth } from './AuthProvider';
import LogoutButton from './LogoutButton';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Bienvenido, {user.name}!</p>
      <LogoutButton />
      {/* Add more dashboard content here */}
    </div>
  );
}

export default Dashboard;