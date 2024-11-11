import React, { useRef, useState, useEffect } from "react";
import { Camera, Upload, X, Loader } from "lucide-react";
import SharePointImage from "./SharePointImage";
import {
  optimizeImage,
  validateImage,
  getFileSizeMB,
} from "../../utils/imageUtils";

const CameraUpload = ({
  onImageCapture,
  onError,
  className = "",
  previewItemId = null,
  service = null,
  siteId = null,
  driveId = null,
  loading = false,
}) => {
  const [preview, setPreview] = useState(null);
  const [isSharePointImage, setIsSharePointImage] = useState(
    Boolean(previewItemId)
  );
  const [imageInfo, setImageInfo] = useState(null);
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

  const handleImageChange = async (e, source) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateImage(file);
      const originalSize = getFileSizeMB(file);
      const optimizedFile = await optimizeImage(file);
      const optimizedSize = getFileSizeMB(optimizedFile);

      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setIsSharePointImage(false);
        setImageInfo({
          originalSize,
          optimizedSize,
          name: file.name,
          source,
        });
      };
      reader.readAsDataURL(optimizedFile);

      // Notify parent component
      onImageCapture(optimizedFile);
    } catch (err) {
      console.error("Error processing image:", err);
      onError?.(err.message || "Error al procesar la imagen");
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setIsSharePointImage(false);
    setImageInfo(null);
    onImageCapture(null);
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Initialize with SharePoint preview if available
  React.useEffect(() => {
    if (previewItemId) {
      setIsSharePointImage(true);
      setPreview(previewItemId);
    }
  }, [previewItemId]);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-6">
          <Loader className="w-8 h-8 animate-spin text-primary mb-2" />
          <span className="text-sm text-gray-500">Procesando imagen...</span>
        </div>
      );
    }

    if (!preview) return null;

    return (
      <div className="space-y-4">
        <div className="relative inline-block">
          {isSharePointImage && service && siteId && driveId ? (
            <SharePointImage
              itemId={preview}
              service={service}
              siteId={siteId}
              driveId={driveId}
              className="max-w-xs mx-auto rounded-lg"
              alt="Preview"
            />
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="max-w-xs mx-auto rounded-lg"
            />
          )}
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-lg hover:bg-error/90 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {imageInfo && (
          <div className="text-sm text-gray-500">
            <p>Archivo: {imageInfo.name}</p>
          </div>
        )}
      </div>
    );
  };

  const renderUploadOptions = () => {
    if (!preview) {
      if (isMobile) {
        // On mobile, show both options in a grid
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
                onChange={(e) => handleImageChange(e, "camera")}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Tomar foto"
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
                onChange={(e) => handleImageChange(e, "file")}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Subir imagen"
              />
            </div>
          </div>
        );
      } else {
        // On desktop, show only file upload
        return (
          <div className="relative">
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                Click para subir o arrastrar archivo
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "file")}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Subir imagen"
            />
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className={className}>
      {preview ? (
        renderPreview()
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary transition-colors">
          {renderUploadOptions()}
        </div>
      )}
    </div>
  );
};

export default CameraUpload;
