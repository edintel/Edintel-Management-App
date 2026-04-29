import React, { useState, useEffect } from 'react';
import { useVacaciones } from '../../context/vacacionesContext';
import { useMsal } from '@azure/msal-react';
import { X, Loader2, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import {
  validarRangoVacaciones,
  calcularDiasHabiles,
  obtenerFechaMinima,
} from '../../services/VacacionesCalculationService';

const RequestForm = ({ onClose, initialDepartamento = '', initialNombreSolicitante = '' }) => {
  const { createRequest, userDepartmentRole } = useVacaciones();
  const { accounts } = useMsal();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [diasHabiles, setDiasHabiles] = useState(0);

  const [formData, setFormData] = useState({
    departamento: initialDepartamento,
    nombreSolicitante: initialNombreSolicitante,
    numeroCedula: '',
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
  });

  const fechaMinima = obtenerFechaMinima();

  useEffect(() => {
    if (initialDepartamento) setFormData(prev => ({ ...prev, departamento: initialDepartamento }));
  }, [initialDepartamento]);

  useEffect(() => {
    if (initialNombreSolicitante) setFormData(prev => ({ ...prev, nombreSolicitante: initialNombreSolicitante }));
  }, [initialNombreSolicitante]);

  useEffect(() => {
    if (formData.fechaInicio && formData.fechaFin) {
      const inicio = new Date(formData.fechaInicio + 'T00:00:00');
      const fin = new Date(formData.fechaFin + 'T00:00:00');
      if (fin >= inicio) {
        setDiasHabiles(calcularDiasHabiles(formData.fechaInicio, formData.fechaFin));
      } else {
        setDiasHabiles(0);
      }
    } else {
      setDiasHabiles(0);
    }
  }, [formData.fechaInicio, formData.fechaFin]);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.departamento) {
      setErrorMessage('Departamento no cargado. Intenta de nuevo.');
      setSubmitStatus('error');
      return;
    }

    if (!formData.fechaInicio || !formData.fechaFin) {
      setErrorMessage('Debe seleccionar fecha de inicio y fin de las vacaciones.');
      setSubmitStatus('error');
      return;
    }

    const validacion = validarRangoVacaciones(formData.fechaInicio, formData.fechaFin);
    if (!validacion.valid) {
      setErrorMessage(validacion.message);
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    try {
      const requestData = {
        fechaPeticion: new Date().toISOString(),
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        diasHabiles: validacion.diasHabiles,
        departamento: formData.departamento,
        nombreSolicitante: formData.nombreSolicitante,
        numeroCedula: formData.numeroCedula,
        motivo: formData.motivo,
        requesterRole: userDepartmentRole?.chainRole || 'Colaborador',
      };

      await createRequest(requestData);
      setSubmitStatus('success');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Error al crear la solicitud. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Nueva Solicitud de Vacaciones
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Messages */}
        {submitStatus && (
          <div className={`mx-4 sm:mx-6 mt-4 p-4 rounded-lg flex items-start gap-3 ${
            submitStatus === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {submitStatus === 'success' ? (
              <>
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-green-900">¡Solicitud creada exitosamente!</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-red-900">Error al crear la solicitud</p>
                  <p className="text-xs text-red-700">{errorMessage}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4">
            {/* Información del Solicitante */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                <input
                  type="text"
                  value={formData.departamento}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Solicitante
                </label>
                <input
                  type="text"
                  value={formData.nombreSolicitante}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Cédula <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.numeroCedula}
                onChange={e => setFormData(prev => ({ ...prev, numeroCedula: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                placeholder="Ej: 1-2345-6789"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Fechas de Vacaciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800">Período de Vacaciones</h3>
              </div>

              <p className="text-xs text-gray-600 mb-4">
                Las vacaciones deben solicitarse con al menos 2 días de antelación. No se permiten fines de semana ni feriados.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={e => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    min={fechaMinima}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={e => setFormData(prev => ({ ...prev, fechaFin: e.target.value }))}
                    min={formData.fechaInicio || fechaMinima}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {diasHabiles > 0 && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-300 text-center">
                  <p className="text-sm text-gray-600">Días hábiles de vacaciones</p>
                  <p className="text-2xl font-bold text-blue-600">{diasHabiles}</p>
                  <p className="text-xs text-gray-500">(excluyendo fines de semana y feriados)</p>
                </div>
              )}
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo / Observaciones
              </label>
              <textarea
                value={formData.motivo}
                onChange={e => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                placeholder="Opcional: descripción o comentarios adicionales"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitStatus === 'success'}
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                'Solicitar Vacaciones'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;
