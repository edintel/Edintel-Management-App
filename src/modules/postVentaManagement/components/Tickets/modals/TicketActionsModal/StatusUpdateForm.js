import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "../../../../../../components/common/Button";
import MultiFileUpload from "../../../../../../components/common/MultiFileUpload";
import TicketStatusBadge from "../../components/common/TicketStatusBadge";
import { useFileManagement } from "../../hooks/useFileManagement";

const StatusUpdateForm = ({ ticket, onSubmit, processing }) => {
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  // File management hooks
  const serviceTickets = useFileManagement({
    generateNames: true,
    namePrefix: 'service-ticket-'
  });

  const reportFile = useFileManagement({
    generateNames: true,
    namePrefix: 'report-'
  });

  const getNextStatus = () => {
    switch (ticket?.state) {
      case "Iniciada":
      case "Técnico asignado":
        return "Confirmado por técnico";
      case "Confirmado por técnico":
        return "Trabajo iniciado";
      case "Trabajo iniciado":
        return "Finalizada";
      case "Finalizada":
        return "Cerrada";
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();

  const validateFinishForm = () => {
    const newErrors = {};

    if (serviceTickets.files.length === 0) {
      newErrors.serviceTickets = "Al menos una boleta de servicio es requerida";
      serviceTickets.setError(newErrors.serviceTickets);
    }

    if (ticket?.type === "Preventiva" && !reportFile.files.length) {
      newErrors.report = "El informe es requerido para tickets preventivos";
      reportFile.setError(newErrors.report);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStatusUpdate = () => {
    if (nextStatus === "Finalizada") {
      setShowFinishModal(true);
      // Clear any previous errors when showing the modal
      setErrors({});
      serviceTickets.setError(null);
      reportFile.setError(null);
    } else {
      onSubmit(ticket.id, nextStatus);
    }
  };

  const handleFinish = async () => {
    if (!validateFinishForm()) return;

    const files = {
      serviceTickets: serviceTickets.files,
      report: reportFile.files[0] || null
    };

    onSubmit(ticket.id, nextStatus, files, notes);
  };

  const allowedTypes = ['.pdf', '.doc', '.docx', '.xlsx', '.xlsm', '.xlsb'];

  if (showFinishModal) {
    return (
      <div className="space-y-6">
        {/* Service Tickets Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Boletas de Servicio *
          </label>
          <MultiFileUpload
            files={serviceTickets.files}
            onFilesChange={serviceTickets.addFiles}
            onRemove={serviceTickets.removeFile}
            onDisplayNameChange={serviceTickets.updateDisplayName}
            maxFiles={5}
            maxSize={20 * 1024 * 1024}
            allowedTypes={allowedTypes}
            error={errors.serviceTickets || serviceTickets.error}
            disabled={processing}
            showDisplayName={true}
          />
          {errors.serviceTickets && (
            <p className="text-sm text-red-600 mt-1">{errors.serviceTickets}</p>
          )}
        </div>

        {/* Report Upload (only for preventive tickets) */}
        {ticket?.type === "Preventiva" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Informe *
            </label>
            <MultiFileUpload
              files={reportFile.files}
              onFilesChange={(files) => {
                reportFile.clearFiles();
                reportFile.addFiles(files);
              }}
              onRemove={() => reportFile.clearFiles()}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              allowedTypes={allowedTypes}
              error={errors.report || reportFile.error}
              disabled={processing}
            />
            {errors.report && (
              <p className="text-sm text-red-600 mt-1">{errors.report}</p>
            )}
          </div>
        )}

        {/* Notes Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agregue notas o comentarios sobre el trabajo realizado..."
            className="w-full min-h-[100px] px-3 py-2 resize-none border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            disabled={processing}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setShowFinishModal(false);
              setErrors({});
              serviceTickets.setError(null);
              reportFile.setError(null);
            }}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleFinish}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Finalizando...
              </>
            ) : (
              "Finalizar Ticket"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Estado Actual
        </h3>
        <TicketStatusBadge status={ticket?.state} />
      </div>

      {/* Next Status */}
      {nextStatus && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Nuevo Estado</h3>
          <Button
            variant="primary"
            fullWidth
            onClick={handleStatusUpdate}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Actualizando...
              </>
            ) : (
              <>Cambiar a: {nextStatus}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StatusUpdateForm;