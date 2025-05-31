import axios from 'axios';

// Create two axios instances
const publicAxios = axios.create();
const authAxios = axios.create();

// Add response interceptor to authAxios
authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle token-related errors
    if (error.response?.data?.msg === 'Token has expired' || 
        error.response?.data?.msg === 'Token is not valid' || 
        error.response?.data?.msg === 'Invalid token structure') {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Direct redirect to login
    }
    return Promise.reject(error);
  }
);

// Add request interceptor to authAxios
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { publicAxios, authAxios };