// src/components/LogoutHandler.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

const LogoutHandler = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
    sessionStorage.clear();
    
    navigate('/login', { replace: true });
  }, [instance, navigate]);

  return null; 
};

export default LogoutHandler;