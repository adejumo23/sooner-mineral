import React, { useState, useEffect } from 'react';
import DocumentGenerationDashboard from '../components/DocumentGenerationDashboard';
import { fetchUsers } from '../services/api';
import type { User } from '../types';

const DocumentGenerationPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const users = await fetchUsers();
        // In a real app, this would come from authentication context
        setCurrentUser(users[0]);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <DocumentGenerationDashboard currentUser={currentUser} />;
};

export default DocumentGenerationPage;
