import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/AuthConfig";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (accounts.length > 0) {
      setUser(accounts[0]);
      navigate("/dashboard");
    } else {
      setUser(null);
    }
  }, [accounts, navigate]);

  const login = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => {
    instance.logoutPopup().then(() => {
      navigate("/login");
    });
  };

  const value = {
    user,
    login,
    logout,
    inProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
