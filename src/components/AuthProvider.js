// src/components/AuthProvider.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest, logoutRequest } from "../config/AuthConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { useExpenseAudit } from '../contexts/AppContext';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { service, roles, departments } = useExpenseAudit();

  const getUserDepartmentInfo = useCallback((email) => {
    if (!roles || !departments) return null;
    
    const userRole = roles.find(role => role.empleado?.email === email);
    if (!userRole) return null;

    const department = departments.find(dept => 
      dept.id === userRole.departamentoId.toString());
    if (!department) return null;

    let roleType = 'Empleado';
    if (department.asistentes.some(asst => asst.email === email)) {
      roleType = 'Asistente';
    } else if (department.jefes.some(boss => boss.email === email)) {
      roleType = 'Jefe';
    }

    return {
      departamento: department.departamento,
      tipo: roleType
    };
  }, [roles, departments]);

  useEffect(() => {
    if (accounts.length > 0 && !user && service) {
      service.initialize();
    }
  }, [accounts, user, service]);

  useEffect(() => {
    if (accounts.length > 0 && roles && departments) {
      const departmentInfo = getUserDepartmentInfo(accounts[0].username);
      setUser(prev => ({
        ...accounts[0],
        department: departmentInfo?.departamento || 'No asignado',
        role: departmentInfo?.tipo || 'No asignado'
      }));
    }
  }, [accounts, roles, departments, getUserDepartmentInfo]);

  const login = async () => {
    try {
      const result = await instance.loginPopup(loginRequest);
      if (result.account) {
        if (service) {
          await service.initialize();
        }
        
        const departmentInfo = getUserDepartmentInfo(result.account.username);
        setUser({
          ...result.account,
          department: departmentInfo?.departamento || 'No asignado',
          role: departmentInfo?.tipo || 'No asignado'
        });
        const returnUrl = location.state?.from?.pathname || '/dashboard';
        navigate(returnUrl);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await instance.logoutPopup(logoutRequest);
      sessionStorage.clear();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      navigate('/login', { replace: true });
    }
  };

  const value = {
    getUserDepartmentInfo,
    user,
    login,
    logout,
    inProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}