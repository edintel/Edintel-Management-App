// src/modules/extraHours/components/Request/RequestEdit.js
import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertTriangle, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useExtraHours } from '../../context/extraHoursContext';
import {
  calcularTotalesHorasExtras,
  validarHorarioTrabajo,
  validarFechaNoFutura,
  verificarPeriodoBloqueo,
  obtenerFechaMaxima
} from '../Service/InsideServices/ExtraHoursCalculationService';

const ExtraHoursEdit = ({ onClose, requestId }) => {
  const { service, extraHoursRequests, loadExtraHoursData } = useExtraHours();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [blockPeriodStatus, setBlockPeriodStatus] = useState({ isBlocked: false, message: '' });

  const [formData, setFormData] = useState({
    departamento: '',
    numeroCedula: '',
    nombreSolicitante: '',
    disponibilidadCelular: false,
    diasDisponibilidad: 0,
    extrasInfo: [
      {
        dia: '',
        horaInicio: '',
        horaFin: '',
        st: '',
        nombreCliente: ''
      }
    ]
  });

  const [totals, setTotals] = useState({
    tiempoMedio: 0,
    tiempoDoble: 0,
    tiempoDobleDoble: 0
  });

  // Cargar datos del registro y verificar período de bloqueo
  useEffect(() => {
    // Verificar período de bloqueo
    const blockStatus = verificarPeriodoBloqueo();
    setBlockPeriodStatus(blockStatus);
    const loadExtraHoursRecord = () => {
      try {
        setLoadingData(true);

        const record = extraHoursRequests.find(req => req.id === requestId);

        if (!record) {
          setErrorMessage('No se encontró el registro de horas extras');
          setSubmitStatus('error');
          setLoadingData(false);
          return;
        }

        // Buscar si hay una entrada de disponibilidad en extrasInfo
        const disponibilidadEntry = record.extrasInfo?.find(
          extra => extra.st === 'DISPONIBILIDAD_CELULAR'
        );

        // Si hay entrada de disponibilidad, extraer los días del horaFin
        let diasDisponibilidad = record.diasDisponibilidad || 0;
        let disponibilidadCelular = record.disponibilidadCelular || false;

        if (disponibilidadEntry && disponibilidadEntry.horaFin) {
          // Extraer las horas del formato "HH:00" (ej: "02:00" = 2 días)
          const [horas] = disponibilidadEntry.horaFin.split(':').map(Number);
          diasDisponibilidad = horas;
          disponibilidadCelular = true;
        }

        setFormData({
          departamento: record.departamento || '',
          numeroCedula: record.numeroCedula?.toString() || '',
          nombreSolicitante: record.nombreSolicitante?.displayName || '',
          disponibilidadCelular,
          diasDisponibilidad,
          extrasInfo: record.extrasInfo && record.extrasInfo.length > 0
            ? record.extrasInfo
            : [{
              dia: '',
              horaInicio: '',
              horaFin: '',
              st: '',
              nombreCliente: ''
            }]
        });

        setLoadingData(false);
      } catch (err) {
        setErrorMessage('Error al cargar el registro de horas extras');
        setSubmitStatus('error');
        setLoadingData(false);
      }
    };

    if (requestId && extraHoursRequests.length > 0) {
      loadExtraHoursRecord();
    }
  }, [requestId, extraHoursRequests]);

  // Calcular totales cuando cambie extrasInfo, disponibilidadCelular o diasDisponibilidad
  useEffect(() => {
    const totales = calcularTotalesHorasExtras(formData.extrasInfo, formData.departamento);
    setTotals(totales);
  }, [formData.extrasInfo, formData.departamento, formData.disponibilidadCelular, formData.diasDisponibilidad]);

  // Gestionar entrada automática de disponibilidad de celular
  useEffect(() => {
    if (formData.disponibilidadCelular && formData.diasDisponibilidad > 0) {
      // Agregar o actualizar la entrada de disponibilidad
      const disponibilidadIndex = formData.extrasInfo.findIndex(
        extra => extra.st === 'DISPONIBILIDAD_CELULAR'
      );

      const disponibilidadEntry = {
        dia: '—',
        horaInicio: '00:00',
        horaFin: `${String(formData.diasDisponibilidad).padStart(2, '0')}:00`,
        st: 'DISPONIBILIDAD_CELULAR',
        nombreCliente: 'Disponibilidad de Celular'
      };

      if (disponibilidadIndex === -1) {
        // Agregar nueva entrada al final
        setFormData(prev => ({
          ...prev,
          extrasInfo: [...prev.extrasInfo, disponibilidadEntry]
        }));
      } else {
        // Actualizar entrada existente
        setFormData(prev => ({
          ...prev,
          extrasInfo: prev.extrasInfo.map((extra, i) =>
            i === disponibilidadIndex ? disponibilidadEntry : extra
          )
        }));
      }
    } else {
      // Remover la entrada de disponibilidad si existe
      setFormData(prev => ({
        ...prev,
        extrasInfo: prev.extrasInfo.filter(extra => extra.st !== 'DISPONIBILIDAD_CELULAR')
      }));
    }
  }, [formData.disponibilidadCelular, formData.diasDisponibilidad]);

  const handleAddRow = () => {
    setFormData(prev => ({
      ...prev,
      extrasInfo: [
        ...prev.extrasInfo,
        {
          dia: '',
          horaInicio: '',
          horaFin: '',
          st: '',
          nombreCliente: ''
        }
      ]
    }));
  };

  const handleRemoveRow = (index) => {
    const extraToRemove = formData.extrasInfo[index];

    // No permitir eliminar si es la única fila O si es la entrada de disponibilidad
    if (formData.extrasInfo.length === 1 || extraToRemove.st === 'DISPONIBILIDAD_CELULAR') {
      return;
    }

    setFormData(prev => ({
      ...prev,
      extrasInfo: prev.extrasInfo.filter((_, i) => i !== index)
    }));
  };

  const handleExtraInfoChange = (index, field, value) => {
    // No permitir editar las entradas de disponibilidad
    if (formData.extrasInfo[index].st === 'DISPONIBILIDAD_CELULAR') {
      return;
    }

    setFormData(prev => ({
      ...prev,
      extrasInfo: prev.extrasInfo.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar período de bloqueo
    if (blockPeriodStatus.isBlocked) {
      setErrorMessage(blockPeriodStatus.message);
      setSubmitStatus('error');
      return;
    }

    // Validaciones básicas
    if (!formData.numeroCedula) {
      setErrorMessage('El número de cédula es requerido');
      setSubmitStatus('error');
      return;
    }

    // Validar que al menos una fila tenga datos completos (excluyendo disponibilidad)
    const hasValidRow = formData.extrasInfo.some(
      extra => extra.st !== 'DISPONIBILIDAD_CELULAR' && extra.dia && extra.horaInicio && extra.horaFin
    );

    if (!hasValidRow) {
      setErrorMessage('Debe agregar al menos un registro de horas extras completo');
      setSubmitStatus('error');
      return;
    }

    // Validar fechas futuras y horarios de trabajo (excluyendo la entrada de disponibilidad)
    for (let i = 0; i < formData.extrasInfo.length; i++) {
      const extra = formData.extrasInfo[i];

      // Saltar validación para la entrada de disponibilidad
      if (extra.st === 'DISPONIBILIDAD_CELULAR') continue;

      if (!extra.dia || !extra.horaInicio || !extra.horaFin) continue;

      // Validar que la fecha no sea futura
      const validacionFecha = validarFechaNoFutura(extra.dia);
      if (!validacionFecha.valid) {
        setErrorMessage(`Registro ${i + 1}: ${validacionFecha.message}`);
        setSubmitStatus('error');
        return;
      }

      // Validar horario laboral de lunes a viernes
      const validacionHorario = validarHorarioTrabajo(extra.dia, extra.horaInicio, extra.horaFin);
      if (!validacionHorario.valid) {
        setErrorMessage(`Registro ${i + 1}: ${validacionHorario.message}`);
        setSubmitStatus('error');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    try {
      const updateData = {
        numeroCedula: formData.numeroCedula,
        disponibilidadCelular: formData.disponibilidadCelular,
        diasDisponibilidad: formData.diasDisponibilidad,
        extrasInfo: formData.extrasInfo
      };

      // Verificar si la solicitud estaba rechazada
      const request = extraHoursRequests.find(req => req.id === requestId);
      const estabaRechazada = request && (
        request.revisadoAsistente === false ||
        request.aprobadoJefatura === false ||
        request.aprobadoRH === false
      );

      // Si estaba rechazada, resetear TODOS los campos de aprobación a null
      // para que vuelva a entrar en el flujo desde el inicio
      if (estabaRechazada) {
        updateData.revisadoAsistente = null;
        updateData.aprobadoJefatura = null;
        updateData.aprobadoRH = null;
        // updateData.revisadoConta = null;
      }

      await service.updateExtraHoursRequest(requestId, updateData);

      setSubmitStatus('success');

      // Recargar datos del contexto
      await loadExtraHoursData();

      // Cerrar el modal después de un breve delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Error al actualizar el registro de horas extras');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Verificar si la solicitud está rechazada para mostrar el banner
  const request = extraHoursRequests.find(req => req.id === requestId);
  const estaRechazada = request && (
    request.revisadoAsistente === false ||
    request.aprobadoJefatura === false ||
    request.aprobadoRH === false
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 pr-2">
            Editar Solicitud de Horas Extras
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Success/Error Messages */}
        {submitStatus && (
          <div className={`mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg flex items-start sm:items-center gap-2 sm:gap-3 ${submitStatus === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
            }`}>
            {submitStatus === 'success' ? (
              <>
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-900 text-sm sm:text-base">¡Solicitud actualizada exitosamente!</p>
                  <p className="text-xs sm:text-sm text-green-700">Cerrando...</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-red-900 text-sm sm:text-base">Error al actualizar la solicitud</p>
                  <p className="text-xs sm:text-sm text-red-700 break-words">{errorMessage}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Block Period Warning */}
        {blockPeriodStatus.isBlocked && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-4 rounded-lg flex items-start gap-3 bg-yellow-50 border-2 border-yellow-400">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-yellow-900 text-sm sm:text-base mb-1">
                Sistema Cerrado - Período de Bloqueo
              </p>
              <p className="text-xs sm:text-sm text-yellow-800 break-words">
                {blockPeriodStatus.message}
              </p>
            </div>
          </div>
        )}

        {/* Banner informativo para solicitudes rechazadas */}
        {!blockPeriodStatus.isBlocked && estaRechazada && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
            <AlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-900 text-sm sm:text-base">Solicitud Rechazada - Modo Corrección</p>
              <p className="text-xs sm:text-sm text-blue-700 mt-1">
                Esta solicitud fue rechazada en una etapa de aprobación. Realiza las correcciones necesarias y al guardar,
                la solicitud volverá a entrar al flujo de aprobaciones desde el inicio.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Información del Solicitante */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.departamento}
                  disabled
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Número de Cédula <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numeroCedula}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroCedula: e.target.value }))}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ej: 1-2345-6789"
                  required
                  disabled={isSubmitting || blockPeriodStatus.isBlocked}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Nombre Solicitante
                </label>
                <input
                  type="text"
                  value={formData.nombreSolicitante}
                  disabled
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Disponibilidad de Celular - Solo para Ingeniería */}
            {formData.departamento === 'Ingeniería' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.disponibilidadCelular}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      disponibilidadCelular: e.target.checked,
                      diasDisponibilidad: e.target.checked ? prev.diasDisponibilidad : 0
                    }))}
                    disabled={isSubmitting || blockPeriodStatus.isBlocked}
                    className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <span className="text-sm sm:text-base font-medium text-gray-800">
                      Disponibilidad de celular
                    </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Marque esta opción si tuvo disponibilidad de celular durante este período. Se agregará 1 hora de tiempo medio (1.5x) por cada día de disponibilidad.
                    </p>
                  </div>
                </div>

                {formData.disponibilidadCelular && (
                  <div className="ml-7">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Cantidad de días con disponibilidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.diasDisponibilidad}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        diasDisponibilidad: parseInt(e.target.value) || 0
                      }))}
                      className="w-full sm:w-48 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Ej: 7"
                      disabled={isSubmitting || blockPeriodStatus.isBlocked}
                      required={formData.disponibilidadCelular}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total de horas por disponibilidad: {formData.diasDisponibilidad} hora(s) de tiempo medio
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tabla de Horas Extras */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-800">
                  Detalle de Horas Extras
                </h3>
                <button
                  type="button"
                  onClick={handleAddRow}
                  disabled={isSubmitting || blockPeriodStatus.isBlocked}
                  className="flex items-center gap-1 md:gap-2 bg-primary text-white px-3 md:px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} className="md:w-[18px] md:h-[18px]" />
                  <span className="hidden sm:inline">Agregar</span>
                  <span className="sm:hidden">+</span>
                </button>
              </div>

              {/* Vista Desktop - Tabla */}
              <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Día
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hora Inicio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hora Salida
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ST
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">

                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.extrasInfo.map((extra, index) => {
                      const esDisponibilidad = extra.st === 'DISPONIBILIDAD_CELULAR';
                      return (
                        <tr key={index} className={`hover:bg-gray-50 ${esDisponibilidad ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={extra.dia}
                              onChange={(e) => handleExtraInfoChange(index, 'dia', e.target.value)}
                              max={obtenerFechaMaxima()}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              required
                              disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={extra.horaInicio}
                              onChange={(e) => handleExtraInfoChange(index, 'horaInicio', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              required
                              disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={extra.horaFin}
                              onChange={(e) => handleExtraInfoChange(index, 'horaFin', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              required
                              disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={extra.st}
                              onChange={(e) => handleExtraInfoChange(index, 'st', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              placeholder="ST"
                              disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={extra.nombreCliente}
                              onChange={(e) => handleExtraInfoChange(index, 'nombreCliente', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              placeholder="Cliente"
                              disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(index)}
                              disabled={formData.extrasInfo.length === 1 || isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                              className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={esDisponibilidad ? "No se puede eliminar la entrada de disponibilidad" : "Eliminar fila"}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista Mobile - Tarjetas */}
              <div className="md:hidden space-y-4">
                {formData.extrasInfo.map((extra, index) => {
                  const esDisponibilidad = extra.st === 'DISPONIBILIDAD_CELULAR';
                  return (
                    <div key={index} className={`border border-gray-200 rounded-lg p-4 space-y-3 ${esDisponibilidad ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {esDisponibilidad ? '📱 Disponibilidad' : `Registro #${index + 1}`}
                        </span>
                        {!esDisponibilidad && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            disabled={formData.extrasInfo.length === 1 || isSubmitting || blockPeriodStatus.isBlocked}
                            className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
                            title="Eliminar registro"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Día <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={extra.dia}
                          onChange={(e) => handleExtraInfoChange(index, 'dia', e.target.value)}
                          max={obtenerFechaMaxima()}
                          className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                          disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Hora Inicio <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={extra.horaInicio}
                            onChange={(e) => handleExtraInfoChange(index, 'horaInicio', e.target.value)}
                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            required
                            disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Hora Salida <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={extra.horaFin}
                            onChange={(e) => handleExtraInfoChange(index, 'horaFin', e.target.value)}
                            className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            required
                            disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          ST
                        </label>
                        <input
                          type="text"
                          value={extra.st}
                          onChange={(e) => handleExtraInfoChange(index, 'st', e.target.value)}
                          className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="ST"
                          disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Cliente
                        </label>
                        <input
                          type="text"
                          value={extra.nombreCliente}
                          onChange={(e) => handleExtraInfoChange(index, 'nombreCliente', e.target.value)}
                          className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Nombre del Cliente"
                          disabled={isSubmitting || blockPeriodStatus.isBlocked || esDisponibilidad}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totales */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">Resumen de Horas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex justify-between items-center py-2 sm:py-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Tiempo Medio (1.5x):
                  </span>
                  <span className="text-base sm:text-lg font-bold text-blue-600">
                    {totals.tiempoMedio} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 sm:py-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Tiempo Doble (2x):
                  </span>
                  <span className="text-base sm:text-lg font-bold text-orange-600">
                    {totals.tiempoDoble} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 sm:py-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Tiempo Doble Doble (4x):
                  </span>
                  <span className="text-base sm:text-lg font-bold text-red-600">
                    {totals.tiempoDobleDoble} hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 sm:px-6 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitStatus === 'success' || blockPeriodStatus.isBlocked}
              className="px-4 sm:px-6 py-2.5 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              title={blockPeriodStatus.isBlocked ? 'Sistema cerrado - Período de bloqueo' : ''}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Actualizando...
                </>
              ) : blockPeriodStatus.isBlocked ? (
                'Sistema Cerrado'
              ) : (
                <>
                  <Save size={18} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtraHoursEdit;