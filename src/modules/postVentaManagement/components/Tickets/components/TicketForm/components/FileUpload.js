import React, { useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { cn } from '../../../../../../../utils/cn';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.xlsx,.xlsm,.xlsb';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FileUpload = ({
  value,
  onChange,
  error,
  disabled = false,
  className
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const fileType = file.name.split('.').pop().toLowerCase();
    const acceptedTypes = ACCEPTED_FILE_TYPES.split(',').map(type => 
      type.replace('.', '').toLowerCase()
    );

    if (!acceptedTypes.includes(fileType)) {
      onChange(null);
      alert('Tipo de archivo no permitido. Por favor, use formatos PDF, DOC, DOCX, o Excel.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      onChange(null);
      alert('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
      return;
    }

    onChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-400" />
        Descripción *
      </label>

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-colors",
          disabled ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-primary",
          error && "border-error",
          value ? "p-4" : "p-6"
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {value.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(value.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="p-1 text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div className="mt-2">
              <label
                htmlFor="file-upload"
                className={cn(
                  "relative cursor-pointer rounded-md font-medium",
                  disabled ? "text-gray-400" : "text-primary hover:text-primary/80"
                )}
              >
                <span>Subir archivo</span>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileChange}
                  disabled={disabled}
                />
              </label>
              <p className="pl-1 inline text-sm text-gray-500">
                o arrastrar y soltar
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PDF, DOC, DOCX o Excel hasta 10MB
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;