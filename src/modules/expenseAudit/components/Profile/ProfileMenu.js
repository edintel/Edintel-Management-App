import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../../../components/AuthProvider';
import { EXPENSE_AUDIT_ROUTES } from "../../routes";

const ProfileMenu = () => {
  const { logout } = useAuth();
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
    navigate(EXPENSE_AUDIT_ROUTES.PROFILE);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        className="flex items-center justify-center w-10 h-10 text-white rounded-full hover:bg-white/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
      >
        <User size={24} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden">
          <button 
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={handleProfile}
          >
            <UserCircle size={16} className="mr-2" />
            Mi perfil
          </button>
          <button 
            className="flex items-center w-full px-4 py-2 text-sm text-error border-t border-gray-200 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;