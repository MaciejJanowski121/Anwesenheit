import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const getStudents = async () => {
    const response = await axios.get(`${API_URL}/students`);
    return response.data;
};

export const getGebuehrenStatus = async (studentId, schuljahr, halbjahr) => {
    const response = await axios.get(`${API_URL}/gebuehren/${studentId}`, {
        params: {
            schuljahr,
            halbjahr
        }
    });

    return response.data;
};

export const toggleGebuehrenErfasst = async (studentId, schuljahr, halbjahr) => {
    const response = await axios.put(`${API_URL}/gebuehren/${studentId}`, null, {
        params: {
            schuljahr,
            halbjahr
        }
    });

    return response.data;
};

export const getBuchungenByStudent = async (studentId) => {
    const response = await axios.get(`${API_URL}/buchungen/student/${studentId}`);
    return response.data;
};