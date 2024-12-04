import { useState, useCallback } from 'react';
import { generateDisplayName, validateFileSize } from '../../../../../utils/fileUtils';

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

const validateFileType = (file, allowedTypes) => {
  if (!file?.name) {
    console.log('File or filename is missing');
    return false;
  }

  if (!allowedTypes?.length) {
    console.log('No allowed types specified');
    return false;
  }

  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

  // Check direct file type match
  if (allowedTypes.includes(file.type)) {
    return true;
  }

  // Check extension match from allowed MIME types
  for (const allowedType of allowedTypes) {
    const allowedExtension = FILE_TYPE_MAP[allowedType];
    if (allowedExtension && allowedExtension === fileExtension) {
      return true;
    }
  }

  // Special case for DOCX
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

  const validateFile = useCallback((fileObj) => {
    // Extract the actual File object
    const file = fileObj instanceof File ? fileObj : fileObj.file;

    if (!file?.name) {
      throw new Error('Archivo inválido');
    }

    const isValidType = validateFileType(file, allowedTypes);
    if (!isValidType) {
      throw new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`);
    }

    if (!validateFileSize(file, maxSize)) {
      throw new Error(`El archivo no debe superar ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
    }

    return file;
  }, [allowedTypes, maxSize]);

  const addFiles = useCallback((newFiles) => {
    setError(null);
    
    try {
      // Convert to array if it's a FileList
      const filesArray = Array.from(newFiles);

      if (files.length + filesArray.length > maxFiles) {
        throw new Error(`No se pueden subir más de ${maxFiles} archivos`);
      }

      // Process and validate files
      const processedFiles = filesArray.map(fileInput => {
        // Get the actual File object after validation
        const validFile = validateFile(fileInput);
        
        let processedFile = validFile;
        if (generateNames) {
          const newName = generateDisplayName(validFile, namePrefix);
          processedFile = new File([validFile], newName, { 
            type: validFile.type,
            lastModified: validFile.lastModified 
          });
        }

        return {
          file: processedFile,
          displayName: ''
        };
      });

      setFiles(prev => [...prev, ...processedFiles]);
    } catch (err) {
      console.error('Error in addFiles:', err);
      setError(err.message);
      throw err;
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