// src/components/MainMenu.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import Card from './common/Card';
import { FileText, Ticket } from 'lucide-react';

const MainMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const modules = [
    {
      id: 'expense-audit',
      name: 'Gestión de Liquidaciones',
      description: 'Sistema de gestión y aprobación de liquidaciones',
      icon: FileText,
      path: '/expense-audit/dashboard',
      roles: ['*'] // * means all roles have access
    },
    {
      id: 'post-venta',
      name: 'Control Post Venta',
      description: 'Sistema de gestión de STs',
      icon: Ticket,
      path: '/post-venta/dashboard',
      roles: ['*']
    }
  ];

  const hasAccess = (moduleRoles) => {
    if (moduleRoles.includes('*')) return true;
    return moduleRoles.some(role => user?.role === role);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="h-16 bg-primary flex justify-center items-center">
        <img src="/LogoEdintel.png" alt="Edintel S.A." className="h-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => (
            hasAccess(module.roles) && (
              <Card 
                key={module.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(module.path)}
              >
                <div className="flex items-start p-6">
                  <div className="flex-shrink-0">
                    <module.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {module.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {module.description}
                    </p>
                  </div>
                </div>
              </Card>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;