import axios from 'axios';

const API_URL = `${process.env.API_URL}/api/auth`; // Ensure this matches your backend server's URL

// Function to register a new user
export const register = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      name,
      email,
      password,
    });
    return response.data; // Return user data and token
  } catch (error) {
    console.error('Error registering user:', error);
    throw error; // Rethrow the error for handling in the component
  }
};

// Function to log in a user
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    return response.data; // Return user data and token
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error; // Rethrow the error for handling in the component
  }
};

// Function to get the current user
export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/me`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'), // Include token in headers
      },
    });
    return response.data; // Return user data
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error; // Rethrow the error for handling in the component
  }
};

// Function to test authentication
export const testAuth = async () => {
  try {
    const response = await axios.get(`${API_URL}/test-auth`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'), // Include token in headers
      },
    });
    return response.data; // Return success message and user info
  } catch (error) {
    console.error('Error testing authentication:', error);
    throw error; // Rethrow the error for handling in the component
  }
};

// Function to get joined startups
export const getJoinedStartups = async () => {
  try {
    const response = await axios.get(`${API_URL}/joined-startups`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'), // Include token in headers
      },
    });
    return response.data; // Return joined startups data
  } catch (error) {
    console.error('Error fetching joined startups:', error);
    throw error; // Rethrow the error for handling in the component
  }
};