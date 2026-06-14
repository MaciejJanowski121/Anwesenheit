// buchungService.js

import axios from 'axios';

const API_URL = 'http://localhost:8080/api/buchungen';

export const getBuchungenByStudent = async (studentId) => {
    const response = await axios.get(
        `${API_URL}/student/${studentId}`
    );

    return response.data;
};