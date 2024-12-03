import { useState, useCallback } from 'react';
import { generateDisplayName, validateFileSize, validateFileType } from '../../../../../utils/fileUtils';

export const useFileManagement = ({
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  allowedTypes = [],
  generateNames = false,
  namePrefix = ''
} = {}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = useCallback((file) => {
    if (!validateFileType(file, allowedTypes)) {
      throw new Error('Tipo de archivo no permitido');
    }
    if (!validateFileSize(file, maxSize)) {
      throw new Error(`El archivo no debe superar ${maxSize} bytes`);
    }
  }, [allowedTypes, maxSize]);

  const addFiles = useCallback((newFiles) => {
    setError(null);
    
    try {
      // Validate total number of files
      if (files.length + newFiles.length > maxFiles) {
        throw new Error(`No se pueden subir más de ${maxFiles} archivos`);
      }

      // Validate each file
      newFiles.forEach(validateFile);

      // Process files
      const processedFiles = newFiles.map(file => ({
        file,
        name: generateNames ? generateDisplayName(file, namePrefix) : file.name,
        displayName: '',
        size: file.size,
        type: file.type
      }));

      setFiles(prev => [...prev, ...processedFiles]);
    } catch (err) {
      setError(err.message);
    }
  }, [files, maxFiles, validateFile, generateNames, namePrefix]);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const updateDisplayName = useCallback((index, displayName) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, displayName } : file
    ));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  return {
    files,
    uploading,
    error,
    addFiles,
    removeFile,
    updateDisplayName,
    clearFiles,
    setUploading,
    setError
  };
};