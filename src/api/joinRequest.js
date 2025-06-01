import axios from 'axios';

const API_URL = `${process.env.BASE_URL}/api/join-requests`;

// Helper function to get auth header
const getAuthHeader = () => {
  return {
    headers: {
      'x-auth-token': localStorage.getItem('token')
    }
  };
};

// Create a new join request
export const createJoinRequest = async (roleId, message) => {
  try {
    const response = await axios.post(
      API_URL,
      { roleId, message },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error('Error creating join request:', error);
    throw error;
  }
};

// Get join requests for a specific startup
export const getStartupJoinRequests = async (startupId) => {
  try {
    const response = await axios.get(
      `${API_URL}/startup/${startupId}`,
      getAuthHeader()
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
    const response = await axios.get(
      `${API_URL}/me`,
      getAuthHeader()
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
    const response = await axios.patch(
      `${API_URL}/${requestId}`,
      { status },
      getAuthHeader()
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
    const response = await axios.delete(
      `${API_URL}/${requestId}`,
      getAuthHeader()
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
    const response = await axios.get(
      `${API_URL}/received`,
      getAuthHeader()
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