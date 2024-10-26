import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import ExpenseImage from '../common/ExpenseImage';
import {
  ArrowLeft,
  Edit,
  Clock,
  CheckCircle,
  AlertTriangle,
  Image,
  Loader,
  StickyNote,
  XCircle,
  Check,
  X,
} from 'lucide-react';

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { expenseReports, loading: reportsLoading } = useAppContext();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const returnPath = location.state?.from?.pathname || '/expenses';
  const isFromApprovals = returnPath.includes('/approvals');

  useEffect(() => {
    if (!reportsLoading && expenseReports.length > 0) {
      const foundExpense = expenseReports.find(exp => exp.id === id);
      setExpense(foundExpense);
      setLoading(false);
    }
  }, [id, expenseReports, reportsLoading]);

  const handleBack = () => {
    navigate(returnPath);
  };

  const handleEdit = () => {
    navigate(`/expenses/${id}/edit`, {
      state: { from: location.state?.from }
    });
  };

  if (loading || reportsLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
          <Loader size={48} className="animate-spin mb-4" />
          <p>Cargando detalles del gasto...</p>
        </div>
      </Layout>
    );
  }

  if (!expense) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertTriangle size={48} className="text-error mb-4" />
          <h2 className="text-xl font-semibold mb-4">Gasto no encontrado</h2>
          <Button
            variant="outline"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/expenses')}
          >
            Volver a la lista
          </Button>
        </div>
      </Layout>
    );
  }

  const approvalStatus = [
    {
      title: 'Revisión de Asistente',
      approved: expense.aprobacionAsistente,
    },
    {
      title: 'Aprobación de Jefatura',
      approved: expense.aprobacionJefatura,
    },
    {
      title: 'Aprobación de Contabilidad',
      approved: expense.aprobacionContabilidad,
    }
  ];

  const getStatusClass = (status) => {
    if (status === "Aprobada") return 'text-success bg-success/10';
    if (status === "No aprobada") return 'text-error bg-error/10';
    return 'text-gray-400 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    if (status === "Aprobada") return <CheckCircle size={24} />;
    if (status === "No aprobada") return <XCircle size={24} />;
    return <Clock size={24} />;
  };

  const handleApprove = async () => {
    // Implementation will be added later
    console.log('Aprobar:', id);
  };

  const handleReject = async () => {
    // Implementation will be added later
    console.log('Rechazar:', id);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            startIcon={<ArrowLeft size={16} />}
            onClick={handleBack}
          >
            Volver
          </Button>
          {!expense?.bloqueoEdicion && (
            <Button
              variant="outline"
              startIcon={<Edit size={16} />}
              onClick={handleEdit}
            >
              Editar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-semibold">{expense.rubro}</h2>
                <div className="text-2xl font-semibold text-primary">
                  {expense.monto.toLocaleString('es-CR', {
                    style: 'currency',
                    currency: 'CRC'
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className="text-sm text-gray-500">Fecha</span>
                  <p className="text-gray-900 mt-1">
                    {expense.fecha.toLocaleDateString('es-CR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ST</span>
                  <p className="text-gray-900 mt-1">{expense.st}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fondos Propios</span>
                  <p className="text-gray-900 mt-1">
                    {expense.fondosPropios ? 'Sí' : 'No'}
                  </p>
                </div>
                {expense.fondosPropios && (
                  <div>
                    <span className="text-sm text-gray-500">Motivo</span>
                    <p className="text-gray-900 mt-1">
                      {expense.motivo || 'No especificado'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-1">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comprobante</h3>
              {expense.comprobante ? (
                <ExpenseImage itemId={expense.comprobante} />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400 bg-gray-50 rounded-lg">
                  <Image size={48} className="mb-2" />
                  <p>No hay comprobante adjunto</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="lg:col-span-3">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6">Estado de Aprobación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {approvalStatus.map((status, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-4 rounded-lg ${getStatusClass(status.approved)}`}
                  >
                    <div className="mr-4">
                      {getStatusIcon(status.approved)}
                    </div>
                    <span className="font-medium">{status.title}</span>
                  </div>
                ))}
              </div>

              {expense.notasRevision && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center mb-2">
                    <StickyNote size={20} className="mr-2" />
                    <h4 className="font-medium">Notas de revisión</h4>
                  </div>
                  <p className="p-4 bg-gray-50 rounded-lg text-gray-700">
                    {expense.notasRevision}
                  </p>
                </div>
              )}
            </div>
            {isFromApprovals && expense.aprobacionAsistente === "Pendiente" && (
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  variant="outline"
                  className="text-success hover:bg-success/10"
                  startIcon={<Check size={16} />}
                  onClick={handleApprove}
                >
                  Aprobar
                </Button>
                <Button
                  variant="outline"
                  className="text-error hover:bg-error/10"
                  startIcon={<X size={16} />}
                  onClick={handleReject}
                >
                  Rechazar
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ExpenseDetail;