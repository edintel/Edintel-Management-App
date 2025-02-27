import React from 'react';
import { cn } from '../../utils/cn';

const STATUS_VARIANTS = {
  success: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  default: 'bg-gray-100 text-gray-700'
};

const StatusBadge = ({
  variant = 'default',
  children,
  className,
  icon,
  size = 'default',
  ...props
}) => {
  const sizes = {
    small: 'px-1.5 py-0.5 text-xs',
    default: 'px-2 py-1 text-xs',
    large: 'px-2.5 py-1 text-sm'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        STATUS_VARIANTS[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default StatusBadge;