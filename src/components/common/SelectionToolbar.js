import React from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';
const SelectionToolbar = ({
  selectedCount,
  onClearSelection,
  actions,
  className,
  position = 'top',
  ...props
}) => {
  if (selectedCount === 0) {
    return null;
  }
  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom print:hidden",
        position === 'top' ? 'top-16' : 'bottom-0',
        className
      )}
      {...props}
    >
      <div className="container max-w-7xl mx-auto px-4">
        <div className="bg-primary text-white shadow-lg rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {selectedCount} {selectedCount === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
            </span>
            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 text-white/80 hover:text-white"
            >
              <X size={16} />
              <span className="text-sm">Limpiar selección</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={cn(
                  "px-3 py-1.5 rounded-md font-medium text-sm flex items-center gap-1.5 transition-colors",
                  action.variant === 'default' ?
                    "bg-white/10 hover:bg-white/20" :
                    action.variant === 'destructive' ?
                      "bg-error hover:bg-error/90" :
                      "bg-white/10 hover:bg-white/20",
                  action.className
                )}
                disabled={action.disabled}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SelectionToolbar;