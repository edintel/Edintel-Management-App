import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

const LogoutHandler = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        sessionStorage.clear();
        localStorage.clear();

        await instance.logoutRedirect({
          postLogoutRedirectUri: window.location.origin + '/login',
          onRedirectNavigate: (url) => {
            return false;
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
        navigate('/login', { replace: true });
      }
    };

    handleLogout();
  }, [instance, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Cerrando sesión...</p>
      </div>
    </div>
  );
};

export default LogoutHandler;