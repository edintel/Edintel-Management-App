import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const Table = ({ 
  columns, 
  data, 
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  responsive = false,
  
  // Pagination props
  paginated = false,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange = null,
  onItemsPerPageChange = null,
  
  // Optional height control
  minVisibleRows = 10,
  ...props 
}) => {
  // Simple function to determine if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Filter columns for mobile if needed
  const visibleColumns = responsive && isMobile
    ? columns.filter(col => !col.hiddenOnMobile && col.responsive !== false)
    : columns;
    
  // Pagination calculations
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Get current page of data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentPageData = paginated ? data.slice(startIndex, endIndex) : data;
  
  // Pagination UI
  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t">
      {/* Items per page & info */}
      <div className="mb-4 sm:mb-0 text-sm text-gray-700">
        <div className="flex items-center">
          <span>Mostrar</span>
          <select
            className="mx-2 border rounded-lg p-1"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>por página</span>
        </div>
      </div>
      
      {/* Page info and navigation */}
      <div className="flex items-center">
        <span className="mr-4 text-sm text-gray-700">
          {totalItems > 0 ? `${startIndex + 1}-${endIndex} de ${totalItems}` : '0 resultados'}
        </span>
        
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "px-2 py-1 rounded-md",
            currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-50"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <span className="mx-2 text-sm">
          Página {currentPage} de {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages || totalItems === 0}
          className={cn(
            "px-2 py-1 rounded-md",
            currentPage === totalPages || totalItems === 0 
              ? "text-gray-400 cursor-not-allowed" 
              : "text-gray-700 hover:bg-gray-50"
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500 min-h-[300px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span>Cargando datos...</span>
      </div>
    );
  }

  // For empty state
  if (!currentPageData.length) {
    return (
      <div className={className}>
        <div className="py-16 flex flex-col items-center justify-center text-gray-500">
          {typeof emptyMessage === 'string' ? (
            <span>{emptyMessage}</span>
          ) : (
            emptyMessage
          )}
        </div>
        {paginated && <PaginationControls />}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="overflow-auto">
        <table className="w-full border-collapse">
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
            {/* Current page data */}
            {currentPageData.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-gray-200 h-[53px]",
                  onRowClick && "cursor-pointer hover:bg-gray-50"
                )}
              >
                {visibleColumns.map((column, colIndex) => (
                  <td 
                    key={colIndex}
                    className={cn("p-4 align-middle text-sm", column.className)}
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
      
      {/* Pagination controls */}
      {paginated && <PaginationControls />}
    </div>
  );
};

export default Table;