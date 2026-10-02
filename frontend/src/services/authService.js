const API_URL = '/api/auth';

/**
 * Logowanie użytkownika.
 * Backend tworzy sesję i zwraca cookie JSESSIONID.
 */
export async function login(username, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            username,
            password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Anmeldung fehlgeschlagen.'
        );
    }

    return data;
}

/**
 * Sprawdza aktualnie zalogowanego użytkownika.
 */
export async function getCurrentUser() {
    const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!response.ok) {
        return null;
    }

    return response.json();
}

/**
 * Wylogowanie użytkownika.
 */
export async function logout() {
    const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(
            'Abmeldung fehlgeschlagen.'
        );
    }

    return response.json();
}