import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export const getStudents = async () => {
    const response = await axios.get(`${API_BASE_URL}/students`);
    return response.data;
};

export const createStudent = async (student) => {
    const response = await axios.post(`${API_BASE_URL}/students`, student);
    return response.data;
};

export const updateStudent = async (id, student) => {
    const response = await axios.put(`${API_BASE_URL}/students/${id}`, student);
    return response.data;
};

export const deleteStudent = async (id) => {
    await axios.delete(`${API_BASE_URL}/students/${id}`);
};

export const getStudentById = async (id) => {
    const response = await axios.get(`${API_BASE_URL}/students/${id}`);
    return response.data;
};