import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

/**
 * Upload a screenshot to the server
 * @param {File} file - The screenshot file to upload
 * @param {string} startupId - The ID of the startup
 * @param {string} userName - The name of the user who took the screenshot
 * @returns {Promise} - Promise that resolves with the upload response
 */
export const uploadScreenshot = async (file, startupId, userName) => {
  try {
    const formData = new FormData();
    formData.append('screenshot', file);
    formData.append('startupId', startupId);
    formData.append('userName', userName);
    
    const response = await axios.post(API_ENDPOINTS.UPLOAD_SCREENSHOT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    throw error;
  }
};

/**
 * Get all screenshots for a startup
 * @param {string} startupId - The ID of the startup
 * @returns {Promise} - Promise that resolves with the screenshots
 */
export const getScreenshots = async (startupId) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.SCREENSHOTS}/${startupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    throw error;
  }
};
