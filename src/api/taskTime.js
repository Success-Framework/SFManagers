import { authAxios } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';

// Helper function to refresh the auth token if needed
const ensureAuthenticated = async () => {
  // Check if token is about to expire or has expired
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No authentication token found');
    // You might want to redirect to login here
    return false;
  }
  
  try {
    // Ensure the Authorization header is set correctly
    authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return true;
  } catch (error) {
    console.error('Error refreshing authentication:', error);
    return false;
  }
};

// Start timer for a task
export const startTaskTimer = async (taskId) => {
  try {
    // Ensure we're authenticated before making the request
    await ensureAuthenticated();
    
    console.log(`Starting timer for task ID: ${taskId}`);
    
    // Try the original endpoint first
    try {
      const response = await authAxios.post(
        `${API_ENDPOINTS.TASK_TIME}/${taskId}/starttimer`
      );
      console.log('Timer started successfully:', response.data);
      return response.data;
    } catch (firstError) {
      console.warn('First attempt failed, trying alternative endpoint structure');
      
      // Try an alternative endpoint format if the first one fails
      try {
        const altResponse = await authAxios.post(
          `${API_ENDPOINTS.TASKS}/${taskId}/timer/start`
        );
        console.log('Timer started successfully with alternative endpoint:', altResponse.data);
        return altResponse.data;
      } catch (secondError) {
        console.error('All attempts to start timer failed');
        throw firstError; // Throw the original error
      }
    }
  } catch (error) {
    console.error('Error starting task timer:', error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};

// Pause timer for a task
export const pauseTaskTimer = async (taskId) => {
  try {
    // Ensure we're authenticated before making the request
    await ensureAuthenticated();
    
    console.log(`Pausing timer for task ID: ${taskId}`);
    
    // Try the original endpoint first
    try {
      const response = await authAxios.post(
        `${API_ENDPOINTS.TASK_TIME}/${taskId}/pausetimer`
      );
      console.log('Timer paused successfully:', response.data);
      return response.data;
    } catch (firstError) {
      console.warn('First attempt failed, trying alternative endpoint structure');
      
      // Try an alternative endpoint format if the first one fails
      try {
        const altResponse = await authAxios.post(
          `${API_ENDPOINTS.TASKS}/${taskId}/timer/pause`
        );
        console.log('Timer paused successfully with alternative endpoint:', altResponse.data);
        return altResponse.data;
      } catch (secondError) {
        console.error('All attempts to pause timer failed');
        throw firstError; // Throw the original error
      }
    }
  } catch (error) {
    console.error('Error pausing task timer:', error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};

// Stop timer for a task
export const stopTaskTimer = async (taskId, payload) => {
  try {
    // Ensure we're authenticated before making the request
    await ensureAuthenticated();
    
    console.log(`Stopping timer for task ID: ${taskId}`, payload);
    
    // Try the original endpoint first
    try {
      const response = await authAxios.post(
        `${API_ENDPOINTS.TASK_TIME}/${taskId}/stoptimer`,
        payload
      );
      console.log('Timer stopped successfully:', response.data);
      return response.data;
    } catch (firstError) {
      console.warn('First attempt failed, trying alternative endpoint structure');
      
      // Try an alternative endpoint format if the first one fails
      try {
        const altResponse = await authAxios.post(
          `${API_ENDPOINTS.TASKS}/${taskId}/timer/stop`,
          payload
        );
        console.log('Timer stopped successfully with alternative endpoint:', altResponse.data);
        return altResponse.data;
      } catch (secondError) {
        console.error('All attempts to stop timer failed');
        throw firstError; // Throw the original error
      }
    }
  } catch (error) {
    console.error('Error stopping task timer:', error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};

// Get time logs for a task
export const getTaskTimeLogs = async (taskId) => {
  try {
    // Ensure we're authenticated before making the request
    await ensureAuthenticated();
    
    console.log(`Getting time logs for task ID: ${taskId}`);
    
    // Try the original endpoint first
    try {
      const response = await authAxios.get(
        `${API_ENDPOINTS.TASK_TIME}/${taskId}/timelogs`
      );
      console.log('Time logs retrieved successfully:', response.data);
      return response.data;
    } catch (firstError) {
      console.warn('First attempt failed, trying alternative endpoint structure');
      
      // Try an alternative endpoint format if the first one fails
      try {
        const altResponse = await authAxios.get(
          `${API_ENDPOINTS.TASKS}/${taskId}/timelogs`
        );
        console.log('Time logs retrieved successfully with alternative endpoint:', altResponse.data);
        return altResponse.data;
      } catch (secondError) {
        console.error('All attempts to get time logs failed');
        throw firstError; // Throw the original error
      }
    }
  } catch (error) {
    console.error('Error fetching task time logs:', error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};