
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
  /** When provided, columns can be resized. Widths keyed by accessor. */
  columnWidths?: Record<string, number>;
  /** Callback when user starts resizing a column (e.g. mouse down on resizer). */
  onResizeStart?: (e: React.MouseEvent, accessor: string, currentWidth: number) => void;
  /** Accessor of the column currently being resized (for highlight). */
  resizingColumn?: string | null;
  /** Resolve width for a column (used when columnWidths is set). Default 150. */
  getColumnWidth?: (accessor: string) => number;
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  className,
  sortField,
  sortDirection,
  onSort,
  columnWidths,
  onResizeStart,
  resizingColumn,
  getColumnWidth
}: TableProps<T>) => {
  const isResizable = Boolean(columnWidths && onResizeStart);
  const getWidth = getColumnWidth ?? (() => 150);

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
        <table className="min-w-full table-auto divide-y divide-sc-light-orange" style={isResizable ? { tableLayout: 'fixed' } : undefined}>
          <thead className="bg-gray-100">
            <tr>
              {columns.map((column, index) => {
                const accessor = String(column.accessor);
                const isSortable = column.sortable !== false && onSort;
                const isActiveSort = sortField === column.accessor;
                const width = isResizable ? getWidth(accessor) : undefined;
                const isResizing = isResizable && resizingColumn === accessor;
                return (
                  <th
                    key={column.header || index}
                    scope="col"
                    style={width != null ? { width, minWidth: width, maxWidth: width } : undefined}
                    className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 ${
                      column.className || ''
                    } ${isResizable ? 'relative' : ''} ${
                      isSortable ? 'cursor-pointer hover:bg-gray-200 select-none active:bg-gray-300 touch-manipulation' : ''
                    }`}
                    onClick={(e) => {
                      if (isSortable && (!isResizable || !(e.target as HTMLElement).classList?.contains('column-resizer'))) {
                        onSort(column.accessor);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1 truncate">
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
                    {isResizable && (
                      <div
                        className={`column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onResizeStart(e, accessor, width ?? getWidth(accessor));
                        }}
                        title="Drag to resize"
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                {columns.map((column, colIndex) => {
                  const accessor = String(column.accessor);
                  const width = isResizable ? getWidth(accessor) : undefined;
                  return (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      style={width != null ? { width, minWidth: width, maxWidth: width } : undefined}
                      className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-900 ${column.className || ''}`}
                    >
                      <div className={`truncate ${column.className?.includes('whitespace-nowrap') ? 'whitespace-nowrap' : ''}`}>
                        {column.cell ? column.cell(item) : (item[column.accessor] as React.ReactNode)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
