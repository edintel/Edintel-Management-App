import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, AlertCircle, Camera, Loader } from 'lucide-react';

const MultiImageUpload = ({
  images = [],
  onImagesChange,
  onRemove,
  maxImages = 5,
  className = "",
  error = null,
  disabled = false,
  processing = false
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
    };
    setIsMobile(checkMobile());
  }, []);

  const handleNewFiles = (incomingFiles) => {
    if (images.length + incomingFiles.length > maxImages) {
      alert(`No se pueden subir más de ${maxImages} imágenes`);
      return;
    }
    
    onImagesChange(Array.from(incomingFiles));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleNewFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(e.target.files || []);
    handleNewFiles(selectedFiles);
    e.target.value = null; // Reset input
  };

  const handleRemove = (index) => {
    if (disabled) return;
    
    if (onRemove) { 
      onRemove(index);
    }
  };

  const renderUploadArea = () => {
    if (images.length >= maxImages) return null;

    if (isMobile) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {/* Camera capture button */}
          <div className="relative">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <Camera size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 text-center">
                Usar cámara
              </span>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Tomar foto"
              disabled={disabled}
            />
          </div>

          {/* File upload button */}
          <div className="relative">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 text-center">
                Subir archivo
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Subir imágenes"
              disabled={disabled}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative border-2 border-dashed rounded-lg transition-colors border-gray-300 hover:border-primary hover:bg-primary/5"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Arrastra imágenes aquí o haz click para seleccionar
          </p>
          <p className="text-xs text-gray-500">
            Máximo {maxImages} imágenes
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={img.preview}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => handleRemove(index)}
                className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-lg 
                         hover:bg-error/90 transition-colors opacity-0 group-hover:opacity-100"
                disabled={disabled}
              >
                <X size={16} />
              </button>
              <div className="text-xs text-gray-500 mt-1 truncate">
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {processing ? (
        <div className="flex flex-col items-center justify-center p-6">
          <Loader className="w-8 h-8 animate-spin text-primary mb-2" />
          <span className="text-sm text-gray-500">Procesando imágenes...</span>
        </div>
      ) : (
        renderUploadArea()
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;