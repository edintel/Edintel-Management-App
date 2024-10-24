import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import './ProfileMenu.css';

const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfile = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="profile-menu" ref={menuRef}>
      <button 
        className="profile-menu-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
      >
        <User size={24} />
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <button className="profile-dropdown-item" onClick={handleProfile}>
            <UserCircle size={16} />
            Mi perfil
          </button>
          <button className="profile-dropdown-item" onClick={handleLogout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;