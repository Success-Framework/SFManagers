import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth'; // Replace with your actual API URL

// Function to handle user login
export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, {
            email,
            password,
        });

        return response.data; // Return user data or token
    } catch (error) {
        console.error('Error during login:', error);
        throw error.response ? error.response.data : new Error('Login failed');
    }
};

// Function to handle user signup
export const signup = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/signup`, {
            email,
            password,
        });

        return response.data; // Return user data or token
    } catch (error) {
        console.error('Error during signup:', error);
        throw error.response ? error.response.data : new Error('Signup failed');
    }
};
