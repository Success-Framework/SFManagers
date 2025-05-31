import { authAxios } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';

// Start timer for a task
export const startTaskTimer = async (taskId) => {
  try {
    const response = await authAxios.post(
      `${API_ENDPOINTS.TASK_TIME}/${taskId}/starttimer`
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
      `${API_ENDPOINTS.TASK_TIME}/${taskId}/pausetimer`
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
      `${API_ENDPOINTS.TASK_TIME}/${taskId}/stoptimer`,
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
      `${API_ENDPOINTS.TASK_TIME}/${taskId}/timelogs`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching task time logs:', error);
    throw error;
  }
};