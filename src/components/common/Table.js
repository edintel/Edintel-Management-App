import React from 'react';
import { cn } from '../../utils/cn';

const Table = ({ 
  columns, 
  data, 
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  ...props 
}) => {
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
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column, index) => (
              <th 
                key={index}
                className={cn(
                  "h-12 px-4 text-left align-middle text-sm font-medium text-gray-500 bg-gray-50",
                  column.className
                )}
                style={column.style}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                "border-b border-gray-200 transition-colors",
                onRowClick && "cursor-pointer hover:bg-gray-50"
              )}
            >
              {columns.map((column, colIndex) => (
                <td 
                  key={colIndex}
                  className={cn(
                    "p-4 align-middle text-sm",
                    column.className
                  )}
                  style={column.style}
                >
                  {column.render 
                    ? column.render(row[column.key], row) 
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