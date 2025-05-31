import { authAxios } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';

// Create a new join request
export const createJoinRequest = async (startupId, message) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.JOIN_REQUESTS}`, {
      startupId,
      message,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating join request:', error);
    throw error;
  }
};

// Get join requests for a specific startup
export const getStartupJoinRequests = async (startupId) => {
  try {
    const response = await authAxios.get(
      `${API_ENDPOINTS.JOIN_REQUESTS}/startup/${startupId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching startup join requests:', error);
    throw error;
  }
};

// Get current user's join requests
export const getUserJoinRequests = async () => {
  try {
    const response = await authAxios.get(
        `${API_ENDPOINTS.JOIN_REQUESTS}/me`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user join requests:', error);
    throw error;
  }
};

// Update join request status
export const updateJoinRequestStatus = async (requestId, status) => {
  try {
    const response = await authAxios.patch(
      `${API_ENDPOINTS.JOIN_REQUESTS}/${requestId}`,
      { status }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating join request status:', error);
    throw error;
  }
};

// Delete a join request
export const deleteJoinRequest = async (requestId) => {
  try {
    const response = await authAxios.delete(
      `${API_URL}/${requestId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting join request:', error);
    throw error;
  }
};

// Get received join requests (for startup owners)
export const getReceivedJoinRequests = async () => {
  try {
    const response = await authAxios.get(
      `${API_ENDPOINTS.JOIN_REQUESTS}/received`,
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching received join requests:', error);
    throw error;
  }
};

// Get stub join requests (fallback)
// export const getJoinRequestsStub = async () => {
//   try {
//     const response = await axios.get(
//       `${API_URL}/me/stub`,
//       getAuthHeader()
//     );
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching stub join requests:', error);
//     throw error;
//   }
// };