import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../styles/theme.css';
import MainApp from './MainApp';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <Router>
            <MainApp />
          </Router>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App; 