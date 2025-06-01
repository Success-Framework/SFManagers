import axios from 'axios';

const API_URL = `${process.env.API_URL}/api/startups`; // Ensure this matches your backend server's URL

// Function to create a new startup
export const createStartup = async (startupData) => {
  try {
    const response = await axios.post(API_URL, startupData, {
      headers: {
        'x-auth-token': localStorage.getItem('token'), // Include token if using authentication
      },
    });
    return response.data; // Return the created startup data
  } catch (error) {
    console.error('Error creating startup:', error);
    throw error; // Rethrow the error for handling in the component
  }
};

// Function to get all startups
export const getAllStartups = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data; // Return the list of startups
  } catch (error) {
    console.error('Error fetching startups:', error);
    throw error;
  }
};

// Function to get owned startups by user ID
export const getOwnedStartupsByUserId = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/owned/${userId}`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data; // Return the owned startups
  } catch (error) {
    console.error('Error fetching owned startups:', error);
    throw error;
  }
};

// Function to get my startups
export const getMyStartups = async () => {
  try {
    const response = await axios.get(`${API_URL}/my-startups`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data; // Return my startups
  } catch (error) {
    console.error('Error fetching my startups:', error);
    throw error;
  }
};

// Function to get a startup by ID
export const getStartupById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data; // Return the startup data
  } catch (error) {
    console.error('Error fetching startup by ID:', error);
    throw error;
  }
};

// Function to update a startup by ID
export const updateStartup = async (id, startupData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, startupData, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data; // Return the updated startup data
  } catch (error) {
    console.error('Error updating startup:', error);
    throw error;
  }
};

export const getStartupTasks = async (startupId) => {
  try {
    const response = await axios.get(`${API_URL}/${startupId}/tasks`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data; // Return the startup tasks
  } catch (error) {
    console.error('Error fetching startup tasks:', error);
    throw error;
  }
}; 

// Function to get roles for a specific startup
export const getRoles = async (startupId) => {
  try {
    const response = await axios.get(`${API_URL}/${startupId}/roles`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data; // Return the roles
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// Function to get members for a specific startup
export const getStartupMembers = async (startupId) => {
  try {
    const response = await axios.get(`${API_URL}/${startupId}/members`, {
      headers: { 
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data; // Return the startup members
  } catch (error) {
    console.error('Error fetching startup members:', error);
    throw error;
  }
};
// Function to get user roles for a specific startup
export const getUserRoles = async (startupId) => {
  try {
    const response = await axios.get(`${API_URL}/${startupId}/user-roles`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data; // Return the user roles
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
};

// Function to get joined startups
export const getJoinedStartups = async () => {
  try {
    const response = await axios.get(`${API_URL}/joined-startups`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data; // Return the joined startups
  } catch (error) {
    console.error('Error fetching joined startups:', error);
    throw error;
  }
};

// Function to get public preview of a startup
export const publicPreview = async (startupId) => {
  try {
    const response = await axios.get(`${API_URL}/${startupId}/public-preview`);
    return response.data; // Return the public preview data
  } catch (error) {
    console.error('Error fetching public preview:', error);
    throw error;
  }
};
