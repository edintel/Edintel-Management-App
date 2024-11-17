import React from 'react';
import { User, Mail, Phone, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../../../../../utils/cn';

const TechniciansList = ({
  technicians = [],
  onSelect,
  selectedIds = [],
  showAvailability = false,
  showContact = false,
  layout = 'grid',
  className
}) => {
  const layouts = {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    list: 'space-y-3'
  };

  if (!technicians.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-gray-500">
        <User className="w-12 h-12 mb-2" />
        <p>No hay técnicos asignados</p>
      </div>
    );
  }

  return (
    <div className={cn(layouts[layout], className)}>
      {technicians.map((tech) => (
        <div
          key={tech.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border transition-colors',
            onSelect && 'cursor-pointer hover:bg-gray-50',
            selectedIds.includes(tech.id) && 'border-primary bg-primary/5'
          )}
          onClick={() => onSelect?.(tech.id)}
        >
          {/* Avatar/Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-gray-900 truncate">
                  {tech.name}
                </h4>
                {showContact && (
                  <div className="mt-1 space-y-1">
                    {tech.email && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{tech.email}</span>
                      </div>
                    )}
                    {tech.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{tech.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Availability Badge */}
              {showAvailability && (
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  tech.isAvailable 
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                )}>
                  {tech.isAvailable ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>Disponible</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      <span>Ocupado</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Schedule/Calendar */}
            {tech.nextAvailable && !tech.isAvailable && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>
                  Disponible {new Date(tech.nextAvailable).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Current Assignments */}
            {tech.activeTickets > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                {tech.activeTickets} tickets activos
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TechniciansList;