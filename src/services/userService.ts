import axios from 'axios';
import { API_URL } from '../config/api';

interface ServerResponse<T> {
  success: boolean;
  message?: string;
  token?: string;
  user?: T;
}

// Define missing types
export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  [key: string]: any;
}

export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  [key: string]: any;
}

// Helper function to set token in localStorage
const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

// Helper function to get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper to set up authorization header
const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registerUser = async (userData: UserRegistrationData): Promise<SafeUser> => {
  try {
    const response = await axios.post<ServerResponse<SafeUser>>(`${API_URL}/auth/register`, userData);
    if (response.data.token) {
      setToken(response.data.token);
    }
    if (!response.data.user) {
      throw new Error('User data not returned from server');
    }
    return response.data.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}; 