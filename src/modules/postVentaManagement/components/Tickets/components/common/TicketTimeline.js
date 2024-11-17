import React from 'react';
import { CheckCircle, Clock, Play, Lock, UserCheck, FileCheck, Calendar } from 'lucide-react';
import { cn } from '../../../../../../utils/cn';

const TimelineConfig = {
  'Iniciada': {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100'
  },
  'Técnico asignado': {
    icon: UserCheck,
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
  'Confirmado por tecnico': {
    icon: CheckCircle,
    color: 'text-info',
    bgColor: 'bg-info/10'
  },
  'Trabajo iniciado': {
    icon: Play,
    color: 'text-info',
    bgColor: 'bg-info/10'
  },
  'Finalizada': {
    icon: FileCheck,
    color: 'text-success',
    bgColor: 'bg-success/10'
  },
  'Cerrada': {
    icon: Lock,
    color: 'text-success',
    bgColor: 'bg-success/10'
  },
  'Fecha programada': {
    icon: Calendar,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  }
};

const TicketTimeline = ({ 
  events,
  className 
}) => {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('es-CR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {events.map((event, index) => {
        const config = TimelineConfig[event.type] || TimelineConfig['Iniciada'];
        const Icon = config.icon;

        return (
          <div 
            key={index} 
            className={cn(
              'relative flex items-start gap-4 pb-4',
              index !== events.length - 1 && 'before:absolute before:left-6 before:top-10 before:h-full before:w-px before:bg-gray-200'
            )}
          >
            {/* Icon */}
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              config.bgColor
            )}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {event.type}
                </h4>
                <time className="text-sm text-gray-500">
                  {formatDate(event.date)}
                </time>
              </div>

              {event.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {event.description}
                </p>
              )}

              {/* Additional details */}
              {event.details && (
                <div className="mt-2 text-sm">
                  {Object.entries(event.details).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TicketTimeline;