import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export const getStudents = async () => {
    const response = await axios.get(`${API_BASE_URL}/students`);
    return response.data;
};
