import React from 'react';
import TicketDashboard from '../components/TicketDashboard';
import { useAuth } from '../hooks/useAuth';

const TicketsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <TicketDashboard userRole={user?.role?.name} />
    </div>
  );
};

export default TicketsPage;
