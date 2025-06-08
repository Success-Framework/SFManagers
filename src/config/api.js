//Here You can change the base url to the server url
const BASE_URL = 'https://api.sfmanagers.com/api';
// const BASE_URL = "http://localhost:5000/api"; // Updated to use port 8888


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
};

export { API_ENDPOINTS };
