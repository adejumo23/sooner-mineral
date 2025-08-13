
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <Card>
        <h2 className="text-2xl font-semibold text-gray-900">Welcome, {user?.name}!</h2>
        <p className="mt-2 text-gray-800">
          You are logged in as a(n) <span className="font-bold text-orange-600">{user?.role.name}</span>.
        </p>
        <p className="mt-4 text-gray-800">
          Use the navigation on the left to manage users, roles, and privileges within the Sooner Capital system.
        </p>
        <div className="mt-6 border-t border-orange-200 pt-4">
            <p className="text-sm text-gray-700">This portal is your central hub for administrative tasks related to the land management application.</p>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
