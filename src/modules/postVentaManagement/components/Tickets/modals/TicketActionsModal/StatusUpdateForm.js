import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "../../../../../../components/common/Button";
import MultiFileUpload from "../../../../../../components/common/MultiFileUpload";
import TicketStatusBadge from "../../components/common/TicketStatusBadge";

const StatusUpdateForm = ({ ticket, onSubmit, processing }) => {
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [formData, setFormData] = useState({
    serviceTickets: [],
    report: null,
    notes: ""
  });
  const [errors, setErrors] = useState({});

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

    if (formData.serviceTickets.length === 0) {
      newErrors.serviceTickets = "Al menos una boleta de servicio es requerida";
    }

    if (ticket?.type === "Preventiva" && !formData.report) {
      newErrors.report = "El informe es requerido para tickets preventivos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStatusUpdate = () => {
    if (nextStatus === "Finalizada") {
      setShowFinishModal(true);
    } else {
      onSubmit(ticket.id, nextStatus);
    }
  };

  const handleFinish = () => {
    if (!validateFinishForm()) return;
    onSubmit(ticket.id, nextStatus, {
      serviceTickets: formData.serviceTickets.map(f => f.file),
      report: formData.report?.file || null
    }, formData.notes);
  };

  const handleServiceTicketsChange = (files) => {
    setFormData(prev => ({
      ...prev,
      serviceTickets: files
    }));
    if (errors.serviceTickets) {
      setErrors(prev => ({
        ...prev,
        serviceTickets: undefined
      }));
    }
  };

  const handleReportChange = (files) => {
    setFormData(prev => ({
      ...prev,
      report: files[0] || null
    }));
    if (errors.report) {
      setErrors(prev => ({
        ...prev,
        report: undefined
      }));
    }
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
            files={formData.serviceTickets}
            onFilesChange={handleServiceTicketsChange}
            onRemove={(index) => {
              const newFiles = [...formData.serviceTickets];
              newFiles.splice(index, 1);
              handleServiceTicketsChange(newFiles);
            }}
            maxFiles={5}
            maxSize={10 * 1024 * 1024}
            allowedTypes={allowedTypes}
            error={errors.serviceTickets}
            disabled={processing}
          />
        </div>

        {/* Report Upload (only for preventive tickets) */}
        {ticket?.type === "Preventiva" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Informe *
            </label>
            <MultiFileUpload
              files={formData.report ? [formData.report] : []}
              onFilesChange={handleReportChange}
              onRemove={() => handleReportChange([])}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              allowedTypes={allowedTypes}
              error={errors.report}
              disabled={processing}
            />
          </div>
        )}

        {/* Notes Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Agregue notas o comentarios sobre el trabajo realizado..."
            className="w-full min-h-[100px] px-3 py-2 resize-none border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            disabled={processing}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowFinishModal(false)}
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