import { authAxios } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';


export const getNotifications = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.NOTIFICATIONS}/user`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const response = await authAxios.patch(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await authAxios.patch(`${API_ENDPOINTS.NOTIFICATIONS}/mark-all-read`);
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};      

export const deleteNotification = async (id) => {
  try {
    const response = await authAxios.delete(`${API_ENDPOINTS.NOTIFICATIONS}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const clearAllNotifications = async () => {
  try {
    const response = await authAxios.delete(`${API_ENDPOINTS.NOTIFICATIONS}/clear-all`);
    return response.data;
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};          

// export const getNotifications = async () => {
//   try {
//     const response = await axios.get(`${API_URL}/user`, {
//       headers: {
//         'x-auth-token': localStorage.getItem('token'),
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     throw error;
//   }
// };