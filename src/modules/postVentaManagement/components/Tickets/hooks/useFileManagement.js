import { useState, useCallback } from 'react';
import { generateDisplayName, validateFileSize } from '../../../../../utils/fileUtils';

// Map of MIME types to file extensions and vice versa
const FILE_TYPE_MAP = {
  // MIME types to extensions
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel.sheet.macroEnabled.12': '.xlsm',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12': '.xlsb',
  
  // Extensions to MIME types
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.xlsm': ['application/vnd.ms-excel.sheet.macroEnabled.12'],
  '.xlsb': ['application/vnd.ms-excel.sheet.binary.macroEnabled.12']
};

// Helper function to validate file type using both MIME types and extensions
const validateFileType = (file, allowedTypes) => {
  if (!file || !allowedTypes?.length) return false;

  // Get the file extension
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

  // Convert allowed types to a set of valid extensions and MIME types
  const validTypes = new Set(allowedTypes.flatMap(type => {
    if (type.startsWith('.')) {
      // If it's an extension, get its MIME types
      return FILE_TYPE_MAP[type.toLowerCase()] || [];
    } else {
      // If it's a MIME type, get its extension
      return [FILE_TYPE_MAP[type]];
    }
  }));

  // Check if the file extension is valid
  if (validTypes.has(fileExtension)) return true;

  // Also check MIME type if available
  if (file.type && validTypes.has(file.type)) return true;

  // Special case for DOCX files (which sometimes have undefined type)
  if (fileExtension === '.docx' && allowedTypes.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    return true;
  }

  return false;
};

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
      console.log('File validation failed:', {
        fileName: file.name,
        fileType: file.type,
        allowedTypes,
        fileExtension: '.' + file.name.split('.').pop().toLowerCase()
      });
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