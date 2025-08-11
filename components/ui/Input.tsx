
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input: React.FC<InputProps> = ({ error, className, ...props }) => {
  return (
    <div>
      <input
        {...props}
        className={`w-full px-4 py-2 bg-white border ${error ? 'border-sc-red' : 'border-sc-light-orange'} rounded-md text-sc-dark-gray placeholder-sc-medium-gray focus:outline-none focus:ring-2 focus:ring-sc-orange focus:border-sc-orange transition duration-200 ${className || ''}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
