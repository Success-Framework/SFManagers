import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  items: {
    id: string;
    label: string;
    icon: string;
    path?: string;
    onClick?: () => void;
  }[];
  initialCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  items,
  initialCollapsed = false,
  onToggleCollapse
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    setCollapsed(initialCollapsed);
  }, [initialCollapsed]);
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-collapse sidebar on mobile if not explicitly set
      if (mobile && !collapsed && onToggleCollapse) {
        onToggleCollapse(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Check initial size
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [collapsed, onToggleCollapse]);
  
  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsed);
    }
  };
  
  const handleItemClick = (item: SidebarProps['items'][0]) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };
  
  // Don't show sidebar on login or register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }
  
  return (
    <>
      {isMobile && !collapsed && (
        <div 
          className="sidebar-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 98,
          }}
          onClick={toggleSidebar}
        />
      )}
      <div 
        className={`sidebar bg-dark text-white ${collapsed ? 'collapsed' : ''} ${isMobile && !collapsed ? 'show' : ''}`} 
        style={{ 
          width: collapsed ? '60px' : '250px', 
          minHeight: 'calc(100vh - 56px)',
          position: 'fixed',
          left: 0,
          top: 56, // Adjust for navbar height
          bottom: 0,
          zIndex: 99,
          transition: isMobile ? 'transform 0.3s ease' : 'width 0.3s ease'
        }}
      >
        <div className="p-3 d-flex justify-content-between align-items-center">
          {!collapsed && <h5 className="mb-0">Menu</h5>}
          <button className="btn btn-sm btn-outline-light" onClick={toggleSidebar}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <hr className="my-2" />
        <ul className="nav flex-column">
          {items.map(item => (
            <li className="nav-item" key={item.id}>
              <a 
                className={`nav-link ${location.pathname === item.path ? 'active bg-primary' : ''}`} 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  handleItemClick(item);
                }}
              >
                <i className={`bi bi-${item.icon} me-2`}></i>
                {!collapsed && item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar; 