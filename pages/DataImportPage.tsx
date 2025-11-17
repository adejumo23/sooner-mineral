import React from 'react';
import DataImportComponent from '../components/DataImportComponent';

const DataImportPage: React.FC = () => {
  return (
    <div className="p-6">
      {/* Header with white background and icon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Import</h1>
            <p className="text-gray-600 mt-1">
              Upload CSV or Excel files to import data into the database. The system will automatically detect your columns and help you validate your data before import.
            </p>
          </div>
        </div>
      </div>
      
      <DataImportComponent />
    </div>
  );
};

export default DataImportPage;
