import React from 'react';
import { FileText, Download, X, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatFileSize } from '../../utils/fileUtils';

const FilePreview = ({
  files = [],
  onRemove,
  onDownload,
  onShare,
  showSize = true,
  showShare = false,
  className,
  disabled = false
}) => {
  if (!files.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {files.map((file, index) => (
        <div 
          key={typeof file === 'string' ? file : file.name + index}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
        >
          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.displayName || file.name}
            </p>
            {showSize && file.size && (
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDownload && (
              <button
                onClick={() => onDownload(file, index)}
                className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded-lg transition-colors"
                disabled={disabled}
                title="Descargar archivo"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {showShare && onShare && (
              <button
                onClick={() => onShare(file, index)}
                className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded-lg transition-colors"
                disabled={disabled}
                title="Compartir archivo"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}

            {onRemove && (
              <button
                onClick={() => onRemove(file, index)}
                className="p-1.5 text-gray-500 hover:text-error hover:bg-white rounded-lg transition-colors"
                disabled={disabled}
                title="Eliminar archivo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilePreview;