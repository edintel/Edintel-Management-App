// src/components/common/Table.js
import React from 'react';
import './Table.css';

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
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <span>Cargando datos...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        {typeof emptyMessage === 'string' ? (
          <span>{emptyMessage}</span>
        ) : (
          emptyMessage
        )}
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`} {...props}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index}
                className={column.className || ''}
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
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((column, colIndex) => (
                <td 
                  key={colIndex}
                  className={column.className || ''}
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