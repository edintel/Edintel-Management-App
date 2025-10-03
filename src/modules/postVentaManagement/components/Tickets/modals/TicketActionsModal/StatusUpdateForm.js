import React, { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import Button from "../../../../../../components/common/Button";
import MultiFileUpload from "../../../../../../components/common/MultiFileUpload";
import TicketStatusBadge from "../../components/common/TicketStatusBadge";
import { useFileManagement } from "../../hooks/useFileManagement";

const StatusUpdateForm = ({ ticket, onSubmit, processing }) => {
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [targetStatus, setTargetStatus] = useState(null);

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
        return "Finalizada"; // Default next status
      case "Trabajo Parcial":
        return "Finalizada"; // From incomplete can go to finalized
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
    if (ticket?.state === "Trabajo iniciado") {
      // Show finish modal for work started status
      setShowFinishModal(true);
      setTargetStatus("Finalizada");
    } else if (ticket?.state === "Trabajo Parcial") {
      // Also show finish modal for incomplete work status
      setShowFinishModal(true);
      setTargetStatus("Finalizada");
    } else {
      // For other statuses, proceed normally
      onSubmit(ticket?.id, nextStatus);
    }
  };

  const handleIncompleteWork = () => {
    setShowIncompleteModal(true);
    setTargetStatus("Trabajo Parcial");
  };

  const handleFinish = () => {
    if (!validateFinishForm()) return;

    const filesData = {
      serviceTickets: serviceTickets.files,
      report: reportFile.files[0] || null,
      notes: notes
    };

    onSubmit(ticket?.id, targetStatus, filesData, notes);
  };

  const handleIncompleteSubmit = () => {
    if (!validateFinishForm()) return;

    const filesData = {
      serviceTickets: serviceTickets.files,
      report: reportFile.files[0] || null,
      notes: notes
    };

    onSubmit(ticket?.id, "Trabajo Parcial", filesData, notes);
  };

  const allowedTypes = ['.pdf', '.doc', '.docx', '.xlsx', '.xlsm', '.xlsb'];

  // Show finish/incomplete modal for "Trabajo iniciado" or "Trabajo Parcial" states
  if (showFinishModal || showIncompleteModal) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-warning/10 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning">
              {showIncompleteModal
                ? "Para marcar el trabajo como Parcial, debe adjuntar las boletas de servicio y agregar una nota explicativa."
                : "Para finalizar el ticket, debe adjuntar las boletas de servicio correspondientes."}
              {ticket?.type === "Preventiva" && " Además, se requiere el informe preventivo."}
            </div>
          </div>
        </div>

        {/* Service Tickets Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Boletas de Servicio *
          </label>
          <MultiFileUpload
            files={serviceTickets.files}
            onFilesChange={serviceTickets.addFiles}
            onRemove={serviceTickets.removeFile}
            maxSize={10 * 1024 * 1024}
            allowedTypes={allowedTypes}
            error={errors.serviceTickets || serviceTickets.error}
            disabled={processing}
          />
          {errors.serviceTickets && (
            <p className="text-sm text-red-600 mt-1">{errors.serviceTickets}</p>
          )}
        </div>

        {/* Report Upload for Preventive tickets */}
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
            Notas {showIncompleteModal && "*"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={showIncompleteModal
              ? "Explique por qué el trabajo quedó Parcial..."
              : "Agregue notas o comentarios sobre el trabajo realizado..."}
            className="w-full min-h-[100px] px-3 py-2 resize-none border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            disabled={processing}
            required={showIncompleteModal}
          />
          {showIncompleteModal && !notes && errors.notes && (
            <p className="text-sm text-red-600 mt-1">La nota es requerida para trabajo Parcial</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setShowFinishModal(false);
              setShowIncompleteModal(false);
              setErrors({});
              serviceTickets.setError(null);
              reportFile.setError(null);
              setTargetStatus(null);
            }}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            variant={showIncompleteModal ? "warning" : "primary"}
            onClick={showIncompleteModal ? handleIncompleteSubmit : handleFinish}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                {showIncompleteModal ? "Marcando como Parcial..." : "Finalizando..."}
              </>
            ) : (
              showIncompleteModal ? "Marcar como Parcial" : "Finalizar Ticket"
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

      {/* Action Buttons based on current state */}
      {ticket?.state === "Trabajo iniciado" ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Seleccione una acción:</h3>
          <div className="space-y-2">
            <Button
              variant="warning"
              fullWidth
              onClick={handleIncompleteWork}
              disabled={processing}
              startIcon={<AlertTriangle className="h-4 w-4" />}
            >
              Marcar como Trabajo Parcial
            </Button>
            <Button
              variant="success"
              fullWidth
              onClick={handleStatusUpdate}
              disabled={processing}
            >
              Finalizar Trabajo
            </Button>
          </div>
        </div>
      ) : ticket?.state === "Trabajo Parcial" ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Nuevo Estado</h3>
          <Button
            variant="success"
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
              <>Finalizar Trabajo</>
            )}
          </Button>
        </div>
      ) : (
        nextStatus && (
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
        )
      )}
    </div>
  );
};

export default StatusUpdateForm;