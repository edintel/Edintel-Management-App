import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

const Table = ({ 
  columns, 
  data, 
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  responsive = false, // New prop to enable responsive mode
  ...props 
}) => {
  // Track screen size for responsive tables
  const [isMobile, setIsMobile] = useState(false);
  
  // Setup resize listener if responsive mode is enabled
  useEffect(() => {
    if (!responsive) return;
    
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initialize on mount
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup on unmount
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [responsive]);
  
  // Filter columns based on screen size when responsive is enabled
  const visibleColumns = responsive && isMobile
    ? columns.filter(col => 
        !col.hiddenOnMobile && col.responsive !== false
      )
    : columns;
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span>Cargando datos...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        {typeof emptyMessage === 'string' ? (
          <span>{emptyMessage}</span>
        ) : (
          emptyMessage
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-auto", className)} {...props}>
      <table className={cn(
        "w-full border-collapse",
        !responsive && "min-w-[600px]" // Only apply min-width when not in responsive mode
      )}>
        <thead>
          <tr className="border-b border-gray-200">
            {visibleColumns.map((column, index) => (
              <th 
                key={index}
                className={cn(
                  "h-12 px-4 text-left align-middle text-sm font-medium text-gray-500 bg-gray-50",
                  column.className
                )}
                style={column.style}
              >
                {typeof column.header === 'function' ? column.header() : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                "border-b border-gray-200 transition-colors",
                onRowClick && "cursor-pointer hover:bg-gray-50"
              )}
            >
              {visibleColumns.map((column, colIndex) => (
                <td 
                  key={colIndex}
                  className={cn(
                    "p-4 align-middle text-sm",
                    column.className
                  )}
                  style={column.style}
                >
                  {column.render 
                    ? column.render(row[column.key], row, rowIndex) 
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;