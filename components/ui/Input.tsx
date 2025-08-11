
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input: React.FC<InputProps> = ({ error, className, ...props }) => {
  return (
    <div>
      <input
        {...props}
        className={`w-full px-4 py-2 bg-sc-light-navy border ${error ? 'border-red-500' : 'border-sc-light-navy'} rounded-md text-sc-light-slate placeholder-sc-slate focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-sc-blue transition duration-200 ${className || ''}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
