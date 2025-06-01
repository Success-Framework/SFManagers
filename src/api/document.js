import axios from 'axios';

// Base URL for the API
const API_URL = `${process.env.API_URL}/api/documents`; // Adjust the URL as needed

// Function to get the auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Upload a document
export const uploadDocument = async (file, name, description, startupId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('description', description);
  formData.append('startupId', startupId);

  try {
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': getAuthToken(), // Include token in headers
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// Download a document by ID
export const downloadDocument = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/download/${id}`, {
      headers: {
        'x-auth-token': getAuthToken(), // Include token in headers
      },
      responseType: 'blob', // Important for downloading files
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};

// Get all documents
export const getDocuments = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        'x-auth-token': getAuthToken(), // Include token in headers
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

// Get a document by ID
export const getDocumentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: {
        'x-auth-token': getAuthToken(), // Include token in headers
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

// Create a new document
export const createDocument = async (documentData) => {
  try {
    const response = await axios.post(API_URL, documentData, {
      headers: {
        'x-auth-token': getAuthToken(), // Include token in headers
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Update a document by ID
export const updateDocument = async (id, updates) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, updates, {
      headers: {
        'x-auth-token': getAuthToken(), // Include token in headers
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Delete a document by ID
export const deleteDocument = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        'x-auth-token': getAuthToken(), // Include token in headers
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};