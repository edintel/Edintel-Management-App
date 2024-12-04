import React from 'react';
import { Upload, X, AlertCircle, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import { validateFileSize, formatFileSize } from '../../utils/fileUtils';

const MultiFileUpload = ({
  files = [],
  onFilesChange,
  onRemove,
  onDisplayNameChange,
  showDisplayName = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  allowedTypes = ['.pdf', '.doc', '.docx', '.xlsx', '.xlsm', '.xlsb'],
  disabled = false,
  error = null,
  className
}) => {
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFiles = (newFiles) => {
    // Check total number of files
    if (files.length + newFiles.length > maxFiles) {
      throw new Error(`No se pueden subir más de ${maxFiles} archivos`);
    }

    // Validate each file
    return newFiles.filter(file => {
      if (!file || !file.name) return false;
      
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        throw new Error(`Tipo de archivo no permitido. Use: ${allowedTypes.join(', ')}`);
      }
      if (!validateFileSize(file, maxSize)) {
        throw new Error(`El archivo no debe superar ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
      }
      return true;
    });
  };

  const processNewFiles = async (incomingFiles) => {
    try {
      const validFiles = validateFiles(incomingFiles);
      
      const processedFiles = validFiles.map(file => ({
        file,
        displayName: ''
      }));
      
      if (processedFiles.length > 0) {
        onFilesChange(processedFiles);
      }
    } catch (err) {
      console.error('Error processing files:', err);
      if (err.message) alert(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processNewFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(e.target.files || []);
    processNewFiles(selectedFiles);
    e.target.value = null; // Reset input
  };

  const displayAllowedTypes = () => {
    return allowedTypes.join(', ');
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileObj, index) => {
            // Safety check to ensure file object exists and has required properties
            if (!fileObj?.file?.name) return null;
            
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {showDisplayName && (
                    <input
                      type="text"
                      value={fileObj.displayName || ''}
                      onChange={(e) => onDisplayNameChange?.(index, e.target.value)}
                      className="w-full px-3 py-1.5 border rounded text-sm mb-1"
                      placeholder="Nombre para mostrar"
                    />
                  )}
                  <p className="text-sm text-gray-600 truncate">{fileObj.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {fileObj.file.size ? formatFileSize(fileObj.file.size) : 'Calculando tamaño...'}
                  </p>
                </div>
                <button 
                  onClick={() => onRemove(index)} 
                  className="p-1 hover:bg-gray-200 rounded"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Area */}
      {files.length < maxFiles && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors",
            "border-gray-300 hover:border-primary hover:bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            accept={allowedTypes.join(',')}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Arrastra archivos aquí o haz click para seleccionar
            </p>
            <p className="text-xs text-gray-500">
              Máximo {maxFiles} archivos de hasta {formatFileSize(maxSize)}
            </p>
            <p className="text-xs text-gray-500">
              Formatos permitidos: {displayAllowedTypes()}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default MultiFileUpload;