import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    // Apply theme class to the body element
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top py-2">
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <i className="bi bi-rocket-takeoff me-2 fs-3"></i>
          <span className="fw-bold fs-4">SFManagers</span>
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto me-auto gap-4">
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-2" to="/my-startups">
                    <i className="bi bi-building"></i>
                    <span>My Startups</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-2" to="/dashboard">
                    <i className="bi bi-speedometer2"></i>
                    <span>My Dashboard</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-2" to="/browse-startups">
                    <i className="bi bi-search"></i>
                    <span>Discover</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-2" to="/create-startup">
                    <i className="bi bi-plus-circle"></i>
                    <span>Create</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link d-flex align-items-center gap-2" to="/my-requests">
                    <i className="bi bi-envelope"></i>
                    <span>Requests</span>
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            {/* Theme Toggle Button */}
            <button 
              className="btn btn-icon" 
              onClick={toggleTheme}
              style={{ background: 'transparent', border: 'none', color: 'white' }}
              aria-label="Toggle dark mode"
            >
              {isDarkTheme ? (
                <i className="bi bi-sun-fill fs-5"></i>
              ) : (
                <i className="bi bi-moon-fill fs-5"></i>
              )}
            </button>
            
            {isAuthenticated ? (
              <>
                {/* Notification Icon */}
                <div className="position-relative mx-2">
                  <button className="btn btn-icon" style={{ background: 'transparent', border: 'none', color: 'white' }}>
                    <i className="bi bi-bell-fill fs-5"></i>
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      0
                    </span>
                  </button>
                </div>
                
                {/* Rating display */}
                <div className="mx-2">
                  <div className="d-flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i 
                        key={star} 
                        className={`bi bi-star${user?.level && star <= user.level / 10 ? '-fill' : ''} text-warning`}
                        style={{ fontSize: '0.8rem' }}
                      ></i>
                    ))}
                    <span className="ms-1 text-light" style={{ fontSize: '0.8rem' }}>
                      {user?.level ? (user.level / 10).toFixed(1) : '0.1'}
                    </span>
                  </div>
                </div>
                
                {/* User Menu */}
                <div className="dropdown ms-1">
                  <button 
                    className="dropdown-toggle btn btn-icon" 
                    type="button" 
                    id="userDropdown" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                    style={{ background: 'transparent', border: 'none', color: 'white' }}
                  >
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-light text-primary d-flex align-items-center justify-content-center me-2" 
                           style={{ width: '32px', height: '32px', fontSize: '1rem', fontWeight: 'bold' }}>
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span>{user?.name || 'User'}</span>
                    </div>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person me-2"></i> Profile</Link></li>
                    <li><Link className="dropdown-item" to="/settings"><i className="bi bi-gear me-2"></i> Settings</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={logout}><i className="bi bi-box-arrow-right me-2"></i> Logout</button></li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-sm btn-outline-primary">Login</Link>
                <Link to="/register" className="btn btn-sm btn-primary">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 