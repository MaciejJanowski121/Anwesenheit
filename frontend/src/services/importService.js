import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/import';

export const importStudentsFromExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/students`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};