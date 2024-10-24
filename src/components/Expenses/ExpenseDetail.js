// src/components/Expenses/ExpenseDetail.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import Button from '../common/Button';
import { ArrowLeft, Edit, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import './ExpenseDetail.css';
import ExpenseImage from '../common/ExpenseImage';

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { expenseReports } = useAppContext();

  const expense = expenseReports.find(exp => exp.id === id);

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
      date: '15/10/2024',
      comments: 'Todo en orden'
    },
    {
      title: 'Aprobación de Jefatura',
      approved: expense.aprobacionJefatura,
      date: '16/10/2024',
      comments: 'Aprobado'
    },
    {
      title: 'Aprobación de Contabilidad',
      approved: expense.aprobacionContabilidad,
      date: null,
      comments: null
    }
  ];

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
            <ExpenseImage 
              itemId={expense.id}
              fileName={expense.comprobante}
              className="expense-detail-image"
            />
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
                  className={`timeline-item ${status.approved ? 'approved' :
                      status.date ? 'pending' : 'upcoming'
                    }`}
                >
                  <div className="timeline-icon">
                    {status.approved ? (
                      <CheckCircle size={24} />
                    ) : status.date ? (
                      <Clock size={24} />
                    ) : (
                      <Clock size={24} />
                    )}
                  </div>
                  <div className="timeline-content">
                    <h3>{status.title}</h3>
                    {status.date && (
                      <p className="timeline-date">{status.date}</p>
                    )}
                    {status.comments && (
                      <p className="timeline-comments">{status.comments}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ExpenseDetail;