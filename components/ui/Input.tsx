
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input: React.FC<InputProps> = ({ error, className, ...props }) => {
  return (
    <div>
      <input
        {...props}
        className={`w-full px-4 py-2 bg-white border ${error ? 'border-red-400' : 'border-orange-200'} rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200 ${className || ''}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
};

export default Input;
