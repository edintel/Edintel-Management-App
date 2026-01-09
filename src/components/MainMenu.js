// src/components/MainMenu.js (updated with Curso Control)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useMsal } from "@azure/msal-react";
import Card from "./common/Card";
import { FileText, Ticket, Loader2, BookOpen, Hourglass } from "lucide-react";
import BaseGraphService from "../services/BaseGraphService";
import { expenseAuditConfig } from "../modules/expenseAudit/config/expenseAudit.config";
import { postVentaConfig } from "../modules/postVentaManagement/config/postVentaManagement.config";
import { extraHoursConfig } from "../modules/extraHours/config/extraHours.config"
import { cursoControlConfig } from "../modules/cursoControl/config/cursoControl.config";

const MainMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { instance } = useMsal();
  const [loading, setLoading] = useState(true);
  const [availableModules, setAvailableModules] = useState({
    expenseAudit: false,
    postVenta: false,
    cursoControl: false,
    horasExtras: false,
  });

  useEffect(() => {
    const checkModuleAccess = async () => {
      try {
        const baseService = new BaseGraphService(instance);

        // Check Expense Audit access
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

        try {
          // Usar directamente el siteId de la configuración
          const extraHoursSiteId = extraHoursConfig.siteId;

          try {
            await baseService.getListItems(
              extraHoursSiteId,
              extraHoursConfig.lists.rolesDepartamentos,
              { top: 1 }
            );
            setAvailableModules(prev => ({ ...prev, horasExtras: true }));
          } catch (listError) {
            console.log("No access to Extra Hours lists", listError);
          }
        } catch (error) {
          console.log("No access to Extra Hours site", error);
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

        // Check Curso Control access
        try {

          const cursoControlSiteId = await baseService.getSiteId(cursoControlConfig.siteName);

          try {
            await baseService.getListItems(
              cursoControlSiteId,
              cursoControlConfig.lists.cursos,
              { top: 1 }
            );
            setAvailableModules(prev => ({ ...prev, cursoControl: true }));
          } catch (listError) {
            console.log("No access to Curso Control lists", listError);
          }
        } catch (error) {
          console.log("No access to Curso Control site", error);
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
    },
    {
      id: "curso-control",
      name: "Control de Cursos",
      description: "Sistema de control de cursos y personas",
      icon: BookOpen,
      path: "/curso-control/cursos",
      available: availableModules.cursoControl
    },
    {
      id: "horas-extras",
      name: "Horas Extras",
      description: "Sistema de gestión de horas extras",
      icon: Hourglass,
      path: "/extra-hours/ ",
      available: availableModules.horasExtras
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