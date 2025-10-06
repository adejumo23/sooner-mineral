
import React from 'react';

interface TableColumn<T> {
  header: string;
  accessor: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
}

const Table = <T extends Record<string, any>>({ data, columns, className }: TableProps<T>) => {
  if (!data || !Array.isArray(data)) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className || ''}`}>
        No data available
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto bg-white rounded-lg border border-sc-light-orange shadow-lg ${className || ''}`}>
      <table className="min-w-full divide-y divide-sc-light-orange">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.header || index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
              {columns.map((column, colIndex) => (
                <td
                  key={`${rowIndex}-${colIndex}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.cell ? column.cell(item) : (item[column.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
