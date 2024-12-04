import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import { validateFileSize, validateFileType, formatFileSize } from '../../utils/fileUtils';

const MultiFileUpload = ({
  files = [],
  onFilesChange,
  onRemove,
  onDisplayNameChange,
  showDisplayName = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  disabled = false,
  error = null,
  className
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [disabled, files, maxFiles, onFilesChange]);

  const handleFiles = (newFiles) => {
    setLocalError(null);

    // Validate number of files
    if (files.length + newFiles.length > maxFiles) {
      setLocalError(`No se pueden subir más de ${maxFiles} archivos`);
      return;
    }

    // Validate each file
    const validFiles = newFiles.filter(file => {
      if (!validateFileType(file, allowedTypes)) {
        setLocalError('Tipo de archivo no permitido');
        return false;
      }
      if (!validateFileSize(file, maxSize)) {
        setLocalError(`El archivo no debe superar ${formatFileSize(maxSize)}`);
        return false;
      }
      return true;
    });

    if (validFiles.length) {
      onFilesChange([...files, ...validFiles]);
    }
  };

  const handleFileSelect = (e) => {
    if (disabled) return;
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
    e.target.value = null; // Reset input
  };

  const displayError = error || localError;

  return (
    <div className={cn("space-y-4", className)}>
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {showDisplayName && (
                  <input
                    type="text"
                    value={file.displayName || ''}
                    onChange={(e) => onDisplayNameChange?.(index, e.target.value)}
                    className="w-full px-3 py-1.5 border rounded text-sm mb-1"
                    placeholder="Nombre para mostrar"
                  />
                )}
                <p className="text-sm text-gray-600 truncate">{file.name}</p>
              </div>
              <button 
                onClick={() => onRemove(index)} 
                className="p-1 hover:bg-gray-200 rounded"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
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
            dragActive ? "border-primary bg-primary/5" : "border-gray-300",
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
              Formatos permitidos: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};

export default MultiFileUpload;