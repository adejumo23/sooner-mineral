
import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { LogoutIcon } from '../icons/Icons';
import Button from '../ui/Button';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-orange-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <header className="flex justify-end items-center h-20 px-8 bg-white border-b border-orange-200 shadow-sm">
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-700">{user?.role.name}</p>
                </div>
                 <button 
                   onClick={logout} 
                   className="p-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                   style={{ backgroundColor: '#fbbf24' }}
                 >
                    <LogoutIcon className="h-5 w-5"/>
                 </button>
            </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
