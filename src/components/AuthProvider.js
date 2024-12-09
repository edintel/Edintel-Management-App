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
    let mounted = true;
    let timeoutId;

    const initializeAuth = async () => {
      if (!mounted) return;

      try {
        if (accounts.length > 0) {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });

          if (mounted) {
            setUser({
              name: response.account.name,
              username: response.account.username,
            });

            // Debounce navigation
            if (location.pathname === '/login') {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                navigate(location.state?.from?.pathname || '/', { 
                  replace: true,
                  state: {} // Clear state to prevent loops
                });
              }, 100);
            }
          }
        } else if (location.pathname !== '/login' && !isAuthenticated) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            navigate('/login', { 
              state: { from: location }, 
              replace: true 
            });
          }, 100);
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (mounted && location.pathname !== '/login') {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            navigate('/login', { 
              state: { from: location }, 
              replace: true 
            });
          }, 100);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [instance, accounts, isAuthenticated, navigate, location]);

  const login = () => instance.loginRedirect(loginRequest);
  
  const logout = async () => {
    setUser(null);
    await instance.logoutRedirect();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}