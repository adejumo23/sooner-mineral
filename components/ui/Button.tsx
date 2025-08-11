
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-white transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-50';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-neutral-500 hover:bg-neutral-600 focus:ring-neutral-500',
    danger: 'bg-accent-500 hover:bg-accent-600 focus:ring-accent-500',
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    />
  );
};

export default Button;
