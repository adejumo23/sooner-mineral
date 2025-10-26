import * as React from 'react';
import type { User } from '../types';
import MessageCenter from '../components/MessageCenter';
import { useAuth } from '../hooks/useAuth';

const MessageCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);

  // Load users for the communication system
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('http://localhost:3051/api/users');
        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access the Message Center.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MessageCenter currentUser={user} users={users} />
    </div>
  );
};

export default MessageCenterPage;