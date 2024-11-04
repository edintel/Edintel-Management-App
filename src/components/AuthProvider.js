import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "../config/AuthConfig";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (accounts.length > 0) {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });

          setUser({
            name: response.account.name,
            username: response.account.username,
          });

          if (location.pathname === '/login') {
            navigate(location.state?.from?.pathname || '/', { replace: true });
          }
        } else if (location.pathname !== '/login' && !isAuthenticated) {
          navigate('/login', { state: { from: location }, replace: true });
        }
      } catch {
        if (location.pathname !== '/login') {
          navigate('/login', { state: { from: location }, replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [instance, accounts, isAuthenticated, navigate, location]);

  const login = () => instance.loginRedirect(loginRequest);
  const logout = () => instance.logoutRedirect();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}