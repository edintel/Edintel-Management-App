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