import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AffiliateRedirect from './components/affiliate/AffiliateRedirect';
import MainApp from './components/MainApp';

const App: React.FC = () => {
  // Add a console log to help identify multiple app instances
  useEffect(() => {
    console.log('Main App instance loaded - timestamp:', Date.now());
  }, []);

  return (
    <Routes>
      <Route path="/*" element={<MainApp />} />
      <Route path="/affiliate/:code" element={<AffiliateRedirect />} />
    </Routes>
  );
};

export default App; 