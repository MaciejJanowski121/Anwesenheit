import axios from 'axios';

const API_URL = '/api/angebot-teilnahmen';

export const getTeilnahmenByAngebot = async (angebotId) => {
    const response = await axios.get(
        `${API_URL}/angebot/${angebotId}`
    );

    return response.data;
};

export const getTeilnahmenByStudent = async (studentId) => {
    const response = await axios.get(
        `${API_URL}/student/${studentId}`
    );

    return response.data;
};

export const addStudentToAngebot = async (angebotId, studentId) => {
    const response = await axios.post(
        `${API_URL}/student/${studentId}/angebot/${angebotId}`
    );

    return response.data;
};

export const addStudentsToAngebot = async (angebotId, studentIds) => {
    const response = await axios.post(
        `${API_URL}/angebot/${angebotId}/students`,
        studentIds
    );

    return response.data;
};

export const addJahrgangToAngebot = async (angebotId, jahrgang) => {
    const response = await axios.post(
        `${API_URL}/angebot/${angebotId}/jahrgang/${jahrgang}`
    );

    return response.data;
};

export const deleteAngebotTeilnahme = async (teilnahmeId) => {
    await axios.delete(`${API_URL}/${teilnahmeId}`);
};

export const updateAngebotTeilnahmeBesonderheiten = async (
    teilnahmeId,
    besonderheiten
) => {
    const response = await axios.patch(
        `${API_URL}/${teilnahmeId}/besonderheiten`,
        { besonderheiten }
    );

    return response.data;
};