import React from 'react';
import { useAuth } from '../AuthProvider';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import { User, Mail, Building, Briefcase } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="profile-container">
        <Card title="Mi Perfil" className="profile-card">
          <div className="profile-content">
            <div className="profile-header">
              <div className="profile-avatar">
                <User size={48} />
              </div>
              <h2 className="profile-name">{user?.name}</h2>
            </div>

            <div className="profile-info">
              <div className="info-item">
                <Mail size={20} />
                <div className="info-content">
                  <label>Correo electrónico</label>
                  <span>{user?.username}</span>
                </div>
              </div>

              <div className="info-item">
                <Building size={20} />
                <div className="info-content">
                  <label>Departamento</label>
                  <span>{user?.department}</span>
                </div>
              </div>

              <div className="info-item">
                <Briefcase size={20} />
                <div className="info-content">
                  <label>Rol</label>
                  <span>{user?.role}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;