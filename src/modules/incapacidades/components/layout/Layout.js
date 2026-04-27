import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useIncapacidades } from '../../context/incapacidadesContext';
import { INCAPACIDADES_ROUTES } from '../../routes';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { userRole } = useIncapacidades();

  const isAdmin = userRole === 'Administrador';

  const navigation = [
    { name: 'Dashboard', path: INCAPACIDADES_ROUTES.DASHBOARD },
    { name: 'Mis incapacidades', path: INCAPACIDADES_ROUTES.MY_REQUESTS },
    ...(isAdmin ? [{ name: 'Todas las incapacidades', path: INCAPACIDADES_ROUTES.ALL_REQUESTS }] : []),
    { name: 'Menú principal', path: '/' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-16 bg-primary flex items-center px-4 md:px-6 z-50">
        <div className="grid grid-cols-3 w-full items-center">
          <div className="justify-self-start">
            <button
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
          <div className="justify-self-center">
            <img src="/LogoEdintel.png" alt="Edintel S.A." className="h-10" />
          </div>
          <div className="justify-self-end" />
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white transform transition-transform duration-300 ease-in-out z-50 shadow-lg ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <span className="font-semibold text-gray-800">Incapacidades</span>
          <button
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="p-4">
          {navigation.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 rounded-lg transition-colors mb-1 ${
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
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
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 pt-16 bg-gray-50 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
