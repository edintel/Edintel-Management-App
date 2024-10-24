import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import './ImageModal.css';

const ImageModal = ({ imageUrl, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageViewRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      const newScale = Math.min(Math.max(0.5, scale + delta), 3);
      setScale(newScale);
    };

    const currentImageView = imageViewRef.current;

    document.addEventListener('keydown', handleKeyDown);
    if (currentImageView) {
      currentImageView.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (currentImageView) {
        currentImageView.removeEventListener('wheel', handleWheel);
      }
    };
  }, [onClose, scale]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => {
    setScale(Math.min(scale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={e => e.stopPropagation()}>
        <div className="image-modal-toolbar">
          <div className="zoom-controls">
            <button onClick={zoomOut} className="zoom-button">
              <ZoomOut size={20} />
            </button>
            <span className="zoom-level">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="zoom-button">
              <ZoomIn size={20} />
            </button>
          </div>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        <div 
          className="image-modal-view"
          ref={imageViewRef}
        >
          <div
            className="image-modal-draggable"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              src={imageUrl} 
              alt={alt}
              className="modal-image"
              draggable="false"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;