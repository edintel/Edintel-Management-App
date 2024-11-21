import React from 'react';
import Card from '../../../../../../../components/common/Card';
import TicketFiles from '../../common/TicketFiles';

const FilesSection = ({ ticket, onDownload, onShare, loading = false, userRole }) => {
  if (!ticket) return null;
  const canShare = userRole?.role === 'Administrativo' || userRole?.role === 'Supervisor';

  const files = {
    description: ticket.descriptionId,
    serviceTicket: ticket.serviceTicketId,
    report: ticket.reportId
  };

  return (
    <Card title="Documentos">
      <TicketFiles
        ticketNumber={ticket.stNumber}
        files={files}
        onDownload={onDownload}
        onShare={onShare}
        loading={loading}
        layout="vertical"
        canShare={canShare}
      />
    </Card>
  );
};

export default FilesSection;