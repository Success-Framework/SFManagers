// API base URL configuration
const getApiUrl = () => {
  // Fallback logic
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('sfmanagers.com')) {
      return 'https://sfmanagers.com/api';
    }
  }
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiUrl();

// Log the configuration
console.log('API Configuration:', {
  hostname: window.location.hostname,
  API_BASE_URL
});

export { API_BASE_URL }; 