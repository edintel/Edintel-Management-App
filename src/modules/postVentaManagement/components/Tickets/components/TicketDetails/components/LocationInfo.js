import React from 'react';
import { Building2, Building, MapPin, Mail, Phone, User, PackageX } from 'lucide-react';
import Card from '../../../../../../../components/common/Card';

const LocationInfo = ({ siteDetails, system, roles, ticket }) => {
  if (!siteDetails) return null;

  return (
    <div className="space-y-6">
      <Card title="Información de Sitio">
        <div className="space-y-4">
          {ticket?.waitingEquiment && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2">
                <PackageX className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-warning">
                    Esperando Equipo
                  </p>
                  <p className="text-xs text-warning/80">
                    Este ticket está en espera de equipos o materiales
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Empresa</p>
              <p className="font-medium">{siteDetails.company?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Edificio</p>
              <p className="font-medium">{siteDetails.building?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Sitio</p>
              <p className="font-medium">{siteDetails.site?.name || 'N/A'}</p>
            </div>
          </div>

          {siteDetails.site?.supervisorId && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Supervisor</p>
                <p className="font-medium">
                  {roles.find(r => r.employee?.LookupId.toString() === siteDetails.site.supervisorId)?.employee?.LookupValue || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {system && (
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 flex items-center justify-center text-gray-400">
                <span className="text-lg">⚙️</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sistema</p>
                <p className="font-medium">{system.name}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="Información de Contacto">
        <div className="space-y-4">
          {siteDetails.site?.contactName && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Nombre de contacto</p>
                <p className="font-medium">{siteDetails.site.contactName}</p>
              </div>
            </div>
          )}

          {siteDetails.site?.contactEmail && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Correo electrónico</p>
                <p className="font-medium">{siteDetails.site.contactEmail}</p>
              </div>
            </div>
          )}

          {siteDetails.site?.contactPhone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">{siteDetails.site.contactPhone}</p>
              </div>
            </div>
          )}

          {siteDetails.site?.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Ubicación</p>
                <p className="font-medium">{siteDetails.site.location}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LocationInfo;