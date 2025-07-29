import React from "react";
import _ from "lodash";

const PrintSummary = ({ expenses, dateRange, selectedPerson, people, title = "Reporte de Gastos" }) => {
  // Calculate totals 
  const tarjetasTotal = _.sumBy(
    expenses.filter((exp) => !exp.fondosPropios),
    "monto"
  );

  const versatecTotal = _.sumBy(
    expenses.filter((exp) => exp.rubro === "Versatec"),
    "monto"
  );

  const netTotal = tarjetasTotal - versatecTotal;

  const fondosPropiosTotal = _.sumBy(
    expenses.filter((exp) => exp.fondosPropios),
    "monto"
  );

  // Agregar esta función al inicio del componente
  const formatCurrencyWithSymbol = (value, currencySymbol) => {
    return `${currencySymbol}${value.toLocaleString("es-CR")}`;
  };

  // Group expenses by rubro with counts, totals, and associated STs
  const summaryByRubro = _.chain(expenses)
    .groupBy("rubro")
    .map((items, rubro) => ({
      rubro,
      total: _.sumBy(items, "monto"),
      count: items.length,
      sts: _.uniq(items.map(item => item.st)).sort()
    }))
    .orderBy(["total"], ["desc"])
    .value();

  // Helper functions
  const formatCurrency = (value) =>
    value.toLocaleString("es-CR", {
      style: "currency",
      currency: "CRC",
    });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-CR");
  };

  const getPersonName = (email) => {
    if (!email) return "Todos";
    const person = people.find((p) => p.email === email);
    return person ? person.displayName : email;
  };

  return (
    <div className="hidden print:block p-8">
      <div className="text-right text-sm text-gray-500 mb-4">
        {new Date().toLocaleDateString("es-CR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}, {new Date().toLocaleTimeString("es-CR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-sm">
          {dateRange.startDate && dateRange.endDate
            ? `Período: ${formatDate(dateRange.startDate)} - ${formatDate(
              dateRange.endDate
            )}`
            : "Todos los periodos"}
        </p>
        <p className="text-sm">
          Colaborador: {getPersonName(selectedPerson)}
        </p>
        <p className="text-sm">
          Total de gastos: {expenses.length}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border rounded p-4">
          <h3 className="text-sm font-medium">Tarjetas</h3>
          <p className="text-lg font-bold">{formatCurrency(tarjetasTotal)}</p>
        </div>
        <div className="border rounded p-4">
          <h3 className="text-sm font-medium">Versatec</h3>
          <p className="text-lg font-bold">{formatCurrency(versatecTotal)}</p>
        </div>
        <div className="border rounded p-4">
          <h3 className="text-sm font-medium">Total</h3>
          <p className="text-lg font-bold">{formatCurrency(netTotal)}</p>
        </div>
        <div className="border rounded p-4">
          <h3 className="text-sm font-medium">Fondos Propios</h3>
          <p className="text-lg font-bold">
            {formatCurrency(fondosPropiosTotal)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">Detalle por Rubro</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4">Rubro</th>
              <th className="text-center py-2">Cantidad</th>
              <th className="text-right py-2">Total</th>
              <th className="text-left py-2 pl-4">STs</th>
            </tr>
          </thead>
          <tbody>
            {summaryByRubro.map(({ rubro, total, count, sts }) => (
              <tr key={rubro} className="border-b">
                <td className="py-2 pr-4">{rubro}</td>
                <td className="text-center py-2">{count}</td>
                <td className="text-right py-2">{formatCurrency(total)}</td>
                <td className="py-2 pl-4">
                  {sts.length > 0 ? (
                    <span className="text-gray-600">{sts.join(", ")}</span>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="py-2 pr-4">Total</td>
              <td className="text-center py-2">
                {_.sumBy(summaryByRubro, "count")}
              </td>
              <td className="text-right py-2">
                {formatCurrency(_.sumBy(summaryByRubro, "total"))}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {expenses.length > 0 && (
        <div className="mt-12 page-break">
          <h2 className="text-lg font-bold mb-4">Detalle de Gastos</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Fecha</th>
                <th className="text-left py-2">Solicitante</th>
                <th className="text-left py-2">Rubro</th>
                <th className="text-right py-2">Monto</th>
                <th className="text-left py-2">ST</th>
                <th className="text-center py-2">F. Propios</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b">
                  <td className="py-2">{expense.id}</td>
                  <td className="py-2">
                    {expense.fecha.toLocaleDateString("es-CR")}
                  </td>
                  <td className="py-2">{expense.createdBy.name}</td>
                  <td className="py-2">{expense.rubro}</td>
                  <td className="py-2 text-right">
                    {formatCurrencyWithSymbol(expense.monto, expense.currencySymbol)}
                  </td>
                  <td className="py-2">{expense.st}</td>
                  <td className="py-2 text-center">{expense.fondosPropios ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 text-sm text-center">
        Generado el {new Date().toLocaleDateString("es-CR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}
      </div>
    </div>
  );
};

export default PrintSummary;