// src/modules/extraHours/components/Profile/Profile.js
import React from "react";
import { useAuth } from "../../../../components/AuthProvider";
import { useExtraHours } from "../../context/extraHoursContext";
import Card from "../../../../components/common/Card";
import { User, Mail, Briefcase, Building2 } from "lucide-react";

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
    <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value || "No asignado"}</span>
    </div>
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const { userDepartmentRole } = useExtraHours();

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <User size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {user?.name || "Usuario"}
            </h2>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <InfoItem
              icon={<Mail size={20} className="text-primary" />}
              label="Correo electrónico"
              value={user?.username}
            />

            <InfoItem
              icon={<Briefcase size={20} className="text-primary" />}
              label="Rol"
              value={userDepartmentRole?.role}
            />

            <InfoItem
              icon={<Building2 size={20} className="text-primary" />}
              label="Departamento"
              value={userDepartmentRole?.department?.departamento}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;