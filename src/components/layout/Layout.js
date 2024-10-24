import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ProfileMenu from '../common/ProfileMenu';
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Gastos', path: '/expenses' },
    { name: 'Aprobaciones', path: '/approvals' },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          <button
            className="menu-button"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="header-center">
          <img src="/LogoEdintel.png" alt="Edintel S.A." className="logo" />
        </div>
        
        <div className="header-right">
          <ProfileMenu />
        </div>
      </header>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button
            className="close-button"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {isSidebarOpen && (
        <div 
          className={`overlay ${isSidebarOpen ? 'visible' : ''}`}
          onClick={closeSidebar}
        />
      )}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;