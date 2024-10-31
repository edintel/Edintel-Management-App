import React, { useState, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import Layout from '../layout/Layout';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import { Filter, Search, Users, FileDown, Printer, Copy } from 'lucide-react';

const Reports = () => {
  const { expenseReports, periods, departmentWorkers, loading } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const tableRef = useRef(null);

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
      key: 'status',
      header: 'Estado',
      render: (_, row) => {
        if (row.aprobacionAsistente === "No aprobada" || 
            row.aprobacionJefatura === "No aprobada" || 
            row.aprobacionContabilidad === "No aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
              No aprobada
            </span>
          );
        }
        if (row.aprobacionAsistente === "Aprobada" && 
            row.aprobacionJefatura === "Aprobada" && 
            row.aprobacionContabilidad === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
              Aprobado
            </span>
          );
        }
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            En proceso
          </span>
        );
      }
    }
  ];

  const getExpenseStatus = (expense) => {
    if (expense.aprobacionAsistente === "No aprobada" || 
        expense.aprobacionJefatura === "No aprobada" || 
        expense.aprobacionContabilidad === "No aprobada") {
      return "No aprobada";
    }
    if (expense.aprobacionAsistente === "Aprobada" && 
        expense.aprobacionJefatura === "Aprobada" && 
        expense.aprobacionContabilidad === "Aprobada") {
      return "Aprobada";
    }
    return "En proceso";
  };

  const filteredExpenses = expenseReports.filter(expense => {
    if (selectedPeriod && expense.periodoId !== selectedPeriod) return false;
    if (selectedPerson && expense.createdBy.email !== selectedPerson) return false;
    if (selectedStatus) {
      const status = getExpenseStatus(expense);
      if (status !== selectedStatus) return false;
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        expense.rubro.toLowerCase().includes(search) ||
        expense.st.toLowerCase().includes(search) ||
        expense.createdBy.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const people = departmentWorkers.reduce((acc, dept) => {
    dept.workers.forEach(worker => {
      if (worker.empleado && !acc.some(p => p.email === worker.empleado.email)) {
        acc.push(worker.empleado);
      }
    });
    return acc;
  }, []);

  const handleCopyTable = () => {
    const rows = filteredExpenses.map(expense => ({
      Fecha: expense.fecha.toLocaleDateString('es-CR'),
      Solicitante: expense.createdBy.name,
      Rubro: expense.rubro,
      Monto: expense.monto.toLocaleString('es-CR', { style: 'currency', currency: 'CRC' }),
      ST: expense.st,
      Estado: getExpenseStatus(expense)
    }));

    const headers = ['Fecha', 'Solicitante', 'Rubro', 'Monto', 'ST', 'Estado'];
    const csv = [
      headers.join('\t'),
      ...rows.map(row => headers.map(header => row[header]).join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(csv);
  };

  const handleExportCSV = () => {
    const rows = filteredExpenses.map(expense => ({
      Fecha: expense.fecha.toLocaleDateString('es-CR'),
      Solicitante: expense.createdBy.name,
      Rubro: expense.rubro,
      Monto: expense.monto,
      ST: expense.st,
      Estado: getExpenseStatus(expense)
    }));

    const headers = ['Fecha', 'Solicitante', 'Rubro', 'Monto', 'ST', 'Estado'];
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"`
          : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'reporte_gastos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredExpenses.length} gastos encontrados
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="small"
              startIcon={<Copy size={16} />}
              onClick={handleCopyTable}
            >
              Copiar
            </Button>
            <Button
              variant="outline"
              size="small"
              startIcon={<FileDown size={16} />}
              onClick={handleExportCSV}
            >
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="small"
              startIcon={<Printer size={16} />}
              onClick={handlePrint}
            >
              Imprimir
            </Button>
          </div>
        </div>

        <Card className="mb-6">
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

            <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
              <Filter size={16} className="text-gray-400 mr-2" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="En proceso">En proceso</option>
                <option value="Aprobada">Aprobadas</option>
                <option value="No aprobada">No aprobadas</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div ref={tableRef} className="print:shadow-none">
            <Table
              columns={columns}
              data={filteredExpenses}
              isLoading={loading}
              emptyMessage={
                <div className="flex flex-col items-center justify-center py-12">
                  <FileDown size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No se encontraron gastos
                  </h3>
                  <p className="text-sm text-gray-500">
                    Intenta ajustar los filtros para ver más resultados
                  </p>
                </div>
              }
            />
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;