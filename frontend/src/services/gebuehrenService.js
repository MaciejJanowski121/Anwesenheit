import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const getStudents = async () => {
    const response = await axios.get(`${API_URL}/students`);
    return response.data;
};

export const getBuchungenByStudent = async (studentId) => {
    const response = await axios.get(
        `${API_URL}/buchungen/student/${studentId}`
    );
    return response.data;
};

export const getZahlungenByStudent = async (studentId) => {
    const response = await axios.get(
        `${API_URL}/zahlungen/student/${studentId}`
    );
    return response.data;
};

export const createZahlung = async (buchungId, zahlung) => {
    const response = await axios.post(
        `${API_URL}/zahlungen/buchung/${buchungId}`,
        zahlung
    );
    return response.data;
};

export const deleteZahlung = async (id) => {
    await axios.delete(`${API_URL}/zahlungen/${id}`);
};

export const bezahleKurs = async (buchungId, abrechnungsmonat) => {

    const response = await axios.post(
        `${API_URL}/zahlungen/bezahlen/${buchungId}`,
        null,
        {
            params: {
                abrechnungsmonat
            }
        }
    );

    return response.data;
};