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
import {
  calcularTotalesHorasExtras,
  dividirHorasPorSegmento,
  redondearMediaHora
} from '../Service/InsideServices/ExtraHoursCalculationService';

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



  // Calcular totales usando el servicio centralizado
  const calculateDetailedTotals = () => {
    if (!request.extrasInfo || request.extrasInfo.length === 0) {
      return {
        tiempoMedio: 0,
        tiempoDoble: 0,
        tiempoDobleDoble: 0
      };
    }

    const totales = calcularTotalesHorasExtras(request.extrasInfo, request.departamento);

    // Convertir strings a números para compatibilidad
    return {
      tiempoMedio: parseFloat(totales.tiempoMedio),
      tiempoDoble: parseFloat(totales.tiempoDoble),
      tiempoDobleDoble: parseFloat(totales.tiempoDobleDoble)
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
              <div className={`p-2 rounded-full ${request.revisadoAsistente === true
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
              <div className={`p-2 rounded-full ${request.aprobadoJefatura === true
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
              <div className={`p-2 rounded-full ${request.aprobadoRH === true
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
              <div className={`p-2 rounded-full ${request.revisadoConta === true
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