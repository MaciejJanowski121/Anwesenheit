import axios from 'axios';

const API_URL = 'http://localhost:8080/api/kurse';

export const getKurse = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createKurs = async (kurs) => {
    const response = await axios.post(API_URL, kurs);
    return response.data;
};

export const updateKurs = async (id, kurs) => {
    const response = await axios.put(`${API_URL}/${id}`, kurs);
    return response.data;
};

export const deleteKurs = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};