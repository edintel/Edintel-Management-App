import { React, memo } from 'react';
import { cn } from '../../utils/cn';

const TableRow = memo(({ row, columns, selectable, isSelected, onSelect, onRowClick }) => {
  const handleClick = (e) => {
    if (e.target.type === 'checkbox') return;
    onRowClick?.(row);
  };

  return (
    <tr
      onClick={handleClick}
      className={cn(
        "border-b border-gray-200 transition-colors",
        onRowClick && "cursor-pointer hover:bg-gray-50",
        isSelected && "bg-primary/5"
      )}
    >
      {selectable && (
        <td className="p-4 align-middle">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            checked={isSelected}
            onChange={(e) => onSelect(row.id, e)}
          />
        </td>
      )}
      {columns.map((column, colIndex) => (
        <td
          key={colIndex}
          className={cn("p-4 align-middle text-sm", column.className)}
        >
          {column.render ? column.render(row[column.key], row) : row[column.key]}
        </td>
      ))}
    </tr>
  );
});

const TableHeader = memo(({ columns, selectable, allSelected, onSelectAll }) => (
  <tr className="border-b border-gray-200">
    {selectable && (
      <th className="h-12 w-12 px-4 text-left align-middle">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          checked={allSelected}
          onChange={onSelectAll}
        />
      </th>
    )}
    {columns.map((column, index) => (
      <th
        key={index}
        className={cn(
          "h-12 px-4 text-left align-middle text-sm font-medium text-gray-500 bg-gray-50",
          column.className
        )}
      >
        {column.header}
      </th>
    ))}
  </tr>
));

const Table = ({
  columns,
  data,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  // New props for selection
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  ...props
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span>Cargando datos...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        {typeof emptyMessage === 'string' ? (
          <span>{emptyMessage}</span>
        ) : (
          emptyMessage
        )}
      </div>
    );
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(data.map(row => row.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (rowId, e) => {
    e.stopPropagation();
    if (selectedRows.includes(rowId)) {
      onSelectionChange(selectedRows.filter(id => id !== rowId));
    } else {
      onSelectionChange([...selectedRows, rowId]);
    }
  };

  return (
    <div className={cn("w-full overflow-auto", className)} {...props}>
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <TableHeader
            columns={columns}
            selectable={selectable}
            allSelected={data.length > 0 && selectedRows.length === data.length}
            onSelectAll={handleSelectAll}
          />
        </thead>
        <tbody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              row={row}
              columns={columns}
              selectable={selectable}
              isSelected={selectedRows.includes(row.id)}
              onSelect={handleSelectRow}
              onRowClick={onRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;