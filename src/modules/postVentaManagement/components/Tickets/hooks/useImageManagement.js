import { useState, useCallback, useEffect } from 'react';
import { generateDisplayName } from '../../../../../utils/fileUtils';
import { optimizeImage, validateImage, getFileSizeMB } from '../../../../../utils/imageUtils';

export const useImageManagement = ({
  generateNames = false,
  namePrefix = ''
} = {}) => {
  const [images, setImages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const addImages = useCallback(async (newImages) => {
    setError(null);
    setProcessing(true);
    
    try {
      const processedImages = await Promise.all(newImages.map(async (imageInput) => {
        // Ensure we're working with a File object
        const file = imageInput instanceof File ? imageInput : imageInput.file;
        
        // Validate and optimize the image
        validateImage(file);
        const originalSize = getFileSizeMB(file);
        const optimizedFile = await optimizeImage(file);
        const optimizedSize = getFileSizeMB(optimizedFile);

        // Generate new name if needed
        let processedFile = optimizedFile;
        if (generateNames) {
          const newName = generateDisplayName(optimizedFile, namePrefix);
          // Create a proper File object
          processedFile = new File([optimizedFile], newName, { 
            type: optimizedFile.type,
            lastModified: optimizedFile.lastModified 
          });
        }

        // Create preview URL from the Blob/File
        const preview = URL.createObjectURL(new Blob([processedFile], { type: processedFile.type }));

        return {
          file: processedFile,
          preview,
          originalSize,
          optimizedSize,
          name: processedFile.name,
          displayName: ''
        };
      }));

      setImages(prev => [...prev, ...processedImages]);
    } catch (err) {
      console.error('Error in addImages:', err);
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [generateNames, namePrefix]);

  const removeImage = useCallback((index) => {
    setImages(prev => {
      // Ensure preview URL exists before trying to revoke it
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return prev.filter((_, i) => i !== index);
    });
    setError(null);
  }, []);

  const updateDisplayName = useCallback((index, displayName) => {
    setImages(prev => prev.map((image, i) => 
      i === index ? { ...image, displayName } : image
    ));
  }, []);

  const clearImages = useCallback(() => {
    // Clean up all preview URLs
    images.forEach(image => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
    setImages([]);
    setError(null);
  }, [images]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [images]);

  return {
    images,
    processing,
    error,
    addImages,
    removeImage,
    updateDisplayName,
    clearImages,
    setProcessing,
    setError
  };
};