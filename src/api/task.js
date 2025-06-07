import { authAxios } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';

export const getUserTasks = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.TASKS}/user`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    throw error;
  }
};

export const getTaskStatuses = async (startupId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.TASKS}/statuses/${startupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    throw error;
  }
};

export const getStartupTasks = async (startupId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.TASKS}/startup/${startupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching startup tasks:', error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.TASKS}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, statusId) => {
  try {
    console.log(`Attempting to update task status: Task ID=${taskId}, Status ID=${statusId}`);
    // Check if taskId is in the expected format
    if (!taskId) {
      console.error('Invalid task ID provided:', taskId);
      throw new Error('Invalid task ID');
    }
    
    // Convert statusId to number if it's not already (backend might expect numeric status IDs)
    const numericStatusId = typeof statusId === 'string' ? parseInt(statusId, 10) : statusId;
    
    // Try a different API endpoint structure
    // The backend might expect a different endpoint format or payload structure
    try {
      // First attempt: Using PATCH with statusId in the body
      const response = await authAxios.patch(`${API_ENDPOINTS.TASKS}/${taskId}/status`, { 
        statusId: numericStatusId 
      });
      console.log('Task status update successful:', response.data);
      return response.data;
    } catch (firstError) {
      console.log('First attempt failed, trying alternative endpoint structure');
      
      // Second attempt: Using PUT instead of PATCH
      try {
        const putResponse = await authAxios.put(`${API_ENDPOINTS.TASKS}/${taskId}/status`, { 
          statusId: numericStatusId 
        });
        console.log('Task status update successful with PUT:', putResponse.data);
        return putResponse.data;
      } catch (secondError) {
        console.log('Second attempt failed, trying third alternative');
        
        // Third attempt: Different endpoint structure
        try {
          const altResponse = await authAxios.patch(`${API_ENDPOINTS.TASKS}/status/${taskId}`, { 
            statusId: numericStatusId 
          });
          console.log('Task status update successful with alternative endpoint:', altResponse.data);
          return altResponse.data;
        } catch (thirdError) {
          // If all attempts fail, throw the original error
          throw firstError;
        }
      }
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await authAxios.put(`${API_ENDPOINTS.TASKS}/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Optimized function just for updating task status
export const updateTaskStatusFast = async (taskId, statusId) => {
  try {
    // Use a more specific endpoint that's optimized just for status updates
    const response = await authAxios.patch(`${API_ENDPOINTS.TASKS}/${taskId}/status`, { status_id: statusId });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await authAxios.delete(`${API_ENDPOINTS.TASKS}/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const startTimer = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.TASKS}/${taskId}/timer/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting timer:', error);
    throw error;
  }
};

export const stopTimer = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.TASKS}/${taskId}/timer/stop`);
    return response.data;
  } catch (error) {
    console.error('Error stopping timer:', error);
    throw error;
  }
};

export const pauseTimer = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.TASKS}/${taskId}/timer/pause`);
    return response.data;
  } catch (error) {
    console.error('Error pausing timer:', error);
    throw error;
  }
};

export const getTimeLogs = async (taskId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.TASKS}/${taskId}/time-logs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching time logs:', error);
    throw error;
  }
};

export const getFreelanceTasks = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.TASKS}/freelance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching freelance tasks:', error);
    throw error;
  }
};

export const acceptFreelanceTask = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.TASKS}/freelance/accept/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error accepting freelance task:', error);
    throw error;
  }
};

export const cancelFreelanceTask = async (taskId) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.TASKS}/freelance/cancel/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling freelance task:', error);
    throw error;
  }
};

export const getMyFreelanceTasks = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.TASKS}/freelance/my`);
    return response.data;
  } catch (error) {
    console.error('Error fetching my freelance tasks:', error);
    throw error;
  }
};


