
import React, { Fragment } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-sc-navy rounded-lg shadow-xl w-full max-w-md border border-sc-light-navy">
        <div className="flex justify-between items-center p-4 border-b border-sc-light-navy">
          <h2 className="text-xl font-semibold text-sc-light-slate">{title}</h2>
          <button onClick={onClose} className="text-sc-slate hover:text-white transition">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
