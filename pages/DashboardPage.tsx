
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
      <Card>
        <h2 className="text-2xl font-semibold text-sc-light-slate">Welcome, {user?.name}!</h2>
        <p className="mt-2 text-sc-slate">
          You are logged in as a(n) <span className="font-bold text-sc-light-blue">{user?.role.name}</span>.
        </p>
        <p className="mt-4 text-sc-slate">
          Use the navigation on the left to manage users, roles, and privileges within the Sooner Capital system.
        </p>
        <div className="mt-6 border-t border-sc-light-navy pt-4">
            <p className="text-sm text-sc-slate">This portal is your central hub for administrative tasks related to the land management application.</p>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
