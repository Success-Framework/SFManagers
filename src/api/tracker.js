import axios from 'axios';

// Upload screenshot
export const uploadScreenshot = async (blob, metadata) => {
  try {
    console.log('uploadScreenshot called with metadata:', metadata);
    console.log('Blob type:', blob.type, 'size:', blob.size);
    
    // Create form data to handle the blob
    const formData = new FormData();
    formData.append('screenshot', blob, 'screenshot.jpg');
    console.log('Screenshot added to FormData');
    
    // Add all metadata as JSON
    formData.append('metadata', JSON.stringify(metadata));
    console.log('Metadata added to FormData');
    
    console.log('Sending request to /api/tracker/upload');
    const response = await axios.post('/api/tracker/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

// Get screenshots for a specific user and startup
export const getScreenshots = async (userId, startupId) => {
  try {
    const response = await axios.get(`/api/tracker/screenshots/${userId}/${startupId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting screenshots:', error);
    throw error;
  }
};
