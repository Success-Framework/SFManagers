import axios from 'axios';
const API_URL = `${process.env.BASE_URL}/api/tasktime`;

// Helper function to get auth header
const getAuthHeader = () => {
  return {
    headers: {
      'x-auth-token': localStorage.getItem('token')
    }
  };
};

// Start timer for a task
export const startTaskTimer = async (taskId) => {
  try {
    const response = await axios.post(
      `${API_URL}/${taskId}/starttimer`,
      {},
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error('Error starting task timer:', error);
    throw error;
  }
};

// Pause timer for a task
export const pauseTaskTimer = async (taskId) => {
  try {
    const response = await axios.post(
      `${API_URL}/${taskId}/pausetimer`,
      {},
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error('Error pausing task timer:', error);
    throw error;
  }
};

// Stop timer for a task
export const stopTaskTimer = async (taskId, payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/${taskId}/stoptimer`,
      payload,
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error('Error stopping task timer:', error);
    throw error;
  }
};

// Get time logs for a task
export const getTaskTimeLogs = async (taskId) => {
  try {
    const response = await axios.get(
      `${API_URL}/${taskId}/timelogs`,
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching task time logs:', error);
    throw error;
  }
};