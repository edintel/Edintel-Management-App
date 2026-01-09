// src/modules/extraHours/components/Layout.js
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Plus } from "lucide-react";
import ProfileMenu from "../../components/Profile/ProfileMenu";
import { EXTRA_HOURS_ROUTES } from "../../routes"; 
import { useExtraHours } from "../../context/extraHoursContext";


const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const location = useLocation();
  const { userDepartmentRole } = useExtraHours();

  const isColaborador = userDepartmentRole?.role === 'Colaborador';

  const navigation = [
    { name: "Dashboard", path: EXTRA_HOURS_ROUTES.DASHBOARD },
    ...(!isColaborador
      ? [{ name: "Aprobaciones", path: EXTRA_HOURS_ROUTES.APPROVALS }]
      : []),
    { name: "Menu principal", path: "/" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Fijo */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-primary flex items-center px-4 md:px-6 z-50">
        <div className="grid grid-cols-3 w-full items-center">
          {/* Botón Menu - Izquierda */}
          <div className="justify-self-start">
            <button
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Logo - Centro */}
          <div className="justify-self-center">
            <img src="/LogoEdintel.png" alt="Edintel S.A." className="h-10" />
          </div>

          {/* Botón Nueva HE + Profile - Derecha */}
          <div className="justify-self-end flex items-center gap-2">
            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Sidebar Deslizante */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white transform transition-transform duration-300 ease-in-out z-50 shadow-lg ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header del Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
     
          <button
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="p-4">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 rounded-lg transition-colors mb-1 ${
                location.pathname === item.path
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </nav>

      
      </aside>

      {/* Overlay para cerrar el sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 transition-opacity z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Contenido Principal */}
      <main className="flex-1 pt-16 bg-gray-50 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>

    </div>
  );
};

export default Layout;