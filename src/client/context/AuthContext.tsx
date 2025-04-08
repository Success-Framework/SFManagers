import React, { createContext, useState, useEffect, useContext } from 'react';
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isFirstLogin: false,
  isPageRefresh: true,
  markUserAsRegistered: () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
  addPoints: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [isPageRefresh, setIsPageRefresh] = useState<boolean>(true);

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
      const response = await fetch('/api/auth/me', {
        headers: {
          'x-auth-token': authToken
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
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
      const response = await fetch('/api/auth/me', {
        headers: {
          'x-auth-token': authToken
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
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

  // Load user data from localStorage on component mount
  useEffect(() => {
    // Block rendering with isLoading=true until this completes
    setIsLoading(true);
    
    const loadUserFromStorage = async () => {
      try {
        console.log('🔄 Auth initialization started');
        
        // CRITICAL: First synchronously check for token
        const storedToken = localStorage.getItem('token');
        
        if (!storedToken) {
          console.log('❌ No token found in localStorage');
          // Remove artificial delay - set loading false immediately
          setIsLoading(false);
          return;
        }
        
        console.log('✅ Token found in localStorage');
        // Set token immediately to allow rendering
        setToken(storedToken);
        
        // This is a page refresh, not a login
        setIsPageRefresh(true);
        setIsFirstLogin(false);
        
        // OPTIMIZATION: Check for cached user data
        const cachedUserData = localStorage.getItem(CACHED_USER_DATA);
        const cachedTimestamp = localStorage.getItem(USER_DATA_TIMESTAMP);
        
        if (cachedUserData && cachedTimestamp) {
          try {
            // Check if cache is still valid (less than 30 minutes old)
            const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
            
            if (cacheAge < CACHE_MAX_AGE) {
              // Use cached data immediately to speed up rendering
              console.log('🚀 Using cached user data (age: ' + Math.round(cacheAge/1000/60) + ' minutes)');
              const userData = JSON.parse(cachedUserData);
              setUser(userData);
              
              // Set loading to false to allow rendering
              setIsLoading(false);
              
              // Refresh data in background without delay
              refreshUserDataInBackground(storedToken);
              return;
            } else {
              console.log('⚠️ Cached user data expired, fetching fresh data');
            }
          } catch (cacheError) {
            console.error('Error parsing cached user data:', cacheError);
          }
        } else {
          console.log('❓ No cached user data found');
        }
        
        // If we got here, we need to fetch user data from API
        await fetchUserData(storedToken);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Critical error in auth initialization:', error);
        setIsLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server - missing token or user data');
      }
      
      // Save token to localStorage and state
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      
      // Also cache the user data
      localStorage.setItem(CACHED_USER_DATA, JSON.stringify(data.user));
      localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
      
      // This is a login, not a page refresh
      setIsPageRefresh(false);
      
      // Check if this is the first login for this user
      const registrationStatus = localStorage.getItem(USER_REGISTRATION_STATUS);
      const registeredUsers = registrationStatus ? JSON.parse(registrationStatus) : {};
      
      // If user has registered before, they shouldn't see the first-time notifications
      if (registeredUsers[data.user.id]) {
        setIsFirstLogin(false);
      } else {
        // This is their first login since we started tracking
        setIsFirstLogin(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await response.json();
      
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server - missing token or user data');
      }
      
      // Save token to localStorage and state
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      
      // Also cache the user data
      localStorage.setItem(CACHED_USER_DATA, JSON.stringify(data.user));
      localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
      
      // This is a registration, not a page refresh
      setIsPageRefresh(false);
      
      // Always set first login to true for newly registered users
      setIsFirstLogin(true);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear all auth data from localStorage and state
    localStorage.removeItem('token');
    localStorage.removeItem(CACHED_USER_DATA);
    localStorage.removeItem(USER_DATA_TIMESTAMP);
    setToken(null);
    setUser(null);
    setIsFirstLogin(false);
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
      const response = await fetch('/api/users/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          amount,
          reason,
          meta: meta ? JSON.stringify(meta) : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add points');
      }
      
      const updatedUser = await response.json();
      setUser(updatedUser);
      
      // Update the cache
      localStorage.setItem(CACHED_USER_DATA, JSON.stringify(updatedUser));
      localStorage.setItem(USER_DATA_TIMESTAMP, Date.now().toString());
      
      // Show a toast or notification
      if (amount > 0) {
        showPointsNotification(amount, reason);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        isFirstLogin,
        isPageRefresh,
        markUserAsRegistered,
        login,
        register,
        logout,
        updateUser,
        addPoints
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext; 