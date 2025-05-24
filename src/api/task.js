import axios from 'axios';

const API_URL = 'http://localhost:8080/api/tasks';

export const getUserTasks = async () => {
  try{
    const response = await axios.get(API_URL + '/user', {
      headers: {
        'x-auth-token': localStorage.getItem('token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
};


