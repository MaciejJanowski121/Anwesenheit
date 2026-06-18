import axios from 'axios';

const API_URL = 'http://localhost:8080/api/anwesenheiten';

export const getAllAnwesenheiten = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getAnwesenheitenByStudent = async (studentId) => {
    const response = await axios.get(`${API_URL}/student/${studentId}`);
    return response.data;
};

export const getAnwesenheitenByKurs = async (kursId) => {
    const response = await axios.get(`${API_URL}/kurs/${kursId}`);
    return response.data;
};

export const createAnwesenheit = async (studentId, kursId, anwesenheit) => {
    const response = await axios.post(
        `${API_URL}/student/${studentId}/kurs/${kursId}`,
        anwesenheit
    );

    return response.data;
};

export const deleteAnwesenheit = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};