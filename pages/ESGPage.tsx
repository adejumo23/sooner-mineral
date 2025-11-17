import React from 'react';
import ESGDashboard from '../components/ESGDashboard';
import { useAuth } from '../hooks/useAuth';

const ESGPage: React.FC = () => {
  const { user: currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Please log in to access ESG tracking.</div>
      </div>
    );
  }

  return <ESGDashboard currentUser={currentUser} />;
};

export default ESGPage;
