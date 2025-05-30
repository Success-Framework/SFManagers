import { authAxios } from '../config/axiosConfig';

const API_URL = 'http://localhost:8080/api/tasks';

export const getUserTasks = async () => {
  try {
    const response = await authAxios.get(`${API_URL}/user`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    throw error;
  }
};

export const getTaskStatuses = async (startupId) => {
  try {
    const response = await authAxios.get(`${API_URL}/statuses/${startupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    throw error;
  }
};

export const getStartupTasks = async (startupId) => {
  try {
    const response = await authAxios.get(`${API_URL}/startup/${startupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching startup tasks:', error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await authAxios.post(`${API_URL}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, statusId) => {
  try {
    const response = await authAxios.patch(`${API_URL}/${taskId}/status`, { statusId });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await authAxios.put(`${API_URL}/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await authAxios.delete(`${API_URL}/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const startTimer = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_URL}/${taskId}/timer/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting timer:', error);
    throw error;
  }
};

export const stopTimer = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_URL}/${taskId}/timer/stop`);
    return response.data;
  } catch (error) {
    console.error('Error stopping timer:', error);
    throw error;
  }
};

export const pauseTimer = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_URL}/${taskId}/timer/pause`);
    return response.data;
  } catch (error) {
    console.error('Error pausing timer:', error);
    throw error;
  }
};

export const getTimeLogs = async (taskId) => {
  try {
    const response = await authAxios.get(`${API_URL}/${taskId}/time-logs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching time logs:', error);
    throw error;
  }
};

export const getFreelanceTasks = async () => {
  try {
    const response = await authAxios.get(`${API_URL}/freelance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching freelance tasks:', error);
    throw error;
  }
};

export const acceptFreelanceTask = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_URL}/freelance/accept/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error accepting freelance task:', error);
    throw error;
  }
};

export const cancelFreelanceTask = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_URL}/freelance/cancel/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling freelance task:', error);
    throw error;
  }
};

export const getMyFreelanceTasks = async () => {
  try {
    const response = await authAxios.get(`${API_URL}/freelance/my`);
    return response.data;
  } catch (error) {
    console.error('Error fetching my freelance tasks:', error);
    throw error;
  }
};


