import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AffiliateRedirect from './components/affiliate/AffiliateRedirect';
import MainApp from './components/MainApp';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/*" element={<MainApp />} />
      <Route path="/affiliate/:code" element={<AffiliateRedirect />} />
    </Routes>
  );
};

export default App; 