export const validateFileType = (file, allowedTypes) => {
    if (!file || !allowedTypes?.length) return false;
    return allowedTypes.includes(file.type);
  };
  
  export const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  export const generateDisplayName = (file, prefix = '') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    return `${prefix}${timestamp}-${randomStr}.${extension}`;
  };
  
  export const validateFileSize = (file, maxSize = 10 * 1024 * 1024) => { // Default 10MB
    if (!file) return false;
    return file.size <= maxSize;
  };
  
  export const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  };

  export const sanitizePathComponent = (name) => {
    if (!name) return '';
    
    // Define allowed characters (alphanumeric, Spanish accents, spaces, hyphens, underscores)
    const allowedCharsRegex = /[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s\-_]/g;
    
    // Replace any disallowed characters with empty string
    const sanitized = name.replace(allowedCharsRegex, '');
    
    // Replace multiple spaces with single space and trim
    return sanitized.replace(/\s+/g, ' ').trim();
  };
  
  export const validatePathComponent = (name) => {
    if (!name || typeof name !== 'string') {
      return {
        isValid: false,
        error: 'El nombre es requerido'
      };
    }
  
    const sanitized = sanitizePathComponent(name);
    
    if (sanitized.length === 0) {
      return {
        isValid: false,
        error: 'El nombre debe contener caracteres válidos (letras, números, espacios, guiones o subrayados)'
      };
    }
  
    if (sanitized !== name) {
      return {
        isValid: false,
        error: 'El nombre contiene caracteres no permitidos. Solo se permiten letras, números, acentos españoles, espacios, guiones y subrayados',
        sanitizedValue: sanitized
      };
    }
  
    return {
      isValid: true,
      sanitizedValue: sanitized
    };
  };
  
  export const handlePathComponentValidation = (name, setError, setFieldValue) => {
    const validation = validatePathComponent(name);
  
    if (!validation.isValid) {
      setError?.(validation.error);
      if (validation.sanitizedValue) {
        setFieldValue?.(validation.sanitizedValue);
      }
      return false;
    }
  
    setError?.(null);
    return true;
  };