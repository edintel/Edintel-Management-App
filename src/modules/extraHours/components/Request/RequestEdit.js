// src/modules/extraHours/components/Request/RequestEdit.js
import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertTriangle, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useExtraHours } from '../../context/extraHoursContext';

const ExtraHoursEdit = ({ onClose, requestId }) => {
  const { service, extraHoursRequests, loadExtraHoursData } = useExtraHours();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    departamento: '',
    numeroCedula: '',
    nombreSolicitante: '',
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

  // Feriados fijos de Costa Rica
  const feriadosFijos = [
    { mes: 1, dia: 1 },    // 1 enero
    { mes: 4, dia: 11 },   // 11 abril (Juan Santamaría)
    { mes: 5, dia: 1 },    // 1 mayo
    { mes: 7, dia: 25 },   // 25 julio (Anexión Guanacaste)
    { mes: 8, dia: 2 },    // 2 agosto (Virgen de los Ángeles)
    { mes: 8, dia: 15 },   // 15 agosto (Día de la Madre)
    { mes: 8, dia: 31 },   // 31 agosto (Día de la Persona Negra)
    { mes: 9, dia: 15 },   // 15 septiembre (Independencia)
    { mes: 12, dia: 1 },   // 1 diciembre (Abolición del Ejército)
    { mes: 12, dia: 25 },  // 25 diciembre (Navidad)
  ];

  /**
   * Calcula la fecha de Pascua usando el algoritmo de Computus
   */
  const calcularPascua = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  };

  /**
   * Verifica si una fecha es feriado
   */
  const esFeriado = (fecha) => {
    const mes = fecha.getMonth() + 1;
    const dia = fecha.getDate();
    const year = fecha.getFullYear();

    // Verificar feriados fijos
    const esFeriadoFijo = feriadosFijos.some(
      feriado => feriado.mes === mes && feriado.dia === dia
    );

    if (esFeriadoFijo) return true;

    // Calcular Semana Santa (Jueves y Viernes Santo)
    const pascua = calcularPascua(year);
    const juevesSanto = new Date(pascua);
    juevesSanto.setDate(pascua.getDate() - 3);
    const viernesSanto = new Date(pascua);
    viernesSanto.setDate(pascua.getDate() - 2);

    const fechaStr = fecha.toDateString();
    return (
      fechaStr === juevesSanto.toDateString() ||
      fechaStr === viernesSanto.toDateString()
    );
  };

  /**
   * Verifica si una fecha es domingo
   */
  const esDomingo = (fecha) => {
    return fecha.getDay() === 0;
  };

  /**
   * Divide las horas trabajadas en segmentos según el horario
   */
  const dividirHorasPorSegmento = (horaInicio, horaFin) => {
    const [hi, mi] = horaInicio.split(':').map(Number);
    const [hf, mf] = horaFin.split(':').map(Number);

    let inicio = hi + mi / 60;
    let fin = hf + mf / 60;

    // Si cruza medianoche
    if (fin < inicio) {
      fin += 24;
    }

    let horasDiurnas = 0;
    let horasNocturnas = 0;

    // Horario diurno: 6:00 AM (6) a 10:00 PM (22)
    // Horario nocturno: 10:00 PM (22) a 6:00 AM (6 del día siguiente = 30)

    // Caso 1: Todo el turno es diurno (6-22)
    if (inicio >= 6 && fin <= 22) {
      horasDiurnas = fin - inicio;
    }
    // Caso 2: Todo el turno es nocturno (22-30 o 0-6)
    else if ((inicio >= 22 && fin <= 30) || (inicio >= 0 && fin <= 6)) {
      horasNocturnas = fin - inicio;
    }
    // Caso 3: Empieza diurno y termina nocturno
    else if (inicio >= 6 && inicio < 22 && fin > 22) {
      horasDiurnas = 22 - inicio;
      horasNocturnas = fin - 22;
    }
    // Caso 4: Empieza nocturno (noche anterior) y termina diurno
    else if (inicio >= 0 && inicio < 6 && fin > 6) {
      horasNocturnas = 6 - inicio;
      horasDiurnas = fin - 6;
    }
    // Caso 5: Empieza diurno y cruza toda la noche hasta el día siguiente
    else if (inicio >= 6 && inicio < 22 && fin > 30) {
      horasDiurnas = 22 - inicio;
      horasNocturnas = 8; // 22 a 6 (del siguiente día)
      horasDiurnas += (fin - 30); // Horas después de las 6 AM
    }

    return { horasDiurnas, horasNocturnas };
  };

  // ✅ NUEVA FUNCIÓN: Obtener la fecha máxima permitida (hoy)
  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // ✅ NUEVA FUNCIÓN: Validar horarios y reglas de registro de horas extras
  const validateWorkHours = (dia, horaInicio, horaFin) => {
    if (!dia || !horaInicio || !horaFin) return { valid: true };

    // Crear fecha local sin conversión de zona horaria
    const [year, month, day] = dia.split('-');
    const fecha = new Date(year, month - 1, day);
    const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const esFeriadoDia = esFeriado(fecha);

    // Convertir horas a minutos desde medianoche
    const [inicioHora, inicioMin] = horaInicio.split(':').map(Number);
    const [finHora, finMin] = horaFin.split(':').map(Number);

    const inicioMinutos = inicioHora * 60 + inicioMin;
    const finMinutos = finHora * 60 + finMin;

    // Horarios clave
    const laboralInicio = 7 * 60 + 30; // 7:30 AM
    const laboralFin = 17 * 60; // 5:00 PM (17:00)
    const medianoche = 0; // 12:00 AM

    // REGLA 1: Hora de fin no puede ser menor que hora de inicio en el MISMO día
    if (finMinutos <= inicioMinutos) {
      return {
        valid: false,
        message: 'La hora de salida debe ser mayor que la hora de inicio. Si trabajó después de medianoche, debe registrar el día siguiente para las horas de 12:00 AM a 7:30 AM'
      };
    }

    // Solo validar entre semana (lunes a viernes) que NO sean feriados
    if (diaSemana >= 1 && diaSemana <= 5 && !esFeriadoDia) {
      // REGLA 2: Validar rangos permitidos para ENTRE SEMANA

      // Caso A: Horario de tarde/noche (5:00 PM - 11:59 PM)
      if (inicioMinutos >= laboralFin) {
        // Permitido: 5:00 PM en adelante
        // Debe terminar antes de medianoche o hasta 11:59 PM
        // (la validación de finMinutos > inicioMinutos ya cubre esto)
        return { valid: true };
      }

      // Caso B: Horario de madrugada (12:00 AM - 7:30 AM)
      // Debe marcarse el día SIGUIENTE
      if (inicioMinutos >= medianoche && inicioMinutos < laboralInicio) {
        // Este es el día siguiente, verificar que termine antes de 7:30 AM
        if (finMinutos > laboralInicio) {
          return {
            valid: false,
            message: 'Para horas entre 12:00 AM y 7:30 AM, debe terminar antes de las 7:30 AM'
          };
        }
        return { valid: true };
      }

      // Caso C: Dentro del horario laboral (7:30 AM - 5:00 PM)
      if (inicioMinutos >= laboralInicio && inicioMinutos < laboralFin) {
        return {
          valid: false,
          message: 'No se pueden registrar horas extras durante el horario laboral (7:30 AM - 5:00 PM). Las horas extras son desde las 5:00 PM a 11:59 PM del mismo día, o de 12:00 AM a 7:30 AM del día siguiente'
        };
      }

      // Caso D: Si termina dentro del horario laboral
      if (finMinutos > laboralInicio && finMinutos < laboralFin) {
        return {
          valid: false,
          message: 'No se pueden registrar horas extras que terminen durante el horario laboral (7:30 AM - 5:00 PM)'
        };
      }
    }

    return { valid: true };
  };

  // Cargar datos del registro
  useEffect(() => {
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

        setFormData({
          departamento: record.departamento || '',
          numeroCedula: record.numeroCedula?.toString() || '',
          nombreSolicitante: record.nombreSolicitante?.displayName || '',
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

  // Calcular totales cuando cambie extrasInfo
  useEffect(() => {
    calculateTotals();
  }, [formData.extrasInfo]);

  const calculateTotals = () => {
    let tiempoMedio = 0;
    let tiempoDoble = 0;
    let tiempoDobleDoble = 0;

    // ✅ LÓGICA ESPECIAL PARA DEPARTAMENTO COMERCIAL
    const esComercial = formData.departamento === 'Comercial';

    formData.extrasInfo.forEach(extra => {
      if (!extra.dia || !extra.horaInicio || !extra.horaFin) return;

      const { horasDiurnas, horasNocturnas } = dividirHorasPorSegmento(
        extra.horaInicio,
        extra.horaFin
      );

      const totalHoras = horasDiurnas + horasNocturnas;

      // ✅ SI ES COMERCIAL: TODO es tiempo y medio (1.5x)
      if (esComercial) {
        tiempoMedio += totalHoras;
        return; // Saltar el resto de la lógica
      }

      // ✅ LÓGICA NORMAL PARA OTROS DEPARTAMENTOS
      const fecha = new Date(extra.dia + 'T00:00:00');
      const esDomingoDia = esDomingo(fecha);
      const esFeriadoDia = esFeriado(fecha);

      if (esDomingoDia || esFeriadoDia) {
        if (horasNocturnas > 0) {
          tiempoDobleDoble += horasNocturnas;
        }
        if (horasDiurnas > 0) {
          tiempoDoble += horasDiurnas;
        }
      } else {
        if (horasNocturnas > 0) {
          tiempoDoble += horasNocturnas;
        }
        if (horasDiurnas > 0) {
          tiempoMedio += horasDiurnas;
        }
      }
    });

    const redondearMediaHora = (horasDecimales) => {
      return Math.round(horasDecimales * 2) / 2;
    };

    setTotals({
      tiempoMedio: redondearMediaHora(tiempoMedio).toFixed(2),
      tiempoDoble: redondearMediaHora(tiempoDoble).toFixed(2),
      tiempoDobleDoble: redondearMediaHora(tiempoDobleDoble).toFixed(2)
    });
  };

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
    if (formData.extrasInfo.length === 1) return;

    setFormData(prev => ({
      ...prev,
      extrasInfo: prev.extrasInfo.filter((_, i) => i !== index)
    }));
  };

  const handleExtraInfoChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      extrasInfo: prev.extrasInfo.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.numeroCedula) {
      setErrorMessage('El número de cédula es requerido');
      setSubmitStatus('error');
      return;
    }

    // Validar que al menos una fila tenga datos completos
    const hasValidRow = formData.extrasInfo.some(
      extra => extra.dia && extra.horaInicio && extra.horaFin
    );

    if (!hasValidRow) {
      setErrorMessage('Debe agregar al menos un registro de horas extras completo');
      setSubmitStatus('error');
      return;
    }

    // ✅ NUEVA VALIDACIÓN: Validar fechas futuras
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < formData.extrasInfo.length; i++) {
      const extra = formData.extrasInfo[i];
      if (!extra.dia || !extra.horaInicio || !extra.horaFin) continue;

      // Validar que la fecha no sea futura
      const [year, month, day] = extra.dia.split('-');
      const fechaExtra = new Date(year, month - 1, day);
      fechaExtra.setHours(0, 0, 0, 0);

      if (fechaExtra > today) {
        setErrorMessage(`La fecha del registro ${i + 1} no puede ser mayor a hoy`);
        setSubmitStatus('error');
        return;
      }

      // ✅ NUEVA VALIDACIÓN: Validar horario laboral de lunes a viernes
      const validation = validateWorkHours(extra.dia, extra.horaInicio, extra.horaFin);
      if (!validation.valid) {
        setErrorMessage(`Registro ${i + 1}: ${validation.message}`);
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
        extrasInfo: formData.extrasInfo.filter(
          extra => extra.dia && extra.horaInicio && extra.horaFin
        )
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Editar Solicitud de Horas Extras
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Success/Error Messages */}
        {submitStatus && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${submitStatus === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
            }`}>
            {submitStatus === 'success' ? (
              <>
                <CheckCircle className="text-green-600" size={24} />
                <div className="flex-1">
                  <p className="font-medium text-green-900">¡Solicitud actualizada exitosamente!</p>
                  <p className="text-sm text-green-700">Cerrando...</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="text-red-600" size={24} />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Error al actualizar la solicitud</p>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Banner informativo para solicitudes rechazadas */}
        {estaRechazada && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
            <AlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Solicitud Rechazada - Modo Corrección</p>
              <p className="text-sm text-blue-700 mt-1">
                Esta solicitud fue rechazada en una etapa de aprobación. Realiza las correcciones necesarias y al guardar,
                la solicitud volverá a entrar al flujo de aprobaciones desde el inicio.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Información del Solicitante */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.departamento}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Cédula <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numeroCedula}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroCedula: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: 1-2345-6789"
                  required
                  disabled={isSubmitting}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            {/* Tabla de Horas Extras */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Detalle de Horas Extras
                </h3>
                <button
                  type="button"
                  onClick={handleAddRow}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                  Agregar
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
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
                    {formData.extrasInfo.map((extra, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={extra.dia}
                            onChange={(e) => handleExtraInfoChange(index, 'dia', e.target.value)}
                            max={getMaxDate()}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            value={extra.horaInicio}
                            onChange={(e) => handleExtraInfoChange(index, 'horaInicio', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            value={extra.horaFin}
                            onChange={(e) => handleExtraInfoChange(index, 'horaFin', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={extra.st}
                            onChange={(e) => handleExtraInfoChange(index, 'st', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="ST"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={extra.nombreCliente}
                            onChange={(e) => handleExtraInfoChange(index, 'nombreCliente', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Cliente"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            disabled={formData.extrasInfo.length === 1 || isSubmitting}
                            className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Eliminar fila"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">Resumen de Horas</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Tiempo Medio (1.5x):
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {totals.tiempoMedio} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Tiempo Doble (2x):
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    {totals.tiempoDoble} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Tiempo Doble Doble (4x):
                  </span>
                  <span className="text-lg font-bold text-red-600">
                    {totals.tiempoDobleDoble} hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitStatus === 'success'}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Actualizando...
                </>
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