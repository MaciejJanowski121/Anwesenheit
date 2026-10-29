const API_URL = '/api/klassen';

/* =====================================================
   API REQUEST
   ===================================================== */

const request = async (url, options = {}) => {

    const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (!response.ok) {

        let message = 'Ein Fehler ist aufgetreten.';

        try {
            const data = await response.json();
            message = data.message || message;
        } catch {
            // Keine JSON-Fehlermeldung vorhanden.
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    const text = await response.text();

    return text ? JSON.parse(text) : null;
};

/* =====================================================
   ALLE KLASSEN
   ===================================================== */

export const getKlassen = () =>
    request(API_URL);

/* =====================================================
   KLASSE NACH ID
   ===================================================== */

export const getKlasse = (id) =>
    request(`${API_URL}/${id}`);

/* =====================================================
   SCHÜLER EINER KLASSE
   ===================================================== */

export const getKlassenSchueler = (id) =>
    request(`${API_URL}/${id}/schueler`);

/* =====================================================
   KLASSE ERSTELLEN
   ===================================================== */

export const createKlasse = (klasse) =>
    request(API_URL, {
        method: 'POST',
        body: JSON.stringify(klasse)
    });

/* =====================================================
   KLASSE AKTUALISIEREN
   ===================================================== */

export const updateKlasse = (id, klasse) =>
    request(`${API_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(klasse)
    });

/* =====================================================
   KLASSE LÖSCHEN
   ===================================================== */

export const deleteKlasse = (id) =>
    request(`${API_URL}/${id}`, {
        method: 'DELETE'
    });

/* =====================================================
   SCHÜLER EINER KLASSE ZUORDNEN
   ===================================================== */

export const addStudentsToKlasse = (
    klasseId,
    studentIds
) =>
    request(
        `${API_URL}/${klasseId}/schueler`,
        {
            method: 'POST',
            body: JSON.stringify(studentIds)
        }
    );

/* =====================================================
   SCHÜLER AUS KLASSE ENTFERNEN
   ===================================================== */

export const removeStudentFromKlasse = (
    klasseId,
    studentId
) =>
    request(
        `${API_URL}/${klasseId}/schueler/${studentId}`,
        {
            method: 'DELETE'
        }
    );