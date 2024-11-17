import React from 'react';
import Card from '../../../../../../../components/common/Card';
import TicketFiles from '../../common/TicketFiles';

const FilesSection = ({ ticket, onDownload, loading = false }) => {
  if (!ticket) return null;

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
        loading={loading}
        layout="vertical"
      />
    </Card>
  );
};

export default FilesSection;