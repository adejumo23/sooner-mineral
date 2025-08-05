
import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.FC<InputProps> = (props) => {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2 bg-sc-light-navy border border-sc-light-navy rounded-md text-sc-light-slate placeholder-sc-slate focus:outline-none focus:ring-2 focus:ring-sc-blue focus:border-sc-blue transition duration-200 ${props.className}`}
    />
  );
};

export default Input;
