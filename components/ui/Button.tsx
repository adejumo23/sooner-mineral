
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClasses = {
    primary: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 text-white',
    secondary: 'bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-400 text-gray-900',
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white',
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className || ''}`}
    />
  );
};

export default Button;
