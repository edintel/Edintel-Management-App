import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { AlertCircle, ZoomIn } from 'lucide-react';
import ImageModal from './ImageModal';
import './ExpenseImage.css';

const ExpenseImage = ({ itemId, className = '' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { graphService } = useAppContext();

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();
    let objectUrl = null;

    const loadImage = async () => {
      if (!itemId) {
        setLoading(false);
        setError('No se encontró la imagen');
        return;
      }

      if (!graphService) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { url, token } = await graphService.getImageContent(itemId);
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error('Error al cargar la imagen');
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        
        if (mounted) {
          setImageUrl(objectUrl);
          setError(null);
        }
      } catch (err) {
        if (mounted && !abortController.signal.aborted) {
          setError('Error al cargar la imagen. Por favor, intente nuevamente.');
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
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [itemId, graphService]);

  if (loading) {
    return (
      <div className={`expense-image-loading ${className}`} role="status">
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>Cargando imagen...</p>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`expense-image-error ${className}`} role="alert">
        <AlertCircle size={48} />
        <p>{error || 'Imagen no disponible'}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`expense-image-container ${className}`}>
        <img
          src={imageUrl}
          alt="Comprobante de gasto"
          className="expense-image"
          onClick={() => setIsModalOpen(true)}
          onError={() => {
            setError('Error al mostrar la imagen');
            setImageUrl(null);
          }}
        />
        <button 
          className="zoom-indicator"
          onClick={() => setIsModalOpen(true)}
          aria-label="Ampliar imagen"
        >
          <ZoomIn size={20} />
        </button>
      </div>
      {isModalOpen && (
        <ImageModal
          imageUrl={imageUrl}
          alt="Comprobante de gasto"
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default ExpenseImage;