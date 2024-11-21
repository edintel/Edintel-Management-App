import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "../../../../../../components/common/Button";
import TicketStatusBadge from "../../components/common/TicketStatusBadge";

const StatusUpdateForm = ({ ticket, onSubmit, processing }) => {
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [formData, setFormData] = useState({
    serviceTicket: null,
    report: null,
  });
  const [errors, setErrors] = useState({});

  const getNextStatus = () => {
    switch (ticket?.state) {
      case "Iniciada":
        return "Técnico asignado";
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

    if (!formData.serviceTicket) {
      newErrors.serviceTicket = "La boleta de servicio es requerida";
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
      console.log(showFinishModal);
    } else {
      onSubmit(ticket.id, nextStatus);
    }
  };

  const handleFinish = () => {
    if (!validateFinishForm()) return;
    onSubmit(ticket.id, nextStatus, formData);
  };

  const handleFileChange = (field, file) => {
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
    // Clear error when file is uploaded
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  if (showFinishModal) {
    return (
      <div className="space-y-6">
        {/* Service Ticket Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Boleta de Servicio *
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xlsx,.xlsm,.xlsb"
            onChange={(e) =>
              handleFileChange("serviceTicket", e.target.files[0])
            }
            className="w-full"
          />
          {errors.serviceTicket && (
            <p className="text-sm text-error">{errors.serviceTicket}</p>
          )}
        </div>

        {/* Report Upload (only for preventive tickets) */}
        {ticket?.type === "Preventiva" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Informe *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xlsm,.xlsb"
              onChange={(e) => handleFileChange("report", e.target.files[0])}
              className="w-full"
            />
            {errors.report && (
              <p className="text-sm text-error">{errors.report}</p>
            )}
          </div>
        )}

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
