import axios from 'axios';

const API_URL = '/api/schuelerinfos';

export const getSchuelerinfos = async () => {

    const response = await axios.get(API_URL);

    return response.data;
};

export const getSchuelerinfoById = async (id) => {

    const response = await axios.get(
        `${API_URL}/${id}`
    );

    return response.data;
};