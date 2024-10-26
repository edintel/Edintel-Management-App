// src/utils/imageUtils.js

/**
 * Compresses an image while maintaining readability
 * Target size is approximately 800x800 max dimensions
 * and 75% JPEG quality which provides good readability
 * while keeping file size reasonable
 */
export const optimizeImage = async (file) => {
    return new Promise((resolve, reject) => {
      // Create elements for image manipulation
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
  
      // Set up image onload handler
      img.onload = () => {
        // Release the temporary object URL
        URL.revokeObjectURL(img.src);
  
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
  
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
  
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
  
        // Draw image with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
  
        // Convert to blob with quality setting
        canvas.toBlob(
          (blob) => {
            // Create a new file from the blob
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + "_optimized.jpg",
              {
                type: "image/jpeg",
                lastModified: Date.now(),
              }
            );
            
            resolve(optimizedFile);
          },
          "image/jpeg",
          0.75 // JPEG quality (0-1), 0.75 provides good balance
        );
      };
  
      // Handle load errors
      img.onerror = (error) => {
        reject(new Error('Error al procesar la imagen'));
      };
  
      // Load image from file
      img.src = URL.createObjectURL(file);
    });
  };
  
  /**
   * Validates image file type and size
   */
  export const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 20 * 1024 * 1024; // 20MB max initial size
  
    if (!validTypes.includes(file.type)) {
      throw new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF)');
    }
  
    if (file.size > maxSize) {
      throw new Error('El archivo no debe superar los 20MB');
    }
  
    return true;
  };
  
  /**
   * Gets approximate file size in MB
   */
  export const getFileSizeMB = (file) => {
    return (file.size / (1024 * 1024)).toFixed(2);
  };