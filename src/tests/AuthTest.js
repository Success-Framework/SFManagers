import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Component that uses the useAuth hook
const AuthConsumer = () => {
  const auth = useAuth();
  
  return (
    <div>
      <h2>Auth Test Component</h2>
      <p>Authentication Status: {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
      <p>User: {auth.user ? JSON.stringify(auth.user) : 'No user'}</p>
      <p>Loading: {auth.loading ? 'Loading...' : 'Not loading'}</p>
      <p>Error: {auth.error || 'No error'}</p>
      <button onClick={() => auth.login('test@example.com', 'password')}>Test Login</button>
      <button onClick={() => auth.logout()}>Test Logout</button>
    </div>
  );
};

// Wrapper component that provides the AuthProvider
const AuthTest = () => {
  return (
    <AuthProvider>
      <div className="auth-test-container">
        <h1>Auth Provider Test</h1>
        <AuthConsumer />
      </div>
    </AuthProvider>
  );
};

export default AuthTest;
