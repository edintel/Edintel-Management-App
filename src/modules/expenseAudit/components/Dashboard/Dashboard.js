import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useExpenseAudit } from "../../context/expenseAuditContext";
import { useAuth } from "../../../../components/AuthProvider";
import Card from "../../../../components/common/Card";
import Table from "../../../../components/common/Table";
import Button from "../../../../components/common/Button";
import { Plus, FileText, Check, AlertTriangle, X } from "lucide-react";
import { EXPENSE_AUDIT_ROUTES } from "../../routes";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { expenseReports, loading, error, approvalFlowService } = useExpenseAudit();
  const { user } = useAuth();

  // Define date range for the dashboard (last 7 days)
  const getLastWeekRange = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    return { start: lastWeek, end: today };
  };

  const { start: lastWeekStart, end: lastWeekEnd } = getLastWeekRange();

  // Filter expenses for the current user
  const userExpenses = expenseReports.filter(
    (expense) => expense.createdBy.email === user?.username
  );

  // Filter for expenses created in the last week
  const currentWeekExpenses = userExpenses.filter((expense) => {
    const expenseDate = new Date(expense.fecha);
    return expenseDate >= lastWeekStart && expenseDate <= lastWeekEnd;
  });

  // Get recent expenses (last 5)
  const recentExpenses = [...userExpenses]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, 5);

  // Table columns configuration
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
      render: (value, row) => `${row.currencySymbol || "₡"}${value}`,
    },
    { key: "st", header: "ST" },
    {
      key: "status",
      header: "Estado",
      render: (_, row) => {
        // Check for rejection first
        if (row.aprobacionAsistente === "No aprobada" ||
          row.aprobacionJefatura === "No aprobada" ||
          row.aprobacionContabilidad === "No aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
              No aprobada
            </span>
          );
        }

        // Check for full approval
        if (row.aprobacionContabilidad === "Aprobada") {
          return (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
              Aprobado
            </span>
          );
        }

        // Check for partially approved statuses
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

        // Default to pending
        return (
          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            Pendiente
          </span>
        );
      },
    },
  ];

  // Calculate dashboard statistics
  const stats = [
    {
      title: "Total Gastos",
      value: currentWeekExpenses
        .reduce((sum, report) => sum + parseFloat(report.monto), 0)
        .toLocaleString("es-CR", { style: "currency", currency: "CRC" }),
      icon: <FileText className="text-primary" size={24} />,
    },
    {
      title: "Pendientes",
      value: currentWeekExpenses.filter(
        (report) => approvalFlowService &&
          !approvalFlowService.getApprovalState(report).isFullyApproved &&
          !approvalFlowService.getApprovalState(report).isRejected
      ).length,
      icon: <AlertTriangle className="text-warning" size={24} />,
    },
    {
      title: "Aprobados",
      value: currentWeekExpenses.filter(
        (report) => approvalFlowService &&
          approvalFlowService.getApprovalState(report).isFullyApproved
      ).length,
      icon: <Check className="text-success" size={24} />,
    },
    {
      title: "No Aprobados",
      value: currentWeekExpenses.filter(
        (report) => approvalFlowService &&
          approvalFlowService.getApprovalState(report).isRejected
      ).length,
      icon: <X className="text-error" size={24} />,
    },
  ];

  const handleExpenseClick = (expense) => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.DETAIL(expense.id), {
      state: { from: location },
    });
  };

  const handleViewAllExpenses = () => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.LIST);
  };

  const handleNewExpense = () => {
    navigate(EXPENSE_AUDIT_ROUTES.EXPENSES.NEW, {
      state: { from: location },
    });
  };

  // Show error state if necessary
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-error">
        <AlertTriangle size={48} className="mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Error al cargar los datos
        </h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Últimos 7 días: {lastWeekStart.toLocaleDateString("es-CR")} -{" "}
            {lastWeekEnd.toLocaleDateString("es-CR")}
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
        title="Mis Gastos Recientes"
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
  );
};

export default Dashboard;