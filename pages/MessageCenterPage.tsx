import React from 'react';
import { useAuth } from '../hooks/useAuth';
import MessageCenter from '../components/MessageCenter';

const MessageCenterPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access the Message Center.</div>;
  }

  return (
    <div className="p-6">
      <MessageCenter currentUser={user} />
    </div>
  );
};

export default MessageCenterPage;
