import React, { useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../../../../../../components/common/Button';
import { TICKET_ACTIONS, isActionAllowed } from '../../../permissions/ticketActionPermissions';
import { usePostVentaManagement } from '../../../../../context/postVentaManagementContext';

const UploadParcialButton = ({ ticket, userRole, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [showFileInput, setShowFileInput] = useState(false);
  const { service } = usePostVentaManagement();

  // Verificar permisos y estado
  const canUpload =
    ticket?.state === "Trabajo Parcial" &&
    isActionAllowed(TICKET_ACTIONS.UPDATE_PARCIAL, ticket, userRole);

  // Si no tiene permisos o no está en estado parcial, no mostrar nada
  if (!canUpload) {
    return null;
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['.pdf', '.doc', '.docx', '.xlsx', '.xlsm', '.xlsb'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        setError('Tipo de archivo no permitido. Use: PDF, JPG, PNG, DOC o DOCX');
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no debe superar los 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Por favor selecciona un archivo");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const fileName = `boleta_parcial_${ticket.stNumber}_${timestamp}`;

      // Subir el archivo
      const uploadResponse = await service.uploadTicketDocument(
        ticket.id,
        selectedFile,
        'serviceTicket', // tipo de documento
        fileName
      );

      // Crear link de compartir
      const shareLink = await service.createShareLink(
        service.siteId,
        uploadResponse.itemId,
        "view",
        "organization"
      );

      // ⚠️ CAMBIO IMPORTANTE: Usar el campo que YA EXISTE
      // Asumiendo que usas 'documents' o 'finalDocuments'
      const existingDocs = ticket.documents || []; // o ticket.finalDocuments

      await service.updateTicket(ticket.id, {
        documents: [ // o finalDocuments
          ...existingDocs,
          {
            itemId: uploadResponse.itemId,
            fileName: selectedFile.name,
            uploadDate: new Date().toISOString(),
            shareLink: shareLink.webUrl,
            type: 'serviceTicket' // Agregar tipo para diferenciar
          }
        ]
      });

      if (onUploadSuccess) {
        onUploadSuccess({
          file: selectedFile,
          uploadResponse,
          shareLink
        });
      }

      setSelectedFile(null);
      setShowFileInput(false);

      const fileInput = document.getElementById('parcial-file-input');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (err) {
      setError(err.message || 'Error al subir el archivo');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setShowFileInput(false);
    setError(null);
    const fileInput = document.getElementById('parcial-file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Vista inicial - botón para mostrar el selector de archivo
  if (!showFileInput) {
    return (
      <Button
        variant="secondary"
        fullWidth
        onClick={() => setShowFileInput(true)}
        startIcon={<Upload className="h-4 w-4" />}
      >
        Subir Boleta Parcial
      </Button>
    );
  }

  // Vista de carga de archivo
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Subir Boleta Parcial
        </h4>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600"
          disabled={isUploading}
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <input
          id="parcial-file-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        {!selectedFile ? (
          <label
            htmlFor="parcial-file-input"
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-100 transition-colors"
          >
            <FileText className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              Click para seleccionar archivo
            </span>
          </label>
        ) : (
          <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={() => {
                  setSelectedFile(null);
                  document.getElementById('parcial-file-input').value = '';
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isUploading}
            fullWidth
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            fullWidth
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              'Subir Archivo'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadParcialButton;