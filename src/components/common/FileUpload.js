import React, { useState, useRef } from 'react';
import { FileText, Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const FileUpload = ({
  value,
  onChange,
  error,
  allowedTypes = ['.pdf', '.doc', '.docx', '.xlsx', '.xlsm', '.xlsb'],
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  required = false,
  loading = false,
  className,
  label = "Archivo",
  description,
  showPreview = true
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`Tipo de archivo no permitido. Use: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`El archivo excede el tamaño máximo de ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        validateFile(file);
        onChange(file);
      } catch (err) {
        onChange(null);
        alert(err.message);
      }
    }
  };

  const handleFileSelect = (e) => {
    if (disabled) return;
    
    const file = e.target.files[0];
    if (file) {
      try {
        validateFile(file);
        onChange(file);
      } catch (err) {
        onChange(null);
        alert(err.message);
      }
    }
    e.target.value = null; // Reset input
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          {label} {required && '*'}
        </label>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300",
          disabled && "opacity-50 cursor-not-allowed",
          value && showPreview ? "p-4" : "p-6"
        )}
      >
        {value && showPreview ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {value.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(value.size)}
                </p>
              </div>
            </div>
            {!disabled && !loading && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1 text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {loading && (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept={allowedTypes.join(',')}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="mt-2">
                <label className={cn(
                  "relative cursor-pointer rounded-md font-medium",
                  disabled ? "text-gray-400" : "text-primary hover:text-primary/80"
                )}>
                  Subir archivo
                </label>
                <p className="pl-1 inline text-sm text-gray-500">
                  o arrastrar y soltar
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {allowedTypes.join(', ')} hasta {(maxSize / (1024 * 1024)).toFixed(0)}MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;