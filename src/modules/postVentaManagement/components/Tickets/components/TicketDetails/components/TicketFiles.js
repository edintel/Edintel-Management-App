import React, { useState } from 'react';
import { cn } from '../../../../../../../utils/cn';
import FilePreview from './FilePreview';
import SharePointImage from '../../../../../../../components/common/SharePointImage';
import ImageModal from '../../../../../../../components/common/ImageModal';
import GridView from '../../../../../../../components/common/GridView';

const TicketFiles = ({
    documents = [],
    onDownload,
    onShare,
    userRole,
    loading = false,
    error = null,
    className,
    service,
    siteId,
    driveId
}) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const isAdmin = userRole?.role === 'Administrativo';

    // Group documents by type
    const groupedDocs = documents.reduce((acc, doc) => {
        if (!acc[doc.documentType]) {
            acc[doc.documentType] = [];
        }
        acc[doc.documentType].push(doc);
        return acc;
    }, {});

    // Define document type groups and their labels
    const documentGroups = [
        {
            type: 'description',
            label: 'Descripción',
            docs: groupedDocs['description'] || []
        },
        {
            type: 'serviceTicket',
            label: 'Boletas de Servicio',
            docs: groupedDocs['serviceTicket'] || []
        },
        {
            type: 'report',
            label: 'Informes',
            docs: groupedDocs['report'] || []
        },
        {
            type: 'image',
            label: 'Imágenes',
            docs: groupedDocs['image'] || []
        }
    ];

    // Add administrative documents only for admin users
    if (isAdmin) {
        documentGroups.push({
            type: 'administrative',
            label: 'Documentos Administrativos',
            docs: groupedDocs['administrative'] || []
        });
    }

    const renderImage = (doc) => (
        <div className="relative group">
            <SharePointImage
                itemId={doc.itemId}
                service={service}
                siteId={doc.source === 'admin' ? service.admins.siteId : siteId}
                driveId={doc.source === 'admin' ? service.admins.driveId : driveId}
                className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                alt={doc.fileName}
                onClick={() => setSelectedImage(doc)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg" />
        </div>
    );

    const renderDocumentGroup = (group) => {
        if (group.docs.length === 0) return null;

        return (
            <div key={group.type} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">{group.label}</h3>
                {group.type === 'image' ? (
                    <GridView
                        items={group.docs}
                        renderItem={renderImage}
                        cols={{ default: 2, sm: 3, md: 3, lg: 4 }}
                        gap={4}
                        emptyMessage="No hay imágenes disponibles"
                    />
                ) : (
                    <div className="space-y-2">
                        {group.docs.map((doc) => (
                            <FilePreview
                                key={doc.itemId}
                                file={doc}
                                onDownload={onDownload}
                                onShare={onShare}
                                showShare={isAdmin}
                                source={doc.source}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-error bg-error/10 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {documentGroups.map(renderDocumentGroup)}

            {documents.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                    No hay documentos disponibles
                </div>
            )}

            {selectedImage && (
                <ImageModal
                    service={service}
                    siteId={selectedImage.source === 'admin' ? service.admins.siteId : siteId}
                    driveId={selectedImage.source === 'admin' ? service.admins.driveId : driveId}
                    itemId={selectedImage.itemId}
                    alt={selectedImage.fileName}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
};

export default TicketFiles;