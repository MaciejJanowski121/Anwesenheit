import axios from 'axios';

const API_URL = '/api';

// Alle Gebühren-Endpunkte sind im Backend ausschließlich für ADMIN freigegeben.
export const getGebuehrenUebersicht = async (schuljahr, halbjahr) => {
    const response = await axios.get(`${API_URL}/gebuehren`, {
        params: { schuljahr, halbjahr }
    });
    return response.data;
};

export const getGebuehrenBerechnung = async (studentId, schuljahr, halbjahr) => {
    const response = await axios.get(`${API_URL}/gebuehren/${studentId}/berechnung`, {
        params: { schuljahr, halbjahr }
    });
    return response.data;
};

export const getGebuehrenTarife = async (schuljahr) => {
    const response = await axios.get(`${API_URL}/gebuehren/tarife`, {
        params: { schuljahr }
    });
    return response.data;
};

export const updateGebuehrenTarif = async (id, betrag) => {
    const response = await axios.put(`${API_URL}/gebuehren/tarife/${id}`, {
        betrag
    });
    return response.data;
};

export const getGebuehrenStatus = async (studentId, schuljahr, halbjahr) => {
    const response = await axios.get(`${API_URL}/gebuehren/${studentId}`, {
        params: { schuljahr, halbjahr }
    });
    return response.data;
};

export const toggleGebuehrenErfasst = async (studentId, schuljahr, halbjahr) => {
    const response = await axios.put(
        `${API_URL}/gebuehren/${studentId}`,
        null,
        { params: { schuljahr, halbjahr } }
    );
    return response.data;
};

export const updateGebuehrenKorrektur = async (studentId, schuljahr, halbjahr, betrag) => {
    const response = await axios.put(
        `${API_URL}/gebuehren/${studentId}/korrektur`,
        { betrag },
        { params: { schuljahr, halbjahr } }
    );
    return response.data;
};

export const getBuchungenByStudent = async (studentId) => {
    const response = await axios.get(`${API_URL}/buchungen/student/${studentId}`);
    return response.data;
};

// Bestehende Funktion bleibt für andere Komponenten verfügbar.
export const getStudents = async () => {
    const response = await axios.get(`${API_URL}/students`);
    return response.data;
};
