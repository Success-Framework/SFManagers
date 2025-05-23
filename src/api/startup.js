import axios from 'axios';

const API_URL = 'http://localhost:8080/api/startups'; // Ensure this matches your backend server's URL

// Function to get my startups
export const getMyStartups = async () => {
  try {
    console.log(123, localStorage.getItem('token'));
    console.log(43, `${API_URL}/my-startups`);
    const response = await axios.get(`${API_URL}/my-startups`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'), // Include token if using authentication
      },
    });
    return response.data; // Return the data from the response
  } catch (error) {
    console.error('Error fetching my startups:', error);
    throw error; // Rethrow the error for handling in the component
  }
};
