import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainApp from './components/MainApp';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainApp />,
    children: [
      // ... existing routes ...
    ]
  }
]);

export default router; 