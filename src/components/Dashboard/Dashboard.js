// src/components/Dashboard/Dashboard.js
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../contexts/AppContext";
import Layout from "../layout/Layout";
import Card from "../common/Card";
import Table from "../common/Table";
import Button from "../common/Button";
import { Plus, FileText, Check, AlertTriangle, X } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { periods, expenseReports, loading, error } = useAppContext();

  const currentPeriod = periods[periods.length - 1] || {};

  const currentPeriodExpenses = expenseReports.filter(
    (expense) => expense.periodoId === currentPeriod.id
  );

  const recentExpenses = [...expenseReports]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, 5);

  const expenseColumns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (value) =>
        value.toLocaleDateString("es-CR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    { key: "rubro", header: "Rubro" },
    {
      key: "monto",
      header: "Monto",
      render: (value) =>
        value.toLocaleString("es-CR", {
          style: "currency",
          currency: "CRC",
        }),
    },
    { key: "st", header: "ST" },
    {
      key: "status",
      header: "Estado",
      render: (_, row) => {
        if (row.aprobacionAsistente === "No aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
              No aprobada
            </span>
          );
        }
        if (row.aprobacionContabilidad === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
              Aprobado
            </span>
          );
        }
        if (row.aprobacionJefatura === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
              En Contabilidad
            </span>
          );
        }
        if (row.aprobacionAsistente === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
              En Jefatura
            </span>
          );
        }
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            Pendiente
          </span>
        );
      },
    },
  ];

  const stats = [
    {
      title: "Total Gastos",
      value: currentPeriodExpenses
        .reduce((sum, report) => sum + parseFloat(report.monto), 0)
        .toLocaleString("es-CR", { style: "currency", currency: "CRC" }),
      icon: <FileText className="text-primary" size={24} />,
    },
    {
      title: "Pendientes",
      value: currentPeriodExpenses.filter(
        (report) => report.aprobacionAsistente === "Pendiente"
      ).length,
      icon: <AlertTriangle className="text-warning" size={24} />,
    },
    {
      title: "Aprobados",
      value: currentPeriodExpenses.filter(
        (report) => report.aprobacionContabilidad === "Aprobada"
      ).length,
      icon: <Check className="text-success" size={24} />,
    },
    {
      title: "No Aprobados",
      value: currentPeriodExpenses.filter(
        (report) => report.aprobacionAsistente === "No aprobada"
      ).length,
      icon: <X className="text-error" size={24} />,
    },
  ];

  const handleExpenseClick = (expense) => {
    navigate(`/expenses/${expense.id}`, {
      state: { from: location },
    });
  };

  const handleViewAllExpenses = () => {
    navigate("/expenses");
  };

  const handleNewExpense = () => {
    navigate("/expenses/new", {
      state: { from: location },
    });
  };

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-8 text-error">
          <AlertTriangle size={48} className="mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Error al cargar los datos
          </h2>
          <p>{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Periodo actual: {currentPeriod.periodo || "Cargando..."}
            </p>
          </div>
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={handleNewExpense}
          >
            Nuevo Gasto
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">{stat.icon}</div>
                <div>
                  <h3 className="text-sm text-gray-600">{stat.title}</h3>
                  <p className="text-xl font-semibold mt-1">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card
          title="Gastos Recientes"
          subtitle={`Últimos ${recentExpenses.length} gastos registrados`}
          action={
            <Button
              variant="outline"
              size="small"
              onClick={handleViewAllExpenses}
            >
              Ver todos
            </Button>
          }
        >
          <Table
            columns={expenseColumns}
            data={recentExpenses}
            isLoading={loading}
            onRowClick={handleExpenseClick}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-12">
                <FileText size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No se encontraron gastos
                </h3>
                <p className="text-sm text-gray-500">
                  Intenta ajustar los filtros o crea un nuevo gasto
                </p>
              </div>
            }
          />
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
