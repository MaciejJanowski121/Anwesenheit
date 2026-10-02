import React, { useState } from 'react';
import { login } from '../services/authService';
import logo from '../assets/montessori.png';
import './LoginPage.css';

function LoginPage({ onLogin }) {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!username.trim() || !password) {
            setError(
                'Bitte Benutzername und Passwort eingeben.'
            );
            return;
        }

        try {
            setLoading(true);
            setError('');

            const user = await login(
                username.trim(),
                password
            );

            onLogin(user);

        } catch (error) {
            setError(
                error.message ||
                'Anmeldung fehlgeschlagen.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-card">

                <div className="login-header">

                    <img
                        src={logo}
                        alt="Montessori Logo"
                        className="login-logo"
                    />

                    <h1>
                        Anwesenheitsliste
                    </h1>

                    <p>
                        Bitte anmelden
                    </p>

                </div>

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >

                    <div className="login-field">
                        <label htmlFor="username">
                            Benutzername
                        </label>

                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value
                                )
                            }
                            autoComplete="username"
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">
                            Passwort
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? 'Anmeldung...'
                            : 'Anmelden'}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default LoginPage;