import axios from 'axios';

const API_URL = '/api/angebote';

export const getAngebote = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getAngebotById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createAngebot = async (angebot) => {
    const response = await axios.post(API_URL, angebot);
    return response.data;
};

export const updateAngebot = async (id, angebot) => {
    const response = await axios.put(`${API_URL}/${id}`, angebot);
    return response.data;
};

export const deleteAngebot = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};