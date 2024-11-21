import React from 'react';
import { FileText, FileDown, Download, Loader2, AlertCircle, Link } from 'lucide-react';
import { cn } from '../../../../../../utils/cn';

const FileTypes = {
  DESCRIPTION: 'description',
  SERVICE_TICKET: 'serviceTicket',
  REPORT: 'report'
};

const FileConfig = {
  [FileTypes.DESCRIPTION]: {
    icon: FileText,
    label: 'Descripción',
    fileNameSuffix: 'descripcion'
  },
  [FileTypes.SERVICE_TICKET]: {
    icon: Download,
    label: 'Boleta de Servicio',
    fileNameSuffix: 'boleta'
  },
  [FileTypes.REPORT]: {
    icon: FileDown,
    label: 'Informe',
    fileNameSuffix: 'informe'
  }
};

const TicketFiles = ({
  ticketNumber,
  files = {},
  onDownload,
  onShare,
  layout = 'horizontal',
  size = 'default',
  className,
  loading = false,
  error = null,
  canShare = false
}) => {
  const sizes = {
    small: 'text-sm gap-2',
    default: 'text-base gap-3',
    large: 'text-lg gap-4'
  };

  const layouts = {
    horizontal: 'flex flex-row flex-wrap',
    vertical: 'flex flex-col',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-error p-4">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  const handleDownload = (fileId, type) => {
    if (!fileId) return;
    const config = FileConfig[type];
    onDownload(fileId, `ST_${ticketNumber}_${config.fileNameSuffix}`);
  };

  const handleShare = (fileId, type) => {
    if (!fileId) return;
    onShare(fileId);
  };

  return (
    <div className={cn(layouts[layout], sizes[size], className)}>
      {Object.entries(FileConfig).map(([type, config]) => {
        const fileId = files[type];
        const Icon = config.icon;

        return (
          <div key={type} className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(fileId, type)}
              disabled={!fileId}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                fileId 
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{config.label}</span>
            </button>
            
            {canShare && fileId && (
              <button
                onClick={() => handleShare(fileId, type)}
                className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                title="Obtener enlace"
              >
                <Link className="h-5 w-5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TicketFiles;