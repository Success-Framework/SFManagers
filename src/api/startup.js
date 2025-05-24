import axios from 'axios';

const API_URL = 'http://localhost:8080/api/startups'; // Ensure this matches your backend server's URL

// Function to get my startups
export const getMyStartups = async () => {
  try {
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

// export const joinStartup = async () => {
//   try {
//     const response = await axios.get(`${API_URL}/joined-startups`, {}, {
//       headers: {
//         'x-auth-token': localStorage.getItem('token'),
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error joining startup:', error);
//     throw error;
//   }
// }

export const startup = async () => {
  try {
    const response = await axios.get(`${API_URL}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching startup:', error);
    throw error;
  }
} 

export const getStartupById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: {
        'x-auth-token': localStorage.getItem('token'),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching startup by ID:', error);
    throw error;
  }
}
