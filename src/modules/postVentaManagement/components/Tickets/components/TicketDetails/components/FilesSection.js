import React, { useState, useEffect } from 'react';
import Card from '../../../../../../../components/common/Card';
import TicketFiles from './TicketFiles';
import { usePostVentaManagement } from '../../../../../context/postVentaManagementContext';

const FilesSection = ({ ticket, onDownload, onShare, className = "" }) => {
  const { service, userRole } = usePostVentaManagement();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDocuments = async () => {
      if (!ticket?.id) return;

      setLoading(true);
      setError(null);

      try {
        const docs = await service.getTicketDocuments(ticket.id);
        setDocuments(docs);
      } catch (err) {
        console.error('Error loading documents:', err);
        setError('Error al cargar los documentos');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [ticket?.id, service]);

  return (
    <Card title="Documentos" className={className}>
      <TicketFiles
        documents={documents}
        onDownload={onDownload}
        onShare={onShare}
        userRole={userRole}
        loading={loading}
        error={error}
        service={service}
        siteId={service.siteId}
        driveId={service.driveId}
      />
    </Card>
  );
};

export default FilesSection;