//Here You can change the base url to the server url
// Determine if we're running in a local environment
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Use local API server when running locally, otherwise use production API
const BASE_URL = isLocalhost ? 'http://localhost:8080/api' : 'https://api.sfmanagers.com/api';


// API endpoints
const API_ENDPOINTS = {
  AUTH: `${BASE_URL}/auth`,
  DOCUMENTS: `${BASE_URL}/documents`,
  STARTUPS: `${BASE_URL}/startups`,
  TASKS: `${BASE_URL}/tasks`,
  TASK_TIME: `${BASE_URL}/tasktime`,
  JOIN_REQUESTS: `${BASE_URL}/join-requests`,
  NOTIFICATIONS: `${BASE_URL}/notifications`,
  PROFILES: `${BASE_URL}/profiles`,
  USERS: `${BASE_URL}/user`,
  HOURLY_RATES: `${BASE_URL}/hourly-rates`,
  AFFILIATE: `${BASE_URL}/affiliate`,
  AFFILIATE_LINKS: `${BASE_URL}/affiliate-links`,
  AFFILIATE_CLICKS: `${BASE_URL}/affiliate-clicks`,
  CHAT: `${BASE_URL}/chat`,
  MESSAGES: `${BASE_URL}/messages`,
  SCREENSHOTS: `${BASE_URL}/screenshots`,
  UPLOAD_SCREENSHOT: `${BASE_URL}/screenshots/save`,
};

export { API_ENDPOINTS };
