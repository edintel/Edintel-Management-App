import React, { useState } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  type = "approve",
  title,
  message,
}) => {
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(type === "reject" ? notes : "");
    setNotes("");
    onClose();
  };

  const handleClose = () => {
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center text-center">
            {type === "approve" ? (
              <CheckCircle size={48} className="text-success mb-4" />
            ) : (
              <AlertTriangle size={48} className="text-error mb-4" />
            )}

            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 mb-6">{message}</p>

            {type === "reject" && (
              <div className="w-full mb-6">
                <label className="block text-sm font-medium text-gray-700 text-left mb-2">
                  Notas de revisión *
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[80px] px-3 py-2 resize-none border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  placeholder="Ingrese el motivo del rechazo"
                  required
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={type === "reject" && !notes.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  type === "approve"
                    ? "bg-success hover:bg-success/90"
                    : "bg-error hover:bg-error/90"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {type === "approve" ? "Aprobar" : "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
