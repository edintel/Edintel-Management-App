import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';

const FilePreview = ({
    file,
    onDownload,
    onShare,
    showShare = false,
    disabled = false,
    source = 'general'
}) => {
    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName}
                </p>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onDownload && (
                    <button
                        onClick={() => onDownload(file)}
                        className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded-lg transition-colors"
                        disabled={disabled}
                        title="Descargar archivo"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                )}

                {showShare && onShare && (
                    <button
                        onClick={() => onShare(file)}
                        className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded-lg transition-colors"
                        disabled={disabled}
                        title="Compartir archivo"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default FilePreview;