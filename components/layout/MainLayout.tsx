
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
    <div className="flex h-screen bg-sc-dark-blue">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <header className="flex justify-end items-center h-20 px-8 bg-sc-navy/50 backdrop-blur-sm border-b border-sc-light-navy">
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-sc-slate">{user?.role.name}</p>
                </div>
                 <Button onClick={logout} variant="secondary" className="!p-2">
                    <LogoutIcon className="h-5 w-5"/>
                 </Button>
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
