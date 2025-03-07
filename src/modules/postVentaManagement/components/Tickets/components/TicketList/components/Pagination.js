import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../../../../../utils/cn';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  startIndex,
  endIndex
}) => {
  // Generate page buttons with ellipsis for large page counts
  const getPageButtons = () => {
    const buttons = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Ensure we always show 5 page buttons if possible
    if (endPage - startPage + 1 < 5) {
      if (currentPage < 3) {
        endPage = Math.min(5, totalPages);
      } else if (currentPage > totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }
    }
    
    // Add first page button
    if (startPage > 1) {
      buttons.push(
        <PageButton 
          key={1} 
          pageNumber={1} 
          isActive={currentPage === 1} 
          onClick={() => onPageChange(1)} 
        />
      );
      
      // Add ellipsis if needed
      if (startPage > 2) {
        buttons.push(<Ellipsis key="ellipsis-1" />);
      }
    }
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <PageButton 
          key={i} 
          pageNumber={i} 
          isActive={currentPage === i} 
          onClick={() => onPageChange(i)} 
        />
      );
    }
    
    // Add last page button
    if (endPage < totalPages) {
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        buttons.push(<Ellipsis key="ellipsis-2" />);
      }
      
      buttons.push(
        <PageButton 
          key={totalPages} 
          pageNumber={totalPages} 
          isActive={currentPage === totalPages} 
          onClick={() => onPageChange(totalPages)} 
        />
      );
    }
    
    return buttons;
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border rounded-lg">
      {/* Items per page & Info */}
      <div className="flex flex-col sm:flex-row items-center mb-4 sm:mb-0 gap-2 text-sm text-gray-700">
        <div className="flex items-center">
          <span>Mostrar</span>
          <select
            className="mx-2 border rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-primary"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>por página</span>
        </div>
        
        <div className="hidden sm:block text-sm text-gray-700 whitespace-nowrap ml-4">
          Mostrando <span className="font-medium">{startIndex}</span> a{' '}
          <span className="font-medium">{endIndex}</span> de{' '}
          <span className="font-medium">{totalItems}</span> resultados
        </div>
      </div>
      
      {/* Pagination buttons */}
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "relative inline-flex items-center px-2 py-2 rounded-md font-medium",
            currentPage === 1 
              ? "text-gray-400 cursor-not-allowed" 
              : "text-gray-700 hover:bg-gray-50"
          )}
        >
          <span className="sr-only">Anterior</span>
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {/* Page buttons */}
        <div className="hidden md:flex items-center space-x-1">
          {getPageButtons()}
        </div>
        
        {/* Simplified mobile pagination info */}
        <div className="md:hidden flex items-center px-2">
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
        </div>
        
        {/* Next button */}
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "relative inline-flex items-center px-2 py-2 rounded-md font-medium",
            currentPage === totalPages 
              ? "text-gray-400 cursor-not-allowed" 
              : "text-gray-700 hover:bg-gray-50"
          )}
        >
          <span className="sr-only">Siguiente</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// Page button component
const PageButton = ({ pageNumber, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md",
        isActive
          ? "bg-primary text-white"
          : "text-gray-700 hover:bg-gray-50"
      )}
    >
      {pageNumber}
    </button>
  );
};

// Ellipsis component
const Ellipsis = () => {
  return (
    <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
      ...
    </span>
  );
};

export default React.memo(Pagination);