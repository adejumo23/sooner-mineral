import React from 'react';
import { useAuth } from '../hooks/useAuth';
import MappingDashboard from '../components/MappingDashboard';

const MappingPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access the Mapping Dashboard.</div>;
  }

  return <MappingDashboard currentUser={user} />;
};

export default MappingPage;
