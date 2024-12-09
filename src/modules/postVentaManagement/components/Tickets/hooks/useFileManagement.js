import { useState, useCallback } from 'react';
import { generateDisplayName } from '../../../../../utils/fileUtils';

export const useFileManagement = ({
  generateNames = false,
  namePrefix = ''
} = {}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const addFiles = useCallback((newFiles) => {
    setError(null);
    
    try {
      // Process files - only handle name generation if needed
      const processedFiles = newFiles.map(fileInput => {
        const file = fileInput instanceof File ? fileInput : fileInput.file;
        
        let processedFile = file;
        if (generateNames) {
          const newName = generateDisplayName(file, namePrefix);
          processedFile = new File([file], newName, { 
            type: file.type,
            lastModified: file.lastModified 
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
  }, [generateNames, namePrefix]);

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