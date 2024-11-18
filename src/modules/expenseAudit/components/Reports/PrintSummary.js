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

  // Group expenses by rubro and include STs
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
        <h1 className="text-2xl font-bold mb-2">Reporte de Gastos</h1>
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
              <th className="text-left py-2 pl-4">Total/STs</th>
            </tr>
          </thead>
          <tbody>
            {summaryByRubro.map(({ rubro, total, count, sts }) => (
              <tr key={rubro} className="border-b">
                <td className="py-2 pr-4">{rubro}</td>
                <td className="text-center py-2">{count}</td>
                <td className="py-2 pl-4">
                  {formatCurrency(total)}
                  {sts.length > 0 && (
                    <span className="ml-2 text-gray-600">{sts.join(", ")}</span>
                  )}
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
              <td className="py-2 pl-4">
                {formatCurrency(_.sumBy(summaryByRubro, "total"))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

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