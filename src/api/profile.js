import { publicAxios } from '../config/axiosConfig';

const API_URL = 'http://localhost:8080/api/profiles';

export const getProfiles = async () => {
    try {
        const response = await publicAxios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching profiles:', error);
        throw error;
    }
}

export const getProfileById = async (id) => {
    try {
        const response = await publicAxios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
}