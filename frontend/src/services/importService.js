import axios from 'axios';

const API_URL = '/api/import';

export const importStudentsFromExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return axios.post(`${API_URL}/students`, formData);
};

export const importKurseFromExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return axios.post(`${API_URL}/kurse`, formData);
};