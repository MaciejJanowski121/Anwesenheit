import axios from 'axios';

const API_URL = '/api/angebot-anwesenheiten';

export const getAnwesenheitenByAngebot = async (angebotId) => {
    const response = await axios.get(
        `${API_URL}/angebot/${angebotId}`
    );

    return response.data;
};

export const getAnwesenheitenByStudent = async (studentId) => {
    const response = await axios.get(
        `${API_URL}/student/${studentId}`
    );

    return response.data;
};

export const getAnwesenheitenByAngebotUndZeitraum = async (
    angebotId,
    von,
    bis
) => {
    const response = await axios.get(
        `${API_URL}/angebot/${angebotId}/zeitraum`,
        { params: { von, bis } }
    );

    return response.data;
};

export const getAnwesenheitStatistikByAngebot = async (angebotId) => {
    const response = await axios.get(
        `${API_URL}/angebot/${angebotId}/statistik`
    );

    return response.data;
};

export const getAnwesenheitStatistikByStudent = async (studentId) => {
    const response = await axios.get(
        `${API_URL}/student/${studentId}/statistik`
    );

    return response.data;
};

export const saveAngebotAnwesenheit = async (
    angebotId,
    studentId,
    datum,
    status,
    bemerkung = ''
) => {
    const response = await axios.post(
        `${API_URL}/student/${studentId}/angebot/${angebotId}`,
        {
            datum,
            status,
            bemerkung
        }
    );

    return response.data;
};

export const deleteAngebotAnwesenheit = async (anwesenheitId) => {
    await axios.delete(`${API_URL}/${anwesenheitId}`);
};