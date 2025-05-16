import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../common/Navbar';
import GlobalChatModal from '../common/GlobalChatModal';

interface MainLayoutProps {
  startupId?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ startupId }) => {
  const location = useLocation();
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const [chatStartupId, setChatStartupId] = useState<string | undefined>(undefined);

  // Open chat for current startup
  const openStartupChat = () => {
    if (startupId) {
      setChatStartupId(startupId);
      setShowGlobalChat(true);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar onToggleSidebar={() => {}} />
      
      <div className="d-flex flex-grow-1">
        <main className="flex-grow-1 main-content">
          <div className="container py-4">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Global Chat Modal */}
      <GlobalChatModal
        isOpen={showGlobalChat}
        onClose={() => setShowGlobalChat(false)}
        initialGroup={chatStartupId}
      />
    </div>
  );
};

export default MainLayout; 