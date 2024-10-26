import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import { Check, X, Eye, Filter, Search, Users } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ApprovalList = () => {
  const navigate = useNavigate();
  const { expenseReports, periods, departmentWorkers, loading } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('pending');
  const location = useLocation();

  const columns = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (value) => value.toLocaleDateString('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    { 
      key: 'createdBy', 
      header: 'Solicitante',
      render: (value) => value?.name || 'N/A'
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="small"
            className="text-gray-600 hover:text-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row);
            }}
          >
            <Eye size={16} />
          </Button>
          {viewMode === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="small"
                className="text-success hover:text-success/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(row.id);
                }}
              >
                <Check size={16} />
              </Button>
              <Button
                variant="ghost"
                size="small"
                className="text-error hover:text-error/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(row.id);
                }}
              >
                <X size={16} />
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

  const handleRowClick = (expense) => {
    navigate(`/expenses/${expense.id}`, { 
      state: { from: location }
    });
  };

  const people = departmentWorkers.reduce((acc, dept) => {
    dept.workers.forEach(worker => {
      if (worker.empleado && !acc.some(p => p.email === worker.empleado.email)) {
        acc.push(worker.empleado);
      }
    });
    return acc;
  }, []);

  const filteredExpenses = expenseReports
    .filter(expense => {
      if (selectedPeriod && expense.periodoId !== selectedPeriod) return false;
      
      if (selectedPerson && expense.createdBy.email !== selectedPerson) return false;
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          expense.rubro.toLowerCase().includes(search) ||
          expense.st.toLowerCase().includes(search) ||
          expense.createdBy.name.toLowerCase().includes(search)
        );
      }

      switch (viewMode) {
        case 'pending':
          return expense.aprobacionAsistente === "Pendiente";
        case 'approved':
          return expense.aprobacionAsistente === "Aprobada";
        case 'rejected':
          return expense.aprobacionAsistente === "No aprobada";
        default:
          return true;
      }
    });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Aprobaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredExpenses.length} gastos {
              viewMode === 'pending' ? 'pendientes de aprobación' :
              viewMode === 'approved' ? 'aprobados' : 'rechazados'
            }
          </p>
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <div className="flex border-b border-gray-200">
              {['pending', 'approved', 'rejected'].map((mode) => (
                <button
                  key={mode}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    viewMode === mode
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === 'pending' && 'Pendientes'}
                  {mode === 'approved' && 'Aprobados'}
                  {mode === 'rejected' && 'Rechazados'}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 p-4">
              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
                <Search size={16} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar por rubro, ST o solicitante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-sm"
                />
              </div>

              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
                <Filter size={16} className="text-gray-400 mr-2" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-sm"
                >
                  <option value="">Todos los periodos</option>
                  {periods.map(period => (
                    <option key={period.id} value={period.id}>
                      {period.periodo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
                <Users size={16} className="text-gray-400 mr-2" />
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-sm"
                >
                  <option value="">Todos los solicitantes</option>
                  {people.map(person => (
                    <option key={person.id} value={person.email}>
                      {person.displayName}
                    </option>
                  ))}
                </select>
              </div>
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
              <div className="flex flex-col items-center justify-center py-12">
                <Check size={48} className="text-success mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {viewMode === 'pending' 
                    ? 'No hay gastos pendientes'
                    : viewMode === 'approved'
                    ? 'No hay gastos aprobados'
                    : 'No hay gastos rechazados'
                  }
                </h3>
                <p className="text-sm text-gray-500">
                  {viewMode === 'pending'
                    ? 'Todos los gastos han sido procesados'
                    : viewMode === 'approved'
                    ? 'Aún no hay gastos aprobados'
                    : 'Aún no hay gastos rechazados'
                  }
                </p>
              </div>
            }
          />
        </Card>
      </div>
    </Layout>
  );
};

export default ApprovalList;