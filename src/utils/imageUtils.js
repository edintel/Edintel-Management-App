/**
 * Compresses an image while maintaining high quality
 * Uses a larger max dimension and higher JPEG quality
 * Implements better scaling algorithm for clearer results
 */
export const optimizeImage = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Release the object URL immediately
      URL.revokeObjectURL(img.src);

      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 1600; // Increased from 800 to 1600 for better quality
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB target size

      if (width > height && width > MAX_SIZE) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }

      // Use stepped scaling for better quality on large reductions
      let currentWidth = img.width;
      let currentHeight = img.height;
      let targetWidth = width;
      let targetHeight = height;

      // Create temporary canvases for stepped downscaling
      const scaleSteps = [];
      while (currentWidth * 0.5 > targetWidth) {
        currentWidth = currentWidth * 0.5;
        currentHeight = currentHeight * 0.5;
        scaleSteps.push({ width: currentWidth, height: currentHeight });
      }
      scaleSteps.push({ width: targetWidth, height: targetHeight });

      let tempCanvas = document.createElement("canvas");
      let tempCtx = tempCanvas.getContext("2d");

      // Apply stepped downscaling
      if (scaleSteps.length > 1) {
        let currentImg = img;
        for (let i = 0; i < scaleSteps.length; i++) {
          const step = scaleSteps[i];
          tempCanvas.width = step.width;
          tempCanvas.height = step.height;

          // Apply better image smoothing
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = "high";

          // Draw current step
          tempCtx.drawImage(currentImg, 0, 0, step.width, step.height);

          // Prepare for next step
          if (i < scaleSteps.length - 1) {
            currentImg = tempCanvas;
            tempCanvas = document.createElement("canvas");
            tempCtx = tempCanvas.getContext("2d");
          }
        }
      }

      // Set final canvas dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Apply final drawing with high-quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (scaleSteps.length > 1) {
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
      } else {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }

      // Use multiple quality levels if needed to meet target file size
      const tryQuality = (startQuality) => {
        return new Promise((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve({
                blob,
                quality: startQuality,
              });
            },
            "image/jpeg",
            startQuality
          );
        });
      };

      // Try different quality levels if needed
      const findOptimalQuality = async () => {
        const qualities = [0.95, 0.9, 0.85, 0.8, 0.75];

        for (let quality of qualities) {
          const result = await tryQuality(quality);
          if (
            result.blob.size <= MAX_FILE_SIZE ||
            quality === qualities[qualities.length - 1]
          ) {
            return result;
          }
        }
      };

      findOptimalQuality().then((result) => {
        const optimizedFile = new File(
          [result.blob],
          file.name.replace(/\.[^/.]+$/, "") + "_optimized.jpg",
          {
            type: "image/jpeg",
            lastModified: Date.now(),
          }
        );

        resolve(optimizedFile);
      });
    };

    img.onerror = () => {
      reject(new Error("Error al procesar la imagen"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validates image file type and size
 */
export const validateImage = (file) => {
  // Common image MIME types
  const validTypes = [
    // Standard web formats
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    
    // Raw formats
    'image/x-adobe-dng',
    'image/x-canon-cr2',
    'image/x-nikon-nef',
    'image/x-sony-arw',
    'image/x-panasonic-rw2',
    'image/x-olympus-orf',
    'image/x-fujifilm-raf',
    
    // High quality formats
    'image/tiff',
    'image/bmp',
    
    // Vector formats
    'image/svg+xml',
    
    // Modern formats
    'image/avif',
    'image/heic',
    'image/heif',
    
    // Basic validation for when browser returns generic image type
    'image/*',
    'image'
  ];

  const maxSize = 20 * 1024 * 1024; // 20MB limit

  // Check if file has any type property
  if (!file.type) {
    // If no type, try to validate using file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 
      'dng', 'cr2', 'nef', 'arw', 'rw2', 'orf', 'raf',
      'tiff', 'tif', 'bmp', 'svg',
      'avif', 'heic', 'heif'
    ];
    
    if (!extension || !validExtensions.includes(extension)) {
      throw new Error("El archivo debe ser una imagen válida");
    }
  } else if (!validTypes.some(type => 
    // Check if file type matches exactly or matches wildcard pattern
    file.type === type || 
    (type.endsWith('*') && file.type.startsWith(type.slice(0, -1)))
  )) {
    throw new Error("El archivo debe ser una imagen válida");
  }

  if (file.size > maxSize) {
    throw new Error("El archivo no debe superar los 20MB");
  }

  return true;
};

/**
 * Gets approximate file size in MB
 */
export const getFileSizeMB = (file) => {
  return (file.size / (1024 * 1024)).toFixed(2);
};
