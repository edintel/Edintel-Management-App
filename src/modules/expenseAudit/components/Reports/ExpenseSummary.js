import React from "react";
import _ from "lodash";
import Card from "../../../../components/common/Card";
import PrintSummary from "./PrintSummary";

const ExpenseSummary = ({ expenses }) => {
  // Calculate total expenses excluding fondos propios
  const tarjetasTotal = _.sumBy(
    expenses.filter((exp) => !exp.fondosPropios),
    "monto"
  );

  // Calculate total Versatec expenses
  const versatecTotal = _.sumBy(
    expenses.filter((exp) => exp.rubro === "Versatec"),
    "monto"
  );

  // Calculate net total (Tarjetas - Versatec)
  const netTotal = tarjetasTotal - versatecTotal;

  // Calculate fondos propios total
  const fondosPropiosTotal = _.sumBy(
    expenses.filter((exp) => exp.fondosPropios),
    "monto"
  );

  // Group expenses by rubro and calculate total
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

  <PrintSummary
    expenses={expenses}
    dateRange={{ startDate: null, endDate: null }}
    selectedPerson={null}
    people={[]}
  />;

  return (
    <Card className="mb-6">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Tarjetas</h3>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(tarjetasTotal)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Versatec</h3>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(versatecTotal)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Total</h3>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(netTotal)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Fondos Propios</h3>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(fondosPropiosTotal)}
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Detalle por Rubro</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-500">
                  Rubro
                </th>
                <th className="text-right py-2 font-medium text-gray-500">
                  Cantidad
                </th>
                <th className="text-right py-2 font-medium text-gray-500">
                  Total
                </th>
                <th className="text-right py-2 font-medium text-gray-500">
                  Promedio
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryByRubro.map(({ rubro, total, count }) => (
                <tr key={rubro} className="border-b border-gray-100">
                  <td className="py-2">{rubro}</td>
                  <td className="text-right py-2">{count}</td>
                  <td className="text-right py-2">{formatCurrency(total)}</td>
                  <td className="text-right py-2">
                    {formatCurrency(total / count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default ExpenseSummary;
