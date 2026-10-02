const API_URL = '/api/users';

async function handleResponse(response) {
    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            'Ein Fehler ist aufgetreten.'
        );
    }

    return data;
}

export async function getUsers() {
    const response = await fetch(
        API_URL,
        {
            method: 'GET',
            credentials: 'include'
        }
    );

    return handleResponse(response);
}

export async function createUser(user) {
    const response = await fetch(
        API_URL,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(user)
        }
    );

    return handleResponse(response);
}

export async function updateUser(id, user) {
    const response = await fetch(
        `${API_URL}/${id}`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(user)
        }
    );

    return handleResponse(response);
}

export async function changeUserPassword(
    id,
    password
) {
    const response = await fetch(
        `${API_URL}/${id}/password`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                password
            })
        }
    );

    return handleResponse(response);
}

export async function deleteUser(id) {
    const response = await fetch(
        `${API_URL}/${id}`,
        {
            method: 'DELETE',
            credentials: 'include'
        }
    );

    return handleResponse(response);
}