
import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ headers, children }) => {
  return (
    <div className="overflow-x-auto bg-sc-navy rounded-lg border border-sc-light-navy">
      <table className="min-w-full divide-y divide-sc-light-navy">
        <thead className="bg-sc-light-navy/50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-sc-slate uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sc-light-navy">
            {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
