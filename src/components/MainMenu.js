import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useMsal } from "@azure/msal-react";
import Card from "./common/Card";
import { FileText, Ticket, Loader2 } from "lucide-react";
import BaseGraphService from "../services/BaseGraphService";
import { expenseAuditConfig } from "../modules/expenseAudit/config/expenseAudit.config";
import { postVentaConfig } from "../modules/postVentaManagement/config/postVentaManagement.config";

const MainMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { instance } = useMsal();
  const [loading, setLoading] = useState(true);
  const [availableModules, setAvailableModules] = useState({
    expenseAudit: false,
    postVenta: false
  });

  useEffect(() => {
    const checkModuleAccess = async () => {
      try {
        const baseService = new BaseGraphService(instance);

        // Check ExpenseAudit access
        try {
          const expenseSiteId = await baseService.getSiteId(expenseAuditConfig.siteName);
          const roles = await baseService.getListItems(expenseSiteId, expenseAuditConfig.lists.roles);
          
          const userHasExpenseRole = roles.some(role => 
            role.fields.Empleado?.[0]?.Email === user.username
          );
          
          setAvailableModules(prev => ({ ...prev, expenseAudit: userHasExpenseRole }));
        } catch (error) {
          console.log("No access to ExpenseAudit", error);
        }

        // Check PostVenta access
        try {
          const postVentaSiteId = await baseService.getSiteId(postVentaConfig.general.siteName);
          const roles = await baseService.getListItems(postVentaSiteId, postVentaConfig.general.lists.roles);
          
          const userHasPostVentaRole = roles.some(role => 
            role.fields.Empleado?.[0]?.Email === user.username
          );
          
          setAvailableModules(prev => ({ ...prev, postVenta: userHasPostVentaRole }));
        } catch (error) {
          console.log("No access to PostVenta", error);
        }

      } catch (error) {
        console.error("Error checking module access:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      checkModuleAccess();
    }
  }, [user?.username, instance]);

  const modules = [
    {
      id: "expense-audit",
      name: "Gestión de Liquidaciones",
      description: "Sistema de gestión y aprobación de liquidaciones",
      icon: FileText,
      path: "/expense-audit/dashboard",
      available: availableModules.expenseAudit
    },
    {
      id: "post-venta",
      name: "Control Post Venta",
      description: "Sistema de gestión de STs",
      icon: Ticket,
      path: "/post-venta/dashboard",
      available: availableModules.postVenta
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="h-16 bg-primary flex justify-center items-center">
        <img src="/LogoEdintel.png" alt="Edintel S.A." className="h-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) =>
            module.available && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;