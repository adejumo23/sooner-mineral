
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-white transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sc-warm-cream';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClasses = {
    primary: 'bg-sc-orange hover:bg-sc-dark-orange focus:ring-sc-orange',
    secondary: 'bg-sc-medium-gray hover:bg-sc-dark-gray focus:ring-sc-medium-gray',
    danger: 'bg-sc-red hover:bg-sc-dark-red focus:ring-sc-red',
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    />
  );
};

export default Button;
