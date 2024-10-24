// src/components/common/ExpenseImage.js
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Image } from 'lucide-react';
import './ExpenseImage.css';

const ExpenseImage = ({ itemId, fileName, className = '' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { graphService } = useAppContext();

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();
    
    const loadImage = async () => {
      if (!fileName || !itemId) {
        setLoading(false);
        setError('No image available');
        return;
      }

      if (!graphService) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { url, token } = await graphService.getImageUrl(itemId, fileName);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        if (mounted) {
          setImageUrl(objectUrl);
          setError(null);
        }
      } catch (err) {
        if (mounted && !abortController.signal.aborted) {
          console.error('Error loading image:', err);
          setError('Error loading image. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
      abortController.abort();
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [itemId, fileName, graphService]);

  if (loading) {
    return (
      <div className={`expense-image-loading ${className}`}>
        <div className="loading-spinner"></div>
        <p>Cargando imagen...</p>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`expense-image-error ${className}`}>
        <Image size={48} />
        <p>{error || 'Imagen no disponible'}</p>
      </div>
    );
  }

  return (
    <div className={`expense-image-container ${className}`}>
      <img 
        src={imageUrl} 
        alt="Comprobante de gasto" 
        className="expense-image"
        onError={() => {
          setError('Error al cargar la imagen');
          setImageUrl(null);
        }}
      />
    </div>
  );
};

export default ExpenseImage;