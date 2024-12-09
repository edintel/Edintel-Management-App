import React, { useState, useEffect } from "react";
import { cn } from "../../../../../../../utils/cn";
import { Loader2 } from "lucide-react";
import FilePreview from "./FilePreview";
import ImageModal from "../../../../../../../components/common/ImageModal";

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
  driveId,
}) => {
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({});
  const isAdmin = userRole?.role === "Administrativo";

  // Load preview URLs for all image documents
  useEffect(() => {
    const loadPreviews = async () => {
      const imageDocuments = documents.filter(
        (doc) => doc.documentType === "image"
      );
      const urls = {};

      for (const doc of imageDocuments) {
        try {
          const configSiteId =
            doc.source === "admin" ? service.admins.siteId : siteId;
          const configDriveId =
            doc.source === "admin" ? service.admins.driveId : driveId;

          const { url, token } = await service.getFile(
            configSiteId,
            configDriveId,
            doc.itemId
          );

          urls[doc.itemId] = { url, token };
        } catch (err) {
          console.error(`Error loading preview for ${doc.fileName}:`, err);
        }
      }

      setPreviewUrls(urls);
    };

    loadPreviews();
  }, [documents, service, siteId, driveId]);

  const handleImageClick = async (doc) => {
    try {
      setImageLoading(true);

      const configSiteId =
        doc.source === "admin" ? service.admins.siteId : siteId;
      const configDriveId =
        doc.source === "admin" ? service.admins.driveId : driveId;

      const { url, token } = await service.getFile(
        configSiteId,
        configDriveId,
        doc.itemId
      );

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      setSelectedImage({
        url: imageUrl,
        name: doc.fileName,
      });
    } catch (err) {
      console.error("Error loading image:", err);
      alert("Error loading image. Please try again.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (selectedImage?.url) {
      URL.revokeObjectURL(selectedImage.url);
    }
    setSelectedImage(null);
  };

  const renderImage = (doc) => {
    const previewUrl = previewUrls[doc.itemId];

    return (
      <div key={doc.itemId} className="group relative aspect-square">
        <div className="w-full h-full rounded-lg overflow-hidden border hover:border-primary transition-colors">
          <button
            onClick={() => handleImageClick(doc)}
            className="w-full h-full"
          >
            <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl.url}
                  alt={doc.fileName}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 text-xs bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate rounded-b-lg">
          {doc.fileName}
        </div>
      </div>
    );
  };

  // Group documents by type
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.documentType]) {
      acc[doc.documentType] = [];
    }
    acc[doc.documentType].push(doc);
    return acc;
  }, {});

  const documentGroups = [
    {
      type: "description",
      label: "Descripción",
      docs: groupedDocs["description"] || [],
    },
    {
      type: "serviceTicket",
      label: "Boletas de Servicio",
      docs: groupedDocs["serviceTicket"] || [],
    },
    {
      type: "report",
      label: "Informes",
      docs: groupedDocs["report"] || [],
    },
    {
      type: "image",
      label: "Imágenes",
      docs: groupedDocs["image"] || [],
    },
  ];

  if (isAdmin) {
    documentGroups.push({
      type: "administrative",
      label: "Documentos Administrativos",
      docs: groupedDocs["administrative"] || [],
    });
  }

  const renderDocumentGroup = (group) => {
    if (group.docs.length === 0) return null;

    return (
      <div key={group.type} className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">{group.label}</h3>
        {group.type === "image" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {group.docs.map((doc) => renderImage(doc))}
          </div>
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-error bg-error/10 rounded-lg">{error}</div>;
  }

  return (
    <>
      <div className={cn("space-y-8", className)}>
        {documentGroups.map(renderDocumentGroup)}
        {documents.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No hay documentos disponibles
          </div>
        )}
      </div>

      {(imageLoading || selectedImage) && (
        <ImageModal
          imageUrl={selectedImage?.url}
          alt={selectedImage?.name || ""}
          onClose={handleCloseModal}
          loading={imageLoading}
        />
      )}
    </>
  );
};

export default TicketFiles;
