import React from 'react';
import { cn } from '../../utils/cn';

const Alert = ({ 
  children, 
  variant = 'default',
  icon,
  className,
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    destructive: 'bg-error/10 text-error'
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative rounded-lg p-4 flex items-start gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="h-4 w-4 flex-shrink-0">{icon}</span>}
      <div className="flex-1">{children}</div>
    </div>
  );
};

const AlertDescription = ({ className, ...props }) => (
  <div
    className={cn('text-sm font-medium leading-5', className)}
    {...props}
  />
);

export { Alert, AlertDescription };