import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../styles/theme.css';
import MainApp from './MainApp';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <MainApp />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App; 