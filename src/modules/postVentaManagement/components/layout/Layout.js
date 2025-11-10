import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ProfileMenu from "../Profile/ProfileMenu";
import { POST_VENTA_ROUTES } from "../../routes";
import { usePostVentaManagement } from "../../context/postVentaManagementContext";

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { userRole } = usePostVentaManagement();

  const navigation = [
    { name: "Dashboard", path: POST_VENTA_ROUTES.DASHBOARD },
    { name: "Tickets", path: POST_VENTA_ROUTES.TICKETS.LIST },
    ...(userRole?.role !== "Técnico"
      ? [{ name: "Ubicaciones", path: POST_VENTA_ROUTES.LOCATIONS }]
      : []),
    ...(userRole?.role === "Administrativo" || userRole?.role === "Supervisor"
      ? [{ name: "Reportes", path: POST_VENTA_ROUTES.REPORTS }]
      : []),
    { name: "Menu principal", path: "/" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-16 bg-primary flex items-center px-4 md:px-6 z-50">
        <div className="grid grid-cols-3 w-full items-center">
          <div className="justify-self-start">
            <button
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="justify-self-center">
            <img src="/LogoEdintel.png" alt="Edintel S.A." className="h-10" />
          </div>

          <div className="justify-self-end">
            <ProfileMenu />
          </div>
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white transform transition-transform duration-300 ease-in-out z-50 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-16 flex items-center justify-end px-4 border-b">
          <button
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg transition-colors ${location.pathname === item.path
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

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 transition-opacity z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 pt-16 bg-gray-100">{children}</main>
    </div>
  );
};

export default Layout;
