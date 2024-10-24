// src/components/Approvals/ApprovalList.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import { Check, X, Eye, Filter, Search } from 'lucide-react';
import './ApprovalList.css';

const ApprovalList = () => {
  const navigate = useNavigate();
  const { expenseReports, periods, loading } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('pending'); // pending, approved, rejected

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
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="small"
            startIcon={<Eye size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/expenses/${row.id}`);
            }}
          >
            Ver
          </Button>
          {viewMode === 'pending' && (
            <>
              <Button
                variant="primary"
                size="small"
                startIcon={<Check size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(row.id);
                }}
              >
                Aprobar
              </Button>
              <Button
                variant="secondary"
                size="small"
                startIcon={<X size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(row.id);
                }}
              >
                Rechazar
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const handleApprove = (id) => {
    // Implementation will be added later
    console.log('Aprobar:', id);
  };

  const handleReject = (id) => {
    // Implementation will be added later
    console.log('Rechazar:', id);
  };

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
      switch (viewMode) {
        case 'pending':
          return !expense.aprobacionAsistente;
        case 'approved':
          return expense.aprobacionAsistente && !expense.aprobacionJefatura;
        case 'rejected':
          return false; // To be implemented
        default:
          return true;
      }
    });

  return (
    <Layout>
      <div className="approval-list-container">
        <div className="approval-list-header">
          <div>
            <h1>Aprobaciones</h1>
            <p className="approval-count">
              {filteredExpenses.length} gastos pendientes de aprobación
            </p>
          </div>
        </div>

        <Card className="filters-card">
          <div className="filters">
            <div className="view-modes">
              <button
                className={`view-mode-button ${viewMode === 'pending' ? 'active' : ''}`}
                onClick={() => setViewMode('pending')}
              >
                Pendientes
              </button>
              <button
                className={`view-mode-button ${viewMode === 'approved' ? 'active' : ''}`}
                onClick={() => setViewMode('approved')}
              >
                Aprobados
              </button>
              <button
                className={`view-mode-button ${viewMode === 'rejected' ? 'active' : ''}`}
                onClick={() => setViewMode('rejected')}
              >
                Rechazados
              </button>
            </div>

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
            emptyMessage={
              <div className="empty-state">
                <Check size={48} />
                <h3>No hay gastos pendientes</h3>
                <p>Todos los gastos han sido procesados</p>
              </div>
            }
          />
        </Card>
      </div>
    </Layout>
  );
};

export default ApprovalList;