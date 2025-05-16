import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const MessageDebug: React.FC = () => {
  const { token } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const headers = {
      Authorization: `Bearer ${token}`
    };
    
    addResult('Starting API tests...');
    
    // Test 1: Check direct endpoint
    try {
      const directResponse = await axios.get('/api/messages/test-direct', { headers });
      addResult(`✅ Direct test: ${JSON.stringify(directResponse.data)}`);
    } catch (err: any) {
      addResult(`❌ Direct test failed: ${err.message}`);
    }
    
    // Test 2: Check message routes test endpoint
    try {
      const routeResponse = await axios.get('/api/messages/test', { headers });
      addResult(`✅ Route test: ${JSON.stringify(routeResponse.data)}`);
    } catch (err: any) {
      addResult(`❌ Route test failed: ${err.message}`);
    }
    
    // Test 3: Check unread count
    try {
      const unreadResponse = await axios.get('/api/messages/unread-count', { headers });
      addResult(`✅ Unread count: ${JSON.stringify(unreadResponse.data)}`);
    } catch (err: any) {
      addResult(`❌ Unread count failed: ${err.message}`);
    }
    
    // Test 4: Check inbox
    try {
      const inboxResponse = await axios.get('/api/messages/inbox', { headers });
      addResult(`✅ Inbox: Found ${inboxResponse.data.length} messages`);
    } catch (err: any) {
      addResult(`❌ Inbox failed: ${err.message}`);
    }
    
    // Test 5: Database status
    try {
      const testApiEndpoint = '/api/startups';
      addResult(`Testing known endpoint: ${testApiEndpoint}`);
      const testResponse = await axios.get(testApiEndpoint, { headers });
      addResult(`✅ Known API endpoint works: found ${testResponse.data.length} startups`);
    } catch (err: any) {
      addResult(`❌ Known endpoint failed: ${err.message}`);
    }
    
    setIsLoading(false);
    addResult('Tests completed');
  };
  
  const addResult = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, message]);
  };
  
  return (
    <div className="container my-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Message System Diagnostic</h5>
        </div>
        <div className="card-body">
          <button 
            className="btn btn-primary mb-3" 
            onClick={runTests}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Running tests...
              </>
            ) : 'Run API Tests'}
          </button>
          
          <div className="diagnostic-results bg-light p-3 rounded">
            {testResults.length === 0 ? (
              <p className="text-muted">Click the button to run API tests</p>
            ) : (
              <ul className="list-group">
                {testResults.map((result, index) => (
                  <li key={index} className="list-group-item">
                    {result}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageDebug; 