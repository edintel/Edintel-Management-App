import React from 'react';
import _ from 'lodash';
import Card from '../common/Card';

const ExpenseSummary = ({ expenses }) => {
  // Group expenses by rubro and calculate total
  const summaryByRubro = _.chain(expenses)
    .groupBy('rubro')
    .map((items, rubro) => ({
      rubro,
      total: _.sumBy(items, 'monto'),
      count: items.length
    }))
    .orderBy(['total'], ['desc'])
    .value();

  // Format currency
  const formatCurrency = (value) => 
    value.toLocaleString('es-CR', {
      style: 'currency',
      currency: 'CRC'
    });

  return (
    <Card 
      title="Resumen por Rubro" 
      subtitle={`Total de gastos: ${formatCurrency(_.sumBy(expenses, 'monto'))}`}
      className="mb-6"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-500">Rubro</th>
              <th className="text-right py-2 font-medium text-gray-500">Cantidad</th>
              <th className="text-right py-2 font-medium text-gray-500">Total</th>
              <th className="text-right py-2 font-medium text-gray-500">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {summaryByRubro.map(({ rubro, total, count }) => (
              <tr key={rubro} className="border-b border-gray-100">
                <td className="py-2">{rubro}</td>
                <td className="text-right py-2">{count}</td>
                <td className="text-right py-2">{formatCurrency(total)}</td>
                <td className="text-right py-2">{formatCurrency(total / count)}</td>
              </tr>
            ))}
            <tr className="font-medium bg-gray-50">
              <td className="py-2">Total</td>
              <td className="text-right py-2">{_.sumBy(summaryByRubro, 'count')}</td>
              <td className="text-right py-2">{formatCurrency(_.sumBy(summaryByRubro, 'total'))}</td>
              <td className="text-right py-2">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ExpenseSummary;