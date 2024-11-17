import React, { useState } from 'react';
import { 
  MapPin, 
  Mail, 
  Phone,
  ChevronDown,
  ChevronUp,
  PersonStanding,
  GanttChart,
  Pencil,
  Trash2, 
  User
} from 'lucide-react';

const SiteItem = ({ 
  site, 
  roles = [],
  onEdit, 
  onDelete 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  const supervisor = roles?.find(role => 
    role.employee?.LookupId.toString() === site.supervisorId && role.role === 'Supervisor'
  );

  return (
    <div className="flex flex-col border-l hover:bg-gray-50 transition-colors max-w-full">
      {/* Header - Collapsed view */}
      <div 
        className="flex items-center w-full gap-2 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="flex-shrink-0 p-1">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <h4 className="font-sm text-gray-900 truncate">
              {site.name}
            </h4>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={(e) => handleAction(e, () => onEdit(site))}
            className="p-1 text-gray-500 hover:text-primary transition-colors"
            title="Editar Sitio"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleAction(e, () => onDelete(site))}
            className="p-1 text-gray-500 hover:text-error transition-colors"
            title="Eliminar Sitio"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 sm:px-12 pb-4 space-y-4 w-full">
          {/* Contact information section */}
          {(site.contactName || site.contactEmail || site.contactPhone) && (
            <div className="space-y-2 max-w-full">
              <h5 className="text-sm font-medium text-gray-900">
                Información de Contacto
              </h5>
              <div className="space-y-2">
                {site.contactName && (
                  <div className="flex items-center gap-2 min-w-0">
                    <PersonStanding className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 truncate">{site.contactName}</span>
                  </div>
                )}
                {site.contactEmail && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a 
                      href={`mailto:${site.contactEmail}`}
                      className="text-primary hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {site.contactEmail}
                    </a>
                  </div>
                )}
                {site.contactPhone && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a 
                      href={`tel:${site.contactPhone}`}
                      className="text-primary hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {site.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Supervisor section */}
          {supervisor && (
            <div className="space-y-2 max-w-full">
              <h5 className="text-sm font-medium text-gray-900">
                Supervisor
              </h5>
                {supervisor && (
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 truncate">{supervisor.employee.LookupValue}</span>
                  </div>
                )}
              </div>
          )}

          {/* Systems section */}
          {site.systems && site.systems.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <GanttChart className="h-4 w-4 text-gray-400 flex-shrink-0" />
                Sistemas Instalados
              </h5>
              <div className="flex flex-wrap gap-2">
                {site.systems.map((system, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {system.LookupValue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location details */}
          {site.location && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                Ubicación Exacta
              </h5>
              <p className="text-sm text-gray-600 break-words">
                {site.location}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SiteItem;