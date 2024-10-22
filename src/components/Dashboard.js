import React from "react";
import { useAuth } from "./AuthProvider";
import { useAppContext } from "../contexts/AppContext";
import LogoutButton from "./LogoutButton";
import "./Dashboard.css";

function Dashboard() {
  const { user } = useAuth();
  const { periods, expenseReports, departments, roles, loading, error } =
    useAppContext();

  if (loading) {
    return <div className="dashboard-loading">Cargando...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Bienvenido, {user?.name || "Usuario"}!</p>
        <LogoutButton />
      </header>

      <div className="dashboard-content">
        <section className="dashboard-section">
          <h2>Periodos ({periods.length})</h2>
          <ul>
            {periods.map((period) => (
              <li key={period.id}>{period.periodo}</li>
            ))}
          </ul>
        </section>

        <section className="dashboard-section">
          <h2>Reportes de Gastos ({expenseReports.length})</h2>
          <ul>
            {expenseReports.map((report) => (
              <li key={report.id}>
                {report.rubro} - {report.monto} - {report.fecha}
              </li>
            ))}
          </ul>
        </section>

        <section className="dashboard-section">
          <h2>Departamentos ({departments.length})</h2>
          <ul>
            {departments.map((dept) => (
              <li key={dept.id}>{dept.departamento}</li>
            ))}
          </ul>
        </section>

        <section className="dashboard-section">
          <h2>Roles ({roles.length})</h2>
          <ul>
            {roles.map((role) => (
              <li key={role.id}>
                {role.empleado} - Dept ID: {role.departamentoId}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
