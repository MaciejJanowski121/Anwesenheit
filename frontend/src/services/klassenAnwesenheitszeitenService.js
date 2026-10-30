const API_URL = '/api/klassen';

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
            message = data.message || data.detail || message;
        } catch {
            // Keine JSON-Fehlermeldung vorhanden.
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const getKlassenJahrgaenge = (klasseId) =>
    request(`${API_URL}/${klasseId}/jahrgaenge`);

export const getKlassenAnwesenheitszeiten = (klasseId, jahrgang) =>
    request(`${API_URL}/${klasseId}/anwesenheitszeiten/${jahrgang}`);

export const saveKlassenAnwesenheitszeiten = (
    klasseId,
    jahrgang,
    zeiten
) =>
    request(`${API_URL}/${klasseId}/anwesenheitszeiten/${jahrgang}`, {
        method: 'PUT',
        body: JSON.stringify(zeiten)
    });