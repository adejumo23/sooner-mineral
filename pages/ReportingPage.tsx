import React from 'react';
import ReportingDashboard from '../components/ReportingDashboard';
import { useAuth } from '../hooks/useAuth';

const ReportingPage: React.FC = () => {
  const { user: currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access reporting.</p>
        </div>
      </div>
    );
  }

  return <ReportingDashboard currentUser={currentUser} />;
};

export default ReportingPage;
