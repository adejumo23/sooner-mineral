
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '../icons/Icons';

interface TableColumn<T> {
  header: string;
  accessor: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortValue?: (item: T) => any; // Custom sort value function
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
  sortField?: keyof T | string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: keyof T | string) => void;
}

const Table = <T extends Record<string, any>>({ 
  data, 
  columns, 
  className,
  sortField,
  sortDirection,
  onSort
}: TableProps<T>) => {
  if (!data || !Array.isArray(data)) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className || ''}`}>
        No data available
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto bg-white rounded-lg border border-sc-light-orange shadow-lg -mx-4 sm:mx-0 ${className || ''}`}>
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full table-auto divide-y divide-sc-light-orange">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((column, index) => {
                const isSortable = column.sortable !== false && onSort;
                const isActiveSort = sortField === column.accessor;
                
                return (
                  <th
                    key={column.header || index}
                    scope="col"
                    className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 ${
                      column.className || ''
                    } ${
                      isSortable ? 'cursor-pointer hover:bg-gray-200 select-none active:bg-gray-300 touch-manipulation' : ''
                    }`}
                    onClick={() => isSortable && onSort(column.accessor)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="truncate">{column.header}</span>
                      {isSortable && (
                        <span className="text-gray-400 flex-shrink-0">
                          {isActiveSort ? (
                            sortDirection === 'asc' ? (
                              <ArrowUpIcon className="h-3 w-3" />
                            ) : (
                              <ArrowDownIcon className="h-3 w-3" />
                            )
                          ) : (
                            <span className="opacity-30 text-xs">⇅</span>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                {columns.map((column, colIndex) => (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-900 ${column.className || ''}`}
                  >
                    <div className={column.className?.includes('whitespace-nowrap') ? 'whitespace-nowrap' : ''}>
                      {column.cell ? column.cell(item) : (item[column.accessor] as React.ReactNode)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
