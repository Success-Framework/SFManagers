import axios from 'axios';
import { API_URL } from '../config/api';

interface ServerResponse<T> {
  success: boolean;
  message?: string;
  startups?: T[];
  startup?: T;
}

// Helper function to get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper to set up authorization header
const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}; 