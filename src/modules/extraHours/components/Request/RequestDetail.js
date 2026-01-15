// src/modules/extraHours/components/Request/RequestDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExtraHours } from '../../context/extraHoursContext';
import { useMsal } from '@azure/msal-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import ExtraHoursEdit from './RequestEdit';
import { 
  ArrowLeft, 
  Clock, 
  Check, 
  X, 
  AlertTriangle, 
  Edit,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Building2,
  CreditCard
} from 'lucide-react';
import { EXTRA_HOURS_ROUTES } from '../../routes';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { extraHoursRequests, updateApprovalStatus, service, userDepartmentRole, loadExtraHoursData } = useExtraHours();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;

  const [request, setRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Obtener el parámetro de retorno desde la URL (query string)
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get('from') || 'requests'; // Por defecto volver a requests

  // ==================== LÓGICA DE CÁLCULO DE HORAS ====================

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

  /**
   * Redondea a la media hora más cercana
   */
  const redondearMediaHora = (horasDecimales) => {
    return Math.round(horasDecimales * 2) / 2;
  };

  // ==================== FIN DE LÓGICA DE CÁLCULO ====================

  // Función para formatear fecha sin problemas de zona horaria
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Extraer solo la parte de fecha (YYYY-MM-DD)
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    // Crear fecha local (sin conversión de zona horaria)
    return new Date(year, month - 1, day).toLocaleDateString('es-CR');
  };

  // Función para volver a la página anterior
  const handleGoBack = () => {
    if (returnTo === 'approvals') {
      navigate(EXTRA_HOURS_ROUTES.APPROVALS);
    } else {
      navigate(EXTRA_HOURS_ROUTES.REQUESTS);
    }
  };

  useEffect(() => {
    const foundRequest = extraHoursRequests.find(req => req.id === id);
    if (foundRequest) {
      setRequest(foundRequest);
    }
  }, [id, extraHoursRequests]);

  if (!request) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle size={64} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Solicitud no encontrada
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              La solicitud que buscas no existe o no tienes permisos para verla
            </p>
            <Button variant="outline" onClick={handleGoBack}>
              Volver
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Cálculo de totales con redondeo
  const calculateDetailedTotals = () => {
    let tiempoMedio = 0;
    let tiempoDoble = 0;
    let tiempoDobleDoble = 0;

    if (!request.extrasInfo || request.extrasInfo.length === 0) {
      return {
        tiempoMedio: 0,
        tiempoDoble: 0,
        tiempoDobleDoble: 0
      };
    }

    request.extrasInfo.forEach(extra => {
      if (!extra.dia || !extra.horaInicio || !extra.horaFin) return;

      // Crear fecha local sin conversión de zona horaria
      const fecha = new Date(extra.dia + 'T00:00:00');
      const esDomingoDia = esDomingo(fecha);
      const esFeriadoDia = esFeriado(fecha);

      const { horasDiurnas, horasNocturnas } = dividirHorasPorSegmento(
        extra.horaInicio,
        extra.horaFin
      );

      // Aplicar las reglas según el tipo de día
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

    return {
      tiempoMedio: redondearMediaHora(tiempoMedio),
      tiempoDoble: redondearMediaHora(tiempoDoble),
      tiempoDobleDoble: redondearMediaHora(tiempoDobleDoble)
    };
  };

  const totals = calculateDetailedTotals();

  // Verificar si el usuario es el creador
  const isOwner = request.createdBy.email === userEmail;

  // Verificar permisos de edición usando el PermissionService
  const canEdit = () => {
    return service?.permissionService?.canEditRequest(userEmail, request) || false;
  };

  // Verificar permisos de aprobación
  const canApprove = () => {
    const role = userDepartmentRole?.role;

    if (role === 'Colaborador') return false;
    if (role === 'Administrador') return true;

    // Lógica de aprobación por etapas
    if (role === 'AsistenteJefatura' && !request.revisadoAsistente) return true;
    if (role === 'Jefatura' && request.revisadoAsistente && !request.aprobadoJefatura) return true;

    return false;
  };

  // Handle approval/rejection
  const handleApproval = async (approved) => {
    setIsProcessing(true);
    try {
      const role = userDepartmentRole?.role;
      let approvalType = '';

      if (role === 'AsistenteJefatura') approvalType = 'asistente';
      else if (role === 'Jefatura') approvalType = 'jefatura';
      else if (role === 'Administrador') approvalType = 'rh'; // RH approval

      await updateApprovalStatus(request.id, approvalType, approved);
      
      // Refresh request data
      const updatedRequest = extraHoursRequests.find(req => req.id === id);
      setRequest(updatedRequest);
    } catch (error) {
      alert('Error al procesar la aprobación');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle edit modal
  const handleOpenEdit = () => {
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
  };

  // Status badge
  const getStatusBadge = () => {
    const approvalStatus = service?.getApprovalStatusSummary(request);

    if (
      request.revisadoAsistente === false ||
      request.aprobadoJefatura === false ||
      request.aprobadoRH === false 
    ) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <X size={16} className="mr-1" />
          No aprobada
        </span>
      );
    }

    if (approvalStatus?.allApproved) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <Check size={16} className="mr-1" />
          Aprobada
        </span>
      );
    }

    if (request.aprobadoJefatura && !request.aprobadoRH) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <Clock size={16} className="mr-1" />
          En RH
        </span>
      );
    }

    if (request.revisadoAsistente && !request.aprobadoJefatura) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <Clock size={16} className="mr-1" />
          En Jefatura
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <AlertTriangle size={16} className="mr-1" />
        Pendiente
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={handleGoBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>{returnTo === 'approvals' ? 'Volver a aprobaciones' : 'Volver a mis solicitudes'}</span>
      </button>

      {/* Header Card */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Detalles de Solicitud
              </h1>
              <p className="text-sm text-gray-500">
                Creada el {request.created?.toLocaleDateString('es-CR')} a las{' '}
                {request.created?.toLocaleTimeString('es-CR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Información del Solicitante */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Nombre Solicitante</p>
                <p className="text-sm font-semibold text-gray-900">
                  {request.nombreSolicitante?.displayName || request.createdBy.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <CreditCard size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Número Cédula</p>
                <p className="text-sm font-semibold text-gray-900">
                  {request.numeroCedula || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Building2 size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Departamento</p>
                <p className="text-sm font-semibold text-gray-900">
                  {request.departamento}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Fecha Petición</p>
                <p className="text-sm font-semibold text-gray-900">
                  {request.fechaPeticion?.toLocaleDateString('es-CR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detalles de Horas Extras */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Detalle de Horas Extras
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Día
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora Inicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora Salida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ST
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {request.extrasInfo?.map((extra, index) => {
                  // Calcular horas para esta fila específica con redondeo
                  let horasCalculadas = 0;
                  if (extra.dia && extra.horaInicio && extra.horaFin) {
                    const { horasDiurnas, horasNocturnas } = dividirHorasPorSegmento(
                      extra.horaInicio,
                      extra.horaFin
                    );
                    horasCalculadas = horasDiurnas + horasNocturnas;
                  }
                  const horasRedondeadas = redondearMediaHora(horasCalculadas);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(extra.dia)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {extra.horaInicio || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {extra.horaFin || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {extra.st || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {extra.nombreCliente || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {horasRedondeadas.toFixed(2)} hrs
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Total Horas Tiempo Medio (1.5x)
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {totals.tiempoMedio.toFixed(2)} hrs
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Total Horas Tiempo Doble (2x)
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {totals.tiempoDoble.toFixed(2)} hrs
                </p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Total Horas Tiempo Doble Doble (4x)
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {totals.tiempoDobleDoble.toFixed(2)} hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline de Aprobaciones */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Estado de Aprobación
          </h2>

          <div className="space-y-4">
            {/* Asistente Jefatura */}
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                request.revisadoAsistente === true 
                  ? 'bg-green-100 text-green-600'
                  : request.revisadoAsistente === false
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {request.revisadoAsistente === true ? (
                  <CheckCircle size={20} />
                ) : request.revisadoAsistente === false ? (
                  <XCircle size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Asistente de Jefatura</p>
                <p className="text-sm text-gray-500">
                  {request.revisadoAsistente === true
                    ? 'Revisado'
                    : request.revisadoAsistente === false
                    ? 'Rechazado'
                    : 'Pendiente de revisión'}
                </p>
              </div>
            </div>

            {/* Jefatura */}
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                request.aprobadoJefatura === true 
                  ? 'bg-green-100 text-green-600'
                  : request.aprobadoJefatura === false
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {request.aprobadoJefatura === true ? (
                  <CheckCircle size={20} />
                ) : request.aprobadoJefatura === false ? (
                  <XCircle size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Jefatura</p>
                <p className="text-sm text-gray-500">
                  {request.aprobadoJefatura === true
                    ? 'Aprobado'
                    : request.aprobadoJefatura === false
                    ? 'Rechazado'
                    : 'Pendiente de aprobación'}
                </p>
              </div>
            </div>

            {/* RH */}
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                request.aprobadoRH === true 
                  ? 'bg-green-100 text-green-600'
                  : request.aprobadoRH === false
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {request.aprobadoRH === true ? (
                  <CheckCircle size={20} />
                ) : request.aprobadoRH === false ? (
                  <XCircle size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Recursos Humanos</p>
                <p className="text-sm text-gray-500">
                  {request.aprobadoRH === true
                    ? 'Aprobado'
                    : request.aprobadoRH === false
                    ? 'Rechazado'
                    : 'Pendiente de aprobación'}
                </p>
              </div>
            </div>

            {/* Contabilidad */}
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                request.revisadoConta === true 
                  ? 'bg-green-100 text-green-600'
                  : request.revisadoConta === false
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {request.revisadoConta === true ? (
                  <CheckCircle size={20} />
                ) : request.revisadoConta === false ? (
                  <XCircle size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Contabilidad</p>
                <p className="text-sm text-gray-500">
                  {request.revisadoConta === true
                    ? 'Revisado'
                    : request.revisadoConta === false
                    ? 'Rechazado'
                    : 'Pendiente de revisión'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleGoBack}
        >
          Cancelar
        </Button>

        {canEdit() && (
          <Button
            variant="outline"
            startIcon={<Edit size={16} />}
            onClick={handleOpenEdit}
          >
            Editar
          </Button>
        )}

        {canApprove() && (
          <>
            <Button
              variant="danger"
              startIcon={<XCircle size={16} />}
              onClick={() => handleApproval(false)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Rechazar'}
            </Button>
            <Button
              variant="success"
              startIcon={<CheckCircle size={16} />}
              onClick={() => handleApproval(true)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Aprobar'}
            </Button>
          </>
        )}
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <ExtraHoursEdit
          requestId={id}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
};

export default RequestDetail;