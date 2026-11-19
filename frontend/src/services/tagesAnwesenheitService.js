import axios from 'axios';

const API_URL = '/api/tages-anwesenheiten';

/* =====================================================
   ANWESENHEITEN EINES TAGES
   ===================================================== */

export const getTagesAnwesenheitenByDatum = async (
    datum
) => {

    const response = await axios.get(
        `${API_URL}/datum`,
        {
            params: {
                datum
            }
        }
    );

    return response.data;
};

/* =====================================================
   ANWESENHEITEN EINES ZEITRAUMS
   ===================================================== */

export const getTagesAnwesenheitenByZeitraum = async (
    von,
    bis
) => {

    const response = await axios.get(
        `${API_URL}/zeitraum`,
        {
            params: {
                von,
                bis
            }
        }
    );

    return response.data;
};

/* =====================================================
   ANWESENHEITEN EINES SCHÜLERS
   ===================================================== */

export const getTagesAnwesenheitenByStudent = async (
    studentId
) => {

    const response = await axios.get(
        `${API_URL}/student/${studentId}`
    );

    return response.data;
};

/* =====================================================
   ANWESENHEIT EINES SCHÜLERS AN EINEM TAG
   ===================================================== */

export const getTagesAnwesenheitByStudentAndDatum = async (
    studentId,
    datum
) => {

    try {

        const response = await axios.get(
            `${API_URL}/student/${studentId}/datum`,
            {
                params: {
                    datum
                }
            }
        );

        return response.data;

    } catch (error) {

        if (error.response?.status === 404) {
            return null;
        }

        throw error;
    }
};

/* =====================================================
   EINZELNE ANWESENHEIT SPEICHERN
   ===================================================== */

export const saveTagesAnwesenheit = async (
    studentId,
    anwesenheit
) => {

    const response = await axios.post(
        `${API_URL}/student/${studentId}`,
        anwesenheit
    );

    return response.data;
};

/* =====================================================
   EINZELNE FELDER AKTUALISIEREN
   ===================================================== */

export const updateTagesAnwesenheit = async (
    studentId,
    datum,
    aenderungen
) => {

    const response = await axios.patch(
        `${API_URL}/student/${studentId}`,
        aenderungen,
        {
            params: {
                datum
            }
        }
    );

    return response.data;
};

/* =====================================================
   SAMMELAKTUALISIERUNG
   ===================================================== */

export const saveSammelTagesAnwesenheit = async (
    datum,
    studentIds,
    aenderungen
) => {

    const response = await axios.post(
        `${API_URL}/sammel`,
        {
            datum,
            studentIds,
            aenderungen
        }
    );

    return response.data;
};

/* =====================================================
   SCHÜLERSTATISTIK
   ===================================================== */

export const getTagesAnwesenheitStatistik = async (
    studentId
) => {

    const response = await axios.get(
        `${API_URL}/student/${studentId}/statistik`
    );

    return response.data;
};

/* =====================================================
   ANWESENHEIT LÖSCHEN
   ===================================================== */

export const deleteTagesAnwesenheit = async (
    id
) => {

    await axios.delete(
        `${API_URL}/${id}`
    );
};