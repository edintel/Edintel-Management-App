import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import { ArrowLeft, Edit, Clock, CheckCircle, AlertTriangle, Image, Loader, StickyNote, XCircle } from 'lucide-react';
import './ExpenseDetail.css';
import ExpenseImage from '../common/ExpenseImage';

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { expenseReports, loading: reportsLoading } = useAppContext();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportsLoading && expenseReports.length > 0) {
      const foundExpense = expenseReports.find(exp => exp.id === id);
      setExpense(foundExpense);
      setLoading(false);
    }
  }, [id, expenseReports, reportsLoading]);

  if (loading || reportsLoading) {
    return (
      <Layout>
        <div className="expense-loading">
          <Loader size={48} className="animate-spin" />
          <p>Cargando detalles del gasto...</p>
        </div>
      </Layout>
    );
  }

  if (!expense) {
    return (
      <Layout>
        <div className="expense-not-found">
          <AlertTriangle size={48} />
          <h2>Gasto no encontrado</h2>
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
    if (status === true) return 'approved';
    if (status === false) return 'rejected';
    return 'upcoming';
  };

  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle size={24} />;
    if (status === false) return <XCircle size={24} />;
    return <Clock size={24} />;
  };

  return (
    <Layout>
      <div className="expense-detail-container">
        <div className="expense-detail-header">
          <Button
            variant="text"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/expenses')}
          >
            Volver
          </Button>
          {!expense.bloqueoEdicion && (
            <Button
              variant="outline"
              startIcon={<Edit size={16} />}
              onClick={() => navigate(`/expenses/${id}/edit`)}
            >
              Editar
            </Button>
          )}
        </div>

        <div className="expense-detail-grid">
          <Card className="expense-info-card">
            <div className="expense-main-info">
              <h2>{expense.rubro}</h2>
              <div className="expense-amount">
                {expense.monto.toLocaleString('es-CR', {
                  style: 'currency',
                  currency: 'CRC'
                })}
              </div>
            </div>

            <div className="expense-details">
              <div className="detail-item">
                <span className="detail-label">Fecha</span>
                <span className="detail-value">
                  {new Date(expense.fecha).toLocaleDateString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ST</span>
                <span className="detail-value">{expense.st}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fondos Propios</span>
                <span className="detail-value">
                  {expense.fondosPropios ? 'Sí' : 'No'}
                </span>
              </div>
              {expense.fondosPropios && (
                <div className="detail-item">
                  <span className="detail-label">Motivo</span>
                  <span className="detail-value">
                    {expense.motivo || 'No especificado'}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Comprobante"
            className="expense-image-card"
          >
            <div className="invoice-preview">
              {expense.comprobante ? (
                <ExpenseImage 
                  itemId={expense.comprobante}
                  className="expense-detail-image"
                />
              ) : (
                <div className="no-image-placeholder">
                  <Image size={48} />
                  <p>No hay comprobante adjunto</p>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Estado de Aprobación"
            className="approval-status-card"
          >
            <div className="approval-timeline">
              {approvalStatus.map((status, index) => (
                <div
                  key={index}
                  className={`timeline-item ${getStatusClass(status.approved)}`}
                >
                  <div className="timeline-icon">
                    {getStatusIcon(status.approved)}
                  </div>
                  <div className="timeline-content">
                    <h3>{status.title}</h3>
                  </div>
                </div>
              ))}
            </div>
            {expense.notasRevision && (
              <div className="revision-notes">
                <div className="notes-header">
                  <StickyNote size={20} />
                  <h3>Notas de revisión</h3>
                </div>
                <p>{expense.notasRevision}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ExpenseDetail;