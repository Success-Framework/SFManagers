import { publicAxios } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';


export const getProfiles = async () => {
    try {
        const response = await publicAxios.get(API_ENDPOINTS.PROFILES);
        return response.data;
    } catch (error) {
        console.error('Error fetching profiles:', error);
        throw error;
    }
}

export const getProfileById = async (id) => {
    try {
        const response = await publicAxios.get(`${API_ENDPOINTS.PROFILES}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
}