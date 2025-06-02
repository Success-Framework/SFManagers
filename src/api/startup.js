import { authAxios, publicAxios } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';

// Function to create a new startup
export const createStartup = async (startupData) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.STARTUPS}`, startupData);
    return response.data; // Return the created startup data
  } catch (error) {
    console.error('Error creating startup:', error);
    throw error; // Rethrow the error for handling in the component
  }
};

// Function to get all startups
export const getAllStartups = async () => {
  try {
    const response = await publicAxios.get(API_ENDPOINTS.STARTUPS);
    return response.data; // Return the list of startups
  } catch (error) {
    console.error('Error fetching startups:', error);
    throw error;
  }
};

// Function to get owned startups by user ID
export const getOwnedStartupsByUserId = async (userId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.STARTUPS}/owned/${userId}`);
    return response.data; // Return the owned startups
  } catch (error) {
    console.error('Error fetching owned startups:', error);
    throw error;
  }
};

// Function to get my startups
export const getMyStartups = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.STARTUPS}/my-startups`);
    return response.data; // Return my startups
  } catch (error) {
    console.error('Error fetching my startups:', error);
    throw error;
  }
};

// Function to get a startup by ID
export const getStartupById = async (id) => {
  try {
    const response = await publicAxios.get(`${API_ENDPOINTS.STARTUPS}/${id}`);
    return response.data; // Return the startup data
  } catch (error) {
    console.error('Error fetching startup by ID:', error);
    throw error;
  }
};

// Function to update a startup by ID
export const updateStartup = async (id, startupData) => {
  try {
    const response = await authAxios.put(`${API_ENDPOINTS.STARTUPS}/${id}`, startupData);
    return response.data; // Return the updated startup data
  } catch (error) {
    console.error('Error updating startup:', error);
    throw error;
  }
};

export const getStartupTasks = async (startupId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.STARTUPS}/${startupId}/tasks`);
    return response.data; // Return the startup tasks
  } catch (error) {
    console.error('Error fetching startup tasks:', error);
    throw error;
  }
}; 

// Function to get roles for a specific startup
export const getRoles = async (startupId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.STARTUPS}/${startupId}/roles`);
    return response.data; // Return the roles
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// Function to get members for a specific startup
export const getStartupMembers = async (startupId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.STARTUPS}/${startupId}/members`);
    return response.data; // Return the startup members
  } catch (error) {
    console.error('Error fetching startup members:', error);
    throw error;
  }
};
// Function to get user roles for a specific startup
export const getUserRoles = async (startupId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.STARTUPS}/${startupId}/user-roles`);
    return response.data; // Return the user roles
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
};

// Function to get joined startups
export const getJoinedStartups = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.STARTUPS}/joined-startups`);
    return response.data; // Return the joined startups
  } catch (error) {
    console.error('Error fetching joined startups:', error);
    throw error;
  }
};

// Function to get public preview of a startup
export const publicPreview = async (startupId) => {
  try {
    const response = await publicAxios.get(`${API_ENDPOINTS.STARTUPS}/${startupId}/public-preview`);
    return response.data; // Return the public preview data
  } catch (error) {
    console.error('Error fetching public preview:', error);
    throw error;
  }
};

// Function to add a member to a startup
export const addMemberToStartup = async (startupId, userId, roleId) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.STARTUPS}/${startupId}/members`, {
      userId,
      roleId
    });
    return response.data; // Return the added member data
  } catch (error) {
    console.error('Error adding member to startup:', error);
    throw error;
  }
};
