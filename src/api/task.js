import axios from 'axios';

const API_URL = 'http://localhost:8080/api/tasks';

export const getUserTasks = async () => {
  try {
    const response = await axios.get(`${API_URL}/user`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    throw error;
  }
};

export const getTaskStatuses = async (startupId) => {
  try {
    const response = await axios.get(`${API_URL}/statuses/${startupId}`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    throw error;
  }
};

export const getStartupTasks = async (startupId) => {
  try {
    const response = await axios.get(`${API_URL}/startup/${startupId}`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching startup tasks:', error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await axios.post(API_URL, taskData, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, statusId) => {
  try {
    const response = await axios.patch(`${API_URL}/${taskId}/status`, { statusId }, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await axios.put(`${API_URL}/${taskId}`, taskData, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await axios.delete(`${API_URL}/${taskId}`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const startTimer = async (taskId) => {
  try {
    const response = await axios.post(`${API_URL}/${taskId}/timer/start`, {}, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error starting timer:', error);
    throw error;
  }
};

export const stopTimer = async (taskId) => {
  try {
    const response = await axios.post(`${API_URL}/${taskId}/timer/stop`, {}, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error stopping timer:', error);
    throw error;
  }
};

export const pauseTimer = async (taskId) => {
  try {
    const response = await axios.post(`${API_URL}/${taskId}/timer/pause`, {}, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error pausing timer:', error);
    throw error;
  }
};

export const getTimeLogs = async (taskId) => {
  try {
    const response = await axios.get(`${API_URL}/${taskId}/time-logs`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching time logs:', error);
    throw error;
  }
};

export const getFreelanceTasks = async () => {
  try {
    const response = await axios.get(`${API_URL}/freelance`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching freelance tasks:', error);
    throw error;
  }
};

export const acceptFreelanceTask = async (taskId) => {
  try {
    const response = await axios.post(`${API_URL}/freelance/accept/${taskId}`, {}, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error accepting freelance task:', error);
    throw error;
  }
};

export const cancelFreelanceTask = async (taskId) => {
  try {
    const response = await axios.post(`${API_URL}/freelance/cancel/${taskId}`, {}, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error cancelling freelance task:', error);
    throw error;
  }
};

export const getMyFreelanceTasks = async () => {
  try {
    const response = await axios.get(`${API_URL}/freelance/my`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my freelance tasks:', error);
    throw error;
  }
};


