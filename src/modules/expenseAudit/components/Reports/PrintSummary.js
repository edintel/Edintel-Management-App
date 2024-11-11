import React from "react";
import _ from "lodash";

const PrintSummary = ({ expenses, dateRange, selectedPerson, people }) => {
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

  // Group expenses by rubro
  const summaryByRubro = _.chain(expenses)
    .groupBy("rubro")
    .map((items, rubro) => ({
      rubro,
      total: _.sumBy(items, "monto"),
      count: items.length,
    }))
    .orderBy(["total"], ["desc"])
    .value();

  // Format currency
  const formatCurrency = (value) =>
    value.toLocaleString("es-CR", {
      style: "currency",
      currency: "CRC",
    });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-CR");
  };

  // Get person name from email
  const getPersonName = (email) => {
    if (!email) return "Todos";
    const person = people.find((p) => p.email === email);
    return person ? person.displayName : email;
  };

  return (
    <div className="hidden print:block p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Reporte de Gastos</h1>
        <p className="text-sm text-gray-600">
          {dateRange.startDate && dateRange.endDate
            ? `Período: ${formatDate(dateRange.startDate)} - ${formatDate(
                dateRange.endDate
              )}`
            : "Todos los períodos"}
        </p>
        <p className="text-sm text-gray-600">
          Colaborador: {getPersonName(selectedPerson)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border rounded p-4">
          <h3 className="text-sm font-medium text-gray-500">Tarjetas</h3>
          <p className="text-lg font-bold">{formatCurrency(tarjetasTotal)}</p>
        </div>
        <div className="border rounded p-4">
          <h3 className="text-sm font-medium text-gray-500">Versatec</h3>
          <p className="text-lg font-bold">{formatCurrency(versatecTotal)}</p>
        </div>
        <div className="border rounded p-4">
          <h3 className="text-sm font-medium text-gray-500">Total</h3>
          <p className="text-lg font-bold">{formatCurrency(netTotal)}</p>
        </div>
        <div className="border rounded p-4">
          <h3 className="text-sm font-medium text-gray-500">Fondos Propios</h3>
          <p className="text-lg font-bold">
            {formatCurrency(fondosPropiosTotal)}
          </p>
        </div>
      </div>

      {/* Detailed Table */}
      <div>
        <h2 className="text-lg font-bold mb-4">Detalle por Rubro</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">Rubro</th>
              <th className="text-right py-2 font-medium">Cantidad</th>
              <th className="text-right py-2 font-medium">Total</th>
              <th className="text-right py-2 font-medium">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {summaryByRubro.map(({ rubro, total, count }) => (
              <tr key={rubro} className="border-b">
                <td className="py-2">{rubro}</td>
                <td className="text-right py-2">{count}</td>
                <td className="text-right py-2">{formatCurrency(total)}</td>
                <td className="text-right py-2">
                  {formatCurrency(total / count)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <td className="py-2">Total</td>
              <td className="text-right py-2">
                {_.sumBy(summaryByRubro, "count")}
              </td>
              <td className="text-right py-2">
                {formatCurrency(_.sumBy(summaryByRubro, "total"))}
              </td>
              <td className="text-right py-2">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-8 text-sm text-gray-500 text-center">
        <p>
          Generado el{" "}
          {new Date().toLocaleDateString("es-CR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

export default PrintSummary;
