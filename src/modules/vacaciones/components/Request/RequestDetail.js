import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVacaciones } from '../../context/vacacionesContext';
import { useMsal } from '@azure/msal-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import {
  ArrowLeft,
  Clock,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Building2,
  CreditCard,
  FileText,
} from 'lucide-react';
import { VACACIONES_ROUTES } from '../../routes';

const getStatusInfo = request => {
  if (request.aprobadoJefatura === false || request.aprobadoRH === false) {
    return { label: 'Rechazada', color: 'red', status: 'rejected' };
  }
  if (request.aprobadoJefatura === true && request.aprobadoRH === true) {
    return { label: 'Aprobada', color: 'green', status: 'approved' };
  }
  if (request.aprobadoJefatura === true && request.aprobadoRH === null) {
    return { label: 'En RH', color: 'blue', status: 'in_rh' };
  }
  return { label: 'Pendiente', color: 'yellow', status: 'pending' };
};

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vacacionesRequests, updateApprovalStatus, service, userDepartmentRole } = useVacaciones();
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username;

  const [request, setRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get('from') || 'requests';

  const handleGoBack = () => {
    if (returnTo === 'approvals') {
      navigate(VACACIONES_ROUTES.APPROVALS);
    } else {
      navigate(VACACIONES_ROUTES.REQUESTS);
    }
  };

  useEffect(() => {
    const found = vacacionesRequests.find(r => r.id === id);
    if (found) setRequest(found);
  }, [id, vacacionesRequests]);

  if (!request) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle size={64} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Solicitud no encontrada</h3>
            <p className="text-sm text-gray-500 mb-4">
              La solicitud no existe o no tienes permisos para verla
            </p>
            <Button variant="outline" onClick={handleGoBack}>
              Volver
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(request);
  const isOwner = request.createdBy.email === userEmail;
  const role = userDepartmentRole?.role;

  const canApprove = () => {
    if (role === 'Colaborador' || role === 'AsistenteJefatura') return false;

    if (role === 'Jefatura') {
      const sameDepto = request.departamento === userDepartmentRole?.department?.departamento;
      return sameDepto && request.aprobadoJefatura === null;
    }

    if (role === 'Administrador') {
      return request.aprobadoJefatura === true && request.aprobadoRH === null;
    }

    return false;
  };

  const canEdit = () => {
    if (role === 'Administrador') return true;
    const isRejected = request.aprobadoJefatura === false || request.aprobadoRH === false;
    const isPending = request.aprobadoJefatura === null;
    return isOwner && (isRejected || isPending);
  };

  const handleApproval = async approved => {
    setIsProcessing(true);
    try {
      let approvalType = '';
      if (role === 'Jefatura') approvalType = 'jefatura';
      else if (role === 'Administrador') approvalType = 'rh';

      await updateApprovalStatus(request.id, approvalType, approved);
    } catch (error) {
      alert('Error al procesar la aprobación');
    } finally {
      setIsProcessing(false);
    }
  };

  const colorBadgeMap = {
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };

  const ApprovalStep = ({ label, value }) => (
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-full ${
        value === true ? 'bg-green-100 text-green-600'
        : value === false ? 'bg-red-100 text-red-600'
        : 'bg-gray-100 text-gray-400'
      }`}>
        {value === true ? <CheckCircle size={20} />
          : value === false ? <XCircle size={20} />
          : <Clock size={20} />}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">
          {value === true ? 'Aprobado' : value === false ? 'Rechazado' : 'Pendiente'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={handleGoBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>{returnTo === 'approvals' ? 'Volver a aprobaciones' : 'Volver a mis solicitudes'}</span>
      </button>

      {/* Header */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Detalles de Solicitud</h1>
              <p className="text-sm text-gray-500">
                Creada el {request.created?.toLocaleDateString('es-CR')} a las{' '}
                {request.created?.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorBadgeMap[statusInfo.color]}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Solicitante</p>
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
                <p className="text-xs text-gray-500 mb-1">Cédula</p>
                <p className="text-sm font-semibold text-gray-900">{request.numeroCedula || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Building2 size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Departamento</p>
                <p className="text-sm font-semibold text-gray-900">{request.departamento}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Días Hábiles</p>
                <p className="text-sm font-semibold text-blue-600">{request.diasHabiles} día(s)</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Período */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Período de Vacaciones</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</p>
              <p className="text-xl font-bold text-blue-600">
                {request.fechaInicio
                  ? new Date(request.fechaInicio + 'T00:00:00').toLocaleDateString('es-CR', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })
                  : 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Fecha de Fin</p>
              <p className="text-xl font-bold text-blue-600">
                {request.fechaFin
                  ? new Date(request.fechaFin + 'T00:00:00').toLocaleDateString('es-CR', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })
                  : 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Total Días Hábiles</p>
              <p className="text-3xl font-bold text-green-600">{request.diasHabiles}</p>
              <p className="text-xs text-gray-500">excluye fines de semana y feriados</p>
            </div>
          </div>

          {request.motivo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Motivo / Observaciones</p>
              </div>
              <p className="text-sm text-gray-900">{request.motivo}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Estado de Aprobación */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Aprobación</h2>

          <div className="space-y-4">
            <ApprovalStep label="Jefatura" value={request.aprobadoJefatura} />
            <ApprovalStep label="Recursos Humanos" value={request.aprobadoRH} />
          </div>
        </div>
      </Card>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={handleGoBack}>
          Volver
        </Button>

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
    </div>
  );
};

export default RequestDetail;
