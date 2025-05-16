import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User } from '../types';

// Add constant for tracking user registration status
const USER_REGISTRATION_STATUS = 'user-registration-status';
// Constants for user data caching
const CACHED_USER_DATA = 'cached_user_data';
const USER_DATA_TIMESTAMP = 'user_data_timestamp';
const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes in milliseconds

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLogin: boolean;
  isPageRefresh: boolean;
  markUserAsRegistered: (userId: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  addPoints: (amount: number, reason: string, meta?: any) => Promise<void>;
  resetAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [isPageRefresh, setIsPageRefresh] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // The isAuthenticated derived state is calculated from token and user
  const isAuthenticatedDerived = Boolean(token && user);

  // Helper function to get the correct auth API endpoint
  const getAuthEndpoint = useCallback(() => {
    return '/api/auth/me';
  }, []);

  // Initialize auth state on component mount
  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        // No token found, clear any lingering state
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Set token first
      setToken(storedToken);
      
      // Then fetch the user data
      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        
        if (response.status === 200 && response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
          
          // Cache the user data for faster future loads
          localStorage.setItem(CACHED_USER_DATA, JSON.stringify(response.data));
          localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
        } else {
          // Invalid user data response
          console.error('Invalid user data response, clearing auth state');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          localStorage.removeItem(CACHED_USER_DATA);
          localStorage.removeItem(USER_DATA_TIMESTAMP);
        }
      } catch (apiError) {
        console.error('API Error during auth initialization:', apiError);
        // Clear auth state on API error
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem(CACHED_USER_DATA);
        localStorage.removeItem(USER_DATA_TIMESTAMP);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear auth state on error
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem(CACHED_USER_DATA);
      localStorage.removeItem(USER_DATA_TIMESTAMP);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run auth initialization on component mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Clear any previous auth state first
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.status === 200 && response.data && response.data.token) {
        const { token: newToken, user: userData } = response.data;
        
        // Save token to localStorage
        localStorage.setItem('token', newToken);
        
        // Cache the user data
        localStorage.setItem(CACHED_USER_DATA, JSON.stringify(userData));
        localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
        
        // Update all auth state properties in one render cycle to prevent React error #310
        setTimeout(() => {
          // Update auth state
          setToken(newToken);
          setUser(userData);
          setIsAuthenticated(true);
        }, 0);
        
        return;
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Clear any partial auth state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem(CACHED_USER_DATA);
      localStorage.removeItem(USER_DATA_TIMESTAMP);
      
      // Rethrow for handling in UI
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Clear all auth data at once
    localStorage.removeItem('token');
    localStorage.removeItem(CACHED_USER_DATA);
    localStorage.removeItem(USER_DATA_TIMESTAMP);
    
    // Set all state in one cycle
    setTimeout(() => {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }, 0);
    
    // Use setTimeout to avoid React render-time navigation errors
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 10);
  }, [navigate]);

  // Reset auth state function for error recovery
  const resetAuthState = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  // Function to mark user as having seen first-time notifications
  const markUserAsRegistered = (userId: string) => {
    if (!userId) return;
    
    // Get current registration status
    const registrationStatus = localStorage.getItem(USER_REGISTRATION_STATUS);
    const registeredUsers = registrationStatus ? JSON.parse(registrationStatus) : {};
    
    // Mark this user as registered
    registeredUsers[userId] = new Date().toISOString();
    
    // Save updated status
    localStorage.setItem(USER_REGISTRATION_STATUS, JSON.stringify(registeredUsers));
    
    // Update first login state
    setIsFirstLogin(false);
  };

  // Helper function to fetch user data from API
  const fetchUserData = async (authToken: string) => {
    try {
      console.log('🔄 Fetching user data from API');
      const response = await axios.get(getAuthEndpoint(), {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.status === 200 && response.data) {
        const userData = response.data;
        console.log('✅ User data retrieved successfully', userData.id);
        
        // Cache the user data
        localStorage.setItem(CACHED_USER_DATA, JSON.stringify(userData));
        localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
        
        setUser(userData);
        return true;
      } else {
        console.error('❌ API error fetching user:', response.status);
        
        // Only clear token on 401 Unauthorized
        if (response.status === 401) {
          console.log('❌ Unauthorized - clearing token');
          localStorage.removeItem('token');
          localStorage.removeItem(CACHED_USER_DATA);
          localStorage.removeItem(USER_DATA_TIMESTAMP);
          setToken(null);
          setUser(null);
        } else {
          // For other errors, keep using cached data if available
          const cachedUserData = localStorage.getItem(CACHED_USER_DATA);
          if (cachedUserData) {
            console.log('⚠️ Using cached user data due to API error');
            setUser(JSON.parse(cachedUserData));
          } else {
            // Create minimal user for UI when no cache exists
            console.log('⚠️ Creating minimal user object due to API error');
            setUser({
              id: 'temp-id', 
              name: 'User', 
              email: '',
              points: 0,
              level: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Network error fetching user:', error);
      
      // For network errors, use cached data if available
      const cachedUserData = localStorage.getItem(CACHED_USER_DATA);
      if (cachedUserData) {
        console.log('⚠️ Using cached user data due to network error');
        setUser(JSON.parse(cachedUserData));
      } else {
        console.log('⚠️ Creating minimal user object due to network error');
        setUser({
          id: 'temp-id', 
          name: 'User', 
          email: '',
          points: 0,
          level: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      return false;
    }
  };
  
  // Helper function to refresh user data in background
  const refreshUserDataInBackground = async (authToken: string) => {
    try {
      console.log('🔄 Refreshing user data in background');
      const response = await axios.get(getAuthEndpoint(), {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.status === 200 && response.data) {
        const userData = response.data;
        console.log('✅ User data refreshed in background');
        
        // Update cache
        localStorage.setItem(CACHED_USER_DATA, JSON.stringify(userData));
        localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
        
        // Update state (without affecting loading state)
        setUser(userData);
      } else if (response.status === 401) {
        // Only handle 401 errors for background refresh
        console.log('❌ Token expired, clearing auth state');
        localStorage.removeItem('token');
        localStorage.removeItem(CACHED_USER_DATA);
        localStorage.removeItem(USER_DATA_TIMESTAMP);
        setToken(null);
        setUser(null);
      }
      // Ignore other error types for background refresh
    } catch (error) {
      console.log('⚠️ Background refresh failed, will retry later');
      // Ignore errors for background refresh
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/register', { name, email, password });
      
      if (response.status === 200 && response.data && response.data.token && response.data.user) {
        const { token: newToken, user: userData } = response.data;
        
        // Save token to localStorage and state
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        
        // Also cache the user data
        localStorage.setItem(CACHED_USER_DATA, JSON.stringify(userData));
        localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
        
        // This is a registration, not a page refresh
        setIsPageRefresh(false);
        
        // Always set first login to true for newly registered users
        setIsFirstLogin(true);
      } else {
        throw new Error('Invalid response from server - missing token or user data');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Also update the cache
      localStorage.setItem(CACHED_USER_DATA, JSON.stringify(updatedUser));
      localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
    }
  };

  const addPoints = async (amount: number, reason: string, meta?: any) => {
    if (!user || !token) return;
    
    try {
      const response = await axios.post('/api/users/points', {
        amount,
        reason,
        meta: meta ? JSON.stringify(meta) : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200 && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        
        // Update the cache
        localStorage.setItem(CACHED_USER_DATA, JSON.stringify(updatedUser));
        localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
        
        // Show a toast or notification
        if (amount > 0) {
          showPointsNotification(amount, reason);
        }
      } else {
        throw new Error('Failed to add points');
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  // Helper function to show points notification
  const showPointsNotification = (amount: number, reason: string) => {
    // If you have a toast library, you can use it here
    const notification = document.createElement('div');
    notification.className = 'points-notification';
    notification.innerHTML = `
      <div class="points-notification-content">
        <i class="bi bi-star-fill"></i>
        <span>+${amount} points</span>
        <p>${reason}</p>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
      notification.classList.add('points-notification-hide');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, 3000);
  };

  const value = {
    user,
    token,
    isAuthenticated: isAuthenticatedDerived,
    isLoading,
    isFirstLogin,
    isPageRefresh,
    markUserAsRegistered,
    login,
    register,
    logout,
    updateUser,
    addPoints,
    resetAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 