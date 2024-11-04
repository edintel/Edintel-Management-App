import React, { useState, useEffect } from 'react';
import { useExpenseAudit } from '../../context/expenseAuditContext';
import { AlertCircle, ZoomIn } from 'lucide-react';
import ImageModal from '../../../../components/common/ImageModal';
import { expenseAuditConfig } from '../../config/expenseAudit.config';

const ExpenseImage = ({ itemId, className = '' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { service } = useExpenseAudit();

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

      if (!service) return;

      try {
        setLoading(true);
        setError(null);

        const { url, token } = await service.getImageContent(
          expenseAuditConfig.siteId,
          expenseAuditConfig.driveId,
          itemId
        );

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortController.signal
        });

        if (!response.ok) throw new Error('Error al cargar la imagen');

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        
        if (mounted) {
          setImageUrl(objectUrl);
          setError(null);
        }
      } catch (err) {
        if (mounted && !abortController.signal.aborted) {
          setError('Error al cargar la imagen. Por favor, intente nuevamente.');
          console.error('Error loading image:', err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadImage();

    return () => {
      mounted = false;
      abortController.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [itemId, service]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[200px] bg-gray-50 rounded-lg ${className}`} role="status">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p>Cargando imagen...</p>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[200px] bg-gray-50 rounded-lg ${className}`} role="alert">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <p className="text-gray-600">{error || 'Imagen no disponible'}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`relative group cursor-pointer ${className}`}>
        <img
          src={imageUrl}
          alt="Comprobante de gasto"
          className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
          onClick={() => setIsModalOpen(true)}
          onError={() => {
            setError('Error al mostrar la imagen');
            setImageUrl(null);
          }}
        />
        <button 
          className="absolute bottom-4 right-4 bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 hover:scale-110"
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