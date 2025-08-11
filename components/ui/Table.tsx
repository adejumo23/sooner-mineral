
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
        <thead className="bg-sc-light-orange/30">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.header || index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-sc-dark-gray uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sc-light-orange/50">
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-sc-light-orange/20">
              {columns.map((column, colIndex) => (
                <td
                  key={`${rowIndex}-${colIndex}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-sc-dark-gray"
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
