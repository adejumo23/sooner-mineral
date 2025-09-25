import React from 'react';
import DataImportComponent from '../components/DataImportComponent';

const DataImportPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Import</h1>
        <p className="mt-2 text-gray-600">
          Upload CSV or Excel files to import data into the database. Files will be validated and staged before production import.
        </p>
      </div>
      
      <DataImportComponent />
    </div>
  );
};

export default DataImportPage;
