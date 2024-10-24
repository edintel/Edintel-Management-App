import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import './ExpenseList.css';

const ExpenseList = () => {
  const navigate = useNavigate();
  const { expenseReports, periods, loading } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
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
    { key: 'st', header: 'ST' },
    { 
      key: 'aprobacionStatus', 
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

  const filteredExpenses = expenseReports
    .filter(expense => {
      if (selectedPeriod && expense.periodoId !== selectedPeriod) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          expense.rubro.toLowerCase().includes(search) ||
          expense.st.toLowerCase().includes(search)
        );
      }
      return true;
    });

  const handleRowClick = (expense) => {
    navigate(`/expenses/${expense.id}`);
  };

  return (
    <Layout>
      <div className="expense-list-container">
        <div className="expense-list-header">
          <div>
            <h1>Gastos</h1>
            <p className="expense-count">
              {filteredExpenses.length} gastos encontrados
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

        <Card className="filters-card">
          <div className="filters">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por rubro o ST..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="period-filter">
              <Filter size={16} />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="">Todos los periodos</option>
                {periods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.periodo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <Table
            columns={columns}
            data={filteredExpenses}
            isLoading={loading}
            onRowClick={handleRowClick}
            emptyMessage={
              <div className="empty-state">
                <FileText size={48} />
                <h3>No se encontraron gastos</h3>
                <p>Intenta ajustar los filtros o crea un nuevo gasto</p>
              </div>
            }
          />
        </Card>
      </div>
    </Layout>
  );
};

export default ExpenseList;