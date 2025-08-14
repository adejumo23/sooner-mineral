import React, { useState, useEffect } from 'react';
import ESGDashboard from '../components/ESGDashboard';
import { fetchUsers } from '../services/api';
import type { User } from '../types';

const ESGPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const users = await fetchUsers();
        setCurrentUser(users[0]); // Use first user as current user for demo
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return <ESGDashboard currentUser={currentUser} />;
};

export default ESGPage;
