import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useIncapacidades } from '../../context/incapacidadesContext';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import {
  ArrowLeft, User, Building2, Calendar, FileText,
  CheckCircle, Clock, Download, Loader2, AlertTriangle,
} from 'lucide-react';
import { INCAPACIDADES_ROUTES } from '../../routes';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const { requests, userRole, markRecibido } = useIncapacidades();
  const [request, setRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const found = requests.find(r => r.id === id);
    if (found) setRequest(found);
  }, [id, requests]);

  const fmtDate = iso => {
    if (!iso) return '-';
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-CR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const handleMarcarRecibido = async () => {
    setIsProcessing(true);
    try {
      await markRecibido(request.id);
    } catch {
      alert('Error al marcar como recibido');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Incapacidad no encontrada</h3>
            <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
          </div>
        </Card>
      </div>
    );
  }

  const canMarkRecibido = userRole === 'Administrador' && request.recibido !== true;

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>

      {/* Header */}
      <Card className="mb-4">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Incapacidad</h1>
              <p className="text-sm text-gray-500 mt-1">
                Registrada el {request.created?.toLocaleDateString('es-CR')}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              request.recibido === true
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {request.recibido === true
                ? <><CheckCircle size={14} /> Recibida</>
                : <><Clock size={14} /> Pendiente de recibir</>}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <User size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Solicitante</p>
                <p className="text-sm font-semibold">{request.nombreSolicitante}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Departamento</p>
                <p className="text-sm font-semibold">{request.departamento || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Días</p>
                <p className="text-sm font-semibold text-blue-600">{request.diasIncapacidad} día(s)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Cédula</p>
                <p className="text-sm font-semibold">{request.numeroCedula || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Período */}
      <Card className="mb-4">
        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Período</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-1">Inicio</p>
              <p className="text-sm font-bold text-blue-700">{fmtDate(request.fechaInicio)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-1">Fin</p>
              <p className="text-sm font-bold text-blue-700">{fmtDate(request.fechaFin)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-1">Total días</p>
              <p className="text-3xl font-bold text-green-600">{request.diasIncapacidad}</p>
            </div>
          </div>
          {request.motivo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-1">Diagnóstico / Motivo</p>
              <p className="text-sm text-gray-900">{request.motivo}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Comprobantes */}
      {request.comprobantes?.length > 0 && (
        <Card className="mb-4">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Comprobante médico</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {request.comprobantes.map((c, i) => (
                <a
                  key={i}
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 text-center"
                >
                  <Download size={20} className="text-blue-600" />
                  <span className="truncate w-full">{c.name || `Archivo ${i + 1}`}</span>
                </a>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Estado recibido */}
      {request.recibido === true && (
        <Card className="mb-4">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Recibido por RH</h2>
            <p className="text-sm text-gray-700">
              Marcada como recibida por <strong>{request.recibidoPor}</strong>
              {request.fechaRecibido && (
                <> el {request.fechaRecibido.toLocaleDateString('es-CR')}</>
              )}
            </p>
          </div>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
        {canMarkRecibido && (
          <Button
            variant="success"
            startIcon={isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            onClick={handleMarcarRecibido}
            disabled={isProcessing}
          >
            {isProcessing ? 'Procesando...' : 'Marcar como recibido'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RequestDetail;
