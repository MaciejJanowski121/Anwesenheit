import React, {
    useEffect,
    useState
} from 'react';

import {
    getUsers,
    createUser,
    updateUser,
    changeUserPassword,
    deleteUser
} from '../services/userService';

import './BenutzerPage.css';

const emptyNewUser = {
    username: '',
    password: '',
    role: 'ANWENDER'
};

function BenutzerPage() {

    const [users, setUsers] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [showCreate, setShowCreate] =
        useState(false);

    const [newUser, setNewUser] =
        useState(emptyNewUser);

    const [editingUser, setEditingUser] =
        useState(null);

    const [passwordUser, setPasswordUser] =
        useState(null);

    const [newPassword, setNewPassword] =
        useState('');


    /* =====================================================
       BENUTZER LADEN
       ===================================================== */

    const loadUsers = async () => {

        try {

            setLoading(true);
            setError('');

            const data =
                await getUsers();

            setUsers(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        loadUsers();

    }, []);


    /* =====================================================
       MELDUNGEN
       ===================================================== */

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };


    /* =====================================================
       BENUTZER ERSTELLEN
       ===================================================== */

    const handleCreate = async (
        event
    ) => {

        event.preventDefault();

        clearMessages();

        try {

            await createUser(
                newUser
            );

            setSuccess(
                'Der Benutzer wurde erstellt.'
            );

            setNewUser(
                emptyNewUser
            );

            setShowCreate(false);

            await loadUsers();

        } catch (error) {

            setError(
                error.message
            );
        }
    };


    /* =====================================================
       BENUTZER BEARBEITEN
       ===================================================== */

    const startEdit = (user) => {

        clearMessages();

        setEditingUser({
            ...user
        });
    };


    const handleUpdate = async (
        event
    ) => {

        event.preventDefault();

        clearMessages();

        try {

            await updateUser(
                editingUser.id,
                {
                    username:
                    editingUser.username,

                    role:
                    editingUser.role,

                    enabled:
                    editingUser.enabled
                }
            );

            setEditingUser(null);

            setSuccess(
                'Der Benutzer wurde aktualisiert.'
            );

            await loadUsers();

        } catch (error) {

            setError(
                error.message
            );
        }
    };


    /* =====================================================
       PASSWORT
       ===================================================== */

    const startPasswordChange = (
        user
    ) => {

        clearMessages();

        setPasswordUser(
            user
        );

        setNewPassword('');
    };


    const handlePasswordChange =
        async (event) => {

            event.preventDefault();

            clearMessages();

            if (
                newPassword.length < 8
            ) {

                setError(
                    'Das Passwort muss mindestens 8 Zeichen lang sein.'
                );

                return;
            }

            try {

                await changeUserPassword(
                    passwordUser.id,
                    newPassword
                );

                setPasswordUser(null);

                setNewPassword('');

                setSuccess(
                    'Das Passwort wurde geändert.'
                );

            } catch (error) {

                setError(
                    error.message
                );
            }
        };


    /* =====================================================
       BENUTZER LÖSCHEN
       ===================================================== */

    const handleDelete = async (
        user
    ) => {

        clearMessages();

        const confirmed =
            window.confirm(
                `Benutzer "${user.username}" wirklich löschen?`
            );

        if (!confirmed) {
            return;
        }

        try {

            await deleteUser(
                user.id
            );

            setSuccess(
                'Der Benutzer wurde gelöscht.'
            );

            await loadUsers();

        } catch (error) {

            setError(
                error.message
            );
        }
    };


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="benutzer-page">

            <header className="page-header">

                <div className="page-header-content">

                    <h1>
                        Benutzerverwaltung
                    </h1>

                    <p>
                        Benutzer und Zugriffsrechte verwalten
                    </p>

                </div>

                <button
                    type="button"
                    className="benutzer-primary-button"
                    onClick={() => {

                        clearMessages();

                        setShowCreate(
                            true
                        );
                    }}
                >
                    + Benutzer hinzufügen
                </button>

            </header>


            {error && (

                <div className="benutzer-message benutzer-error">
                    {error}
                </div>

            )}


            {success && (

                <div className="benutzer-message benutzer-success">
                    {success}
                </div>

            )}


            {/* =============================================
                NEUER BENUTZER
               ============================================= */}

            {showCreate && (

                <section className="benutzer-card">

                    <h2>
                        Neuer Benutzer
                    </h2>

                    <form
                        className="benutzer-form"
                        onSubmit={
                            handleCreate
                        }
                    >

                        <label>
                            Benutzername

                            <input
                                type="text"
                                value={
                                    newUser.username
                                }
                                onChange={
                                    (event) =>
                                        setNewUser({
                                            ...newUser,
                                            username:
                                            event.target.value
                                        })
                                }
                                required
                                autoFocus
                            />
                        </label>


                        <label>
                            Passwort

                            <input
                                type="password"
                                value={
                                    newUser.password
                                }
                                onChange={
                                    (event) =>
                                        setNewUser({
                                            ...newUser,
                                            password:
                                            event.target.value
                                        })
                                }
                                minLength="8"
                                required
                            />
                        </label>


                        <label>
                            Rolle

                            <select
                                value={
                                    newUser.role
                                }
                                onChange={
                                    (event) =>
                                        setNewUser({
                                            ...newUser,
                                            role:
                                            event.target.value
                                        })
                                }
                            >
                                <option value="ANWENDER">
                                    Anwender
                                </option>

                                <option value="ADMIN">
                                    Administrator
                                </option>
                            </select>
                        </label>


                        <div className="benutzer-form-actions">

                            <button
                                type="submit"
                                className="benutzer-primary-button"
                            >
                                Speichern
                            </button>

                            <button
                                type="button"
                                className="benutzer-secondary-button"
                                onClick={() => {

                                    setShowCreate(
                                        false
                                    );

                                    setNewUser(
                                        emptyNewUser
                                    );
                                }}
                            >
                                Abbrechen
                            </button>

                        </div>

                    </form>

                </section>

            )}


            {/* =============================================
                LISTE
               ============================================= */}

            <section className="benutzer-card">

                <div className="benutzer-card-header">

                    <div>

                        <h2>
                            Benutzer
                        </h2>

                        <p>
                            {users.length}{' '}
                            {users.length === 1
                                ? 'Benutzer'
                                : 'Benutzer'}
                        </p>

                    </div>

                </div>


                <div className="benutzer-table-scroll">

                    <table className="benutzer-table">

                        <thead>

                        <tr>
                            <th>
                                Benutzername
                            </th>

                            <th>
                                Rolle
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Aktionen
                            </th>
                        </tr>

                        </thead>


                        <tbody>

                        {loading ? (

                            <tr>

                                <td
                                    colSpan="4"
                                    className="benutzer-empty"
                                >
                                    Benutzer werden geladen...
                                </td>

                            </tr>

                        ) : users.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="4"
                                    className="benutzer-empty"
                                >
                                    Keine Benutzer vorhanden.
                                </td>

                            </tr>

                        ) : (

                            users.map(
                                (user) => (

                                    <tr
                                        key={
                                            user.id
                                        }
                                    >

                                        <td>
                                            <strong>
                                                {user.username}
                                            </strong>
                                        </td>

                                        <td>
                                            {user.role === 'ADMIN'
                                                ? 'Administrator'
                                                : 'Anwender'}
                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    user.enabled
                                                        ? 'benutzer-status aktiv'
                                                        : 'benutzer-status inaktiv'
                                                }
                                            >
                                                {user.enabled
                                                    ? 'Aktiv'
                                                    : 'Inaktiv'}
                                            </span>

                                        </td>

                                        <td>

                                            <div className="benutzer-actions">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startEdit(
                                                            user
                                                        )
                                                    }
                                                >
                                                    Bearbeiten
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        startPasswordChange(
                                                            user
                                                        )
                                                    }
                                                >
                                                    Passwort
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() =>
                                                        handleDelete(
                                                            user
                                                        )
                                                    }
                                                >
                                                    Löschen
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                        </tbody>

                    </table>

                </div>

            </section>


            {/* =============================================
                BEARBEITEN
               ============================================= */}

            {editingUser && (

                <div className="benutzer-modal-backdrop">

                    <div className="benutzer-modal">

                        <h2>
                            Benutzer bearbeiten
                        </h2>

                        <form
                            className="benutzer-form"
                            onSubmit={
                                handleUpdate
                            }
                        >

                            <label>
                                Benutzername

                                <input
                                    type="text"
                                    value={
                                        editingUser.username
                                    }
                                    onChange={
                                        (event) =>
                                            setEditingUser({
                                                ...editingUser,
                                                username:
                                                event.target.value
                                            })
                                    }
                                    required
                                />
                            </label>


                            <label>
                                Rolle

                                <select
                                    value={
                                        editingUser.role
                                    }
                                    onChange={
                                        (event) =>
                                            setEditingUser({
                                                ...editingUser,
                                                role:
                                                event.target.value
                                            })
                                    }
                                >
                                    <option value="ANWENDER">
                                        Anwender
                                    </option>

                                    <option value="ADMIN">
                                        Administrator
                                    </option>
                                </select>
                            </label>


                            <label className="benutzer-checkbox">

                                <input
                                    type="checkbox"
                                    checked={
                                        Boolean(
                                            editingUser.enabled
                                        )
                                    }
                                    onChange={
                                        (event) =>
                                            setEditingUser({
                                                ...editingUser,
                                                enabled:
                                                event.target.checked
                                            })
                                    }
                                />

                                Benutzer aktiv

                            </label>


                            <div className="benutzer-form-actions">

                                <button
                                    type="submit"
                                    className="benutzer-primary-button"
                                >
                                    Speichern
                                </button>

                                <button
                                    type="button"
                                    className="benutzer-secondary-button"
                                    onClick={() =>
                                        setEditingUser(
                                            null
                                        )
                                    }
                                >
                                    Abbrechen
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* =============================================
                PASSWORT ÄNDERN
               ============================================= */}

            {passwordUser && (

                <div className="benutzer-modal-backdrop">

                    <div className="benutzer-modal">

                        <h2>
                            Passwort ändern
                        </h2>

                        <p>
                            Benutzer:{' '}
                            <strong>
                                {passwordUser.username}
                            </strong>
                        </p>

                        <form
                            className="benutzer-form"
                            onSubmit={
                                handlePasswordChange
                            }
                        >

                            <label>
                                Neues Passwort

                                <input
                                    type="password"
                                    value={
                                        newPassword
                                    }
                                    onChange={
                                        (event) =>
                                            setNewPassword(
                                                event.target.value
                                            )
                                    }
                                    minLength="8"
                                    required
                                    autoFocus
                                />
                            </label>


                            <div className="benutzer-form-actions">

                                <button
                                    type="submit"
                                    className="benutzer-primary-button"
                                >
                                    Passwort ändern
                                </button>

                                <button
                                    type="button"
                                    className="benutzer-secondary-button"
                                    onClick={() => {

                                        setPasswordUser(
                                            null
                                        );

                                        setNewPassword('');
                                    }}
                                >
                                    Abbrechen
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default BenutzerPage;