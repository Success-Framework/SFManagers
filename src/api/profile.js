import axios from 'axios';

const API_URL = `${process.env.BASE_URL}/api/profiles`;

export const getProfiles = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching profiles:', error);
        throw error;
    }
}

export const getProfileById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
}