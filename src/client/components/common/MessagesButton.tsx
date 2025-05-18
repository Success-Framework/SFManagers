import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from 'react-bootstrap';
import axios from 'axios';

interface MessagesButtonProps {
  token?: string | null;
}

const MessagesButton: React.FC<MessagesButtonProps> = ({ token }) => {
  const navigate = useNavigate();
  const [messageCount, setMessageCount] = useState(0);

  // Handle opening the chat
  const handleOpenGroupChat = () => {
    navigate('/group-chat');
  };

  return (
    <>
      {/* Combined Messages Dropdown */}
      <div className="mx-2 position-relative dropdown">
        <Button 
          variant="primary" 
          className="messages-button-v1 dropdown-toggle"
          id="messagesDropdown"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          title="Messages"
        >
          <i className="bi bi-chat-dots-fill"></i>
        </Button>
        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="messagesDropdown">
          <li>
            <button className="dropdown-item" onClick={handleOpenGroupChat}>
              <i className="bi bi-people-fill me-2"></i>
              Group Chats
            </button>
          </li>
        </ul>
      </div>

      {/* Add custom CSS for message button */}
      <style>{`
        .messages-button-v1 {
          padding: 0.375rem 0.75rem;
          border-radius: 0.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </>
  );
};

export default MessagesButton; 