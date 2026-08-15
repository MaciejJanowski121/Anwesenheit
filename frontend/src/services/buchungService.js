// buchungService.js

import axios from 'axios';

const API_URL = '/api/buchungen';


/* =====================================================
   BUCHUNGEN EINES SCHÜLERS
   ===================================================== */

export const getBuchungenByStudent = async (studentId) => {
    const response = await axios.get(
        `${API_URL}/student/${studentId}`
    );

    return response.data;
};


/* =====================================================
   EINZELNEN SCHÜLER EINEM KURS ZUORDNEN
   ===================================================== */

export const createBuchung = async (studentId, kursId) => {
    const response = await axios.post(
        `${API_URL}/student/${studentId}/kurs/${kursId}`
    );

    return response.data;
};


/* =====================================================
   MEHRERE SCHÜLER EINEM KURS ZUORDNEN
   ===================================================== */

export const addStudentsToKurs = async (
    kursId,
    studentIds
) => {
    const response = await axios.post(
        `${API_URL}/kurs/${kursId}/students`,
        studentIds
    );

    return response.data;
};


/* =====================================================
   BUCHUNG LÖSCHEN
   ===================================================== */

export const deleteBuchung = async (id) => {
    await axios.delete(
        `${API_URL}/${id}`
    );
};


/* =====================================================
   GANZEN JAHRGANG EINEM KURS ZUORDNEN
   ===================================================== */

export const addJahrgangToKurs = async (
    kursId,
    jahrgang
) => {
    const response = await axios.post(
        `${API_URL}/kurs/${kursId}/jahrgang/${jahrgang}`
    );

    return response.data;
};


/* =====================================================
   BUCHUNGEN EINES KURSES
   ===================================================== */

export const getBuchungenByKurs = async (kursId) => {
    const response = await axios.get(
        `${API_URL}/kurs/${kursId}`
    );

    return response.data;
};