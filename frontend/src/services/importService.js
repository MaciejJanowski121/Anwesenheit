import axios from 'axios';

const API_URL = 'http://localhost:8080/api/import';

export const importStudentsFromExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    await axios.post(`${API_URL}/students`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const importKurseFromExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    await axios.post(`${API_URL}/kurse`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};