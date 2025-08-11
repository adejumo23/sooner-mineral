
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-white transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sc-navy';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClasses = {
    primary: 'bg-sc-blue hover:bg-sc-light-blue focus:ring-sc-blue',
    secondary: 'bg-sc-light-navy hover:bg-slate-600 focus:ring-sc-light-navy',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-600',
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    />
  );
};

export default Button;
