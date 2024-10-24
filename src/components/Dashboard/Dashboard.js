import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import { Plus, FileText, Check, AlertTriangle } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { periods, expenseReports, loading, error } = useAppContext();

  const currentPeriod = periods[0] || {};

  const expenseColumns = [
    { 
      key: 'fecha', 
      header: 'Fecha',
      render: (value) => new Date(value).toLocaleDateString()
    },
    { key: 'rubro', header: 'Rubro' },
    { 
      key: 'monto', 
      header: 'Monto',
      render: (value) => value.toLocaleString('es-CR', { 
        style: 'currency', 
        currency: 'CRC' 
      })
    },
    { 
      key: 'status', 
      header: 'Estado',
      render: (_, row) => {
        if (row.aprobacionAsistente === false) {
          return (
            <span className="status-badge status-rejected">
              No aprobada
            </span>
          );
        }
        if (row.aprobacionJefatura === false) {
          return (
            <span className="status-badge status-rejected">
              No aprobada
            </span>
          );
        }
        if (row.aprobacionContabilidad === false) {
          return (
            <span className="status-badge status-rejected">
              No aprobada
            </span>
          );
        }
        
        if (row.aprobacionContabilidad) {
          return (
            <span className="status-badge status-approved">
              Aprobado
            </span>
          );
        } else if (row.aprobacionJefatura) {
          return (
            <span className="status-badge status-in-progress">
              En Contabilidad
            </span>
          );
        } else if (row.aprobacionAsistente) {
          return (
            <span className="status-badge status-in-progress">
              En Jefatura
            </span>
          );
        }
        
        return (
          <span className="status-badge status-pending">
            Pendiente
          </span>
        );
      }
    }
  ];

  const stats = [
    {
      title: 'Total Gastos',
      value: expenseReports.reduce((sum, report) => sum + parseFloat(report.monto), 0)
        .toLocaleString('es-CR', { style: 'currency', currency: 'CRC' }),
      icon: <FileText size={24} />
    },
    {
      title: 'Pendientes',
      value: expenseReports.filter(report => !report.aprobacionAsistente).length,
      icon: <AlertTriangle size={24} />
    },
    {
      title: 'Aprobados',
      value: expenseReports.filter(report => report.aprobacionContabilidad).length,
      icon: <Check size={24} />
    }
  ];

  if (error) {
    return (
      <Layout>
        <div className="error-message">
          <AlertTriangle size={48} />
          <h2>Error al cargar los datos</h2>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="current-period">
              Periodo actual: {currentPeriod.periodo || 'Cargando...'}
            </p>
          </div>
          <Button 
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={() => navigate('/expenses/new')}
          >
            Nuevo Gasto
          </Button>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <Card key={index} className="stat-card">
              <div className="stat-content">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-info">
                  <h3>{stat.title}</h3>
                  <p>{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card 
          title="Gastos Recientes" 
          subtitle="Últimos gastos registrados en el periodo actual"
          action={
            <Button 
              variant="outline" 
              size="small"
              onClick={() => navigate('/expenses')}
            >
              Ver todos
            </Button>
          }
        >
          <Table 
            columns={expenseColumns}
            data={expenseReports.slice(0, 5)}
            isLoading={loading}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;