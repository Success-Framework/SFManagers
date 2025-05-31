import { authAxios } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';

// Upload a document
export const uploadDocument = async (file, name, description, startupId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  formData.append('description', description);
  formData.append('startupId', startupId);

  try {
    const response = await authAxios.post(`${API_ENDPOINTS.DOCUMENTS}/upload`, formData);
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// Download a document by ID
export const downloadDocument = async (id) => {
  try {
      const response = await authAxios.get(`${API_ENDPOINTS.DOCUMENTS}/download/${id}`, {
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
    const response = await authAxios.get(API_ENDPOINTS.DOCUMENTS);
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

// Get a document by ID
export const getDocumentById = async (id) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.DOCUMENTS}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

// Create a new document
export const createDocument = async (documentData) => {
  try {
    const response = await authAxios.post(API_ENDPOINTS.DOCUMENTS, documentData);
    return response.data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Update a document by ID
export const updateDocument = async (id, updates) => {
  try {
    const response = await authAxios.put(`${API_ENDPOINTS.DOCUMENTS}/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Delete a document by ID
export const deleteDocument = async (id) => {
  try {
    const response = await authAxios.delete(`${API_ENDPOINTS.DOCUMENTS}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};