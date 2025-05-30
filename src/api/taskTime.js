import { authAxios } from '../config/axiosConfig';

const API_URL = 'http://localhost:8080/api/tasktime';

// Start timer for a task
export const startTaskTimer = async (taskId) => {
  try {
    const response = await authAxios.post(
      `${API_URL}/${taskId}/starttimer`
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
    const response = await authAxios.post(
      `${API_URL}/${taskId}/pausetimer`
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
    const response = await authAxios.post(
      `${API_URL}/${taskId}/stoptimer`,
      payload
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
    const response = await authAxios.get(
      `${API_URL}/${taskId}/timelogs`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching task time logs:', error);
    throw error;
  }
};