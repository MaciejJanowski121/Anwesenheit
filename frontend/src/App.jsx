import React, { useEffect, useState } from 'react';

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import MainLayout from './components/MainLayout';

import HomePage from './pages/HomePage';
import GesamtuebersichtPage from './pages/GesamtuebersichtPage';
import KursePage from './pages/KursePage';
import AnwesenheitPage from './pages/AnwesenheitPage';
import ImportPage from './pages/ImportPage';
import StudentDetailsPage from './pages/StudentDetailsPage';
import GebuehrenPage from './pages/GebuehrenPage';
import ZuschuessePage from './pages/ZuschuessePage';
import KursDetailsPage from './pages/KursDetailsPage';
import LoginPage from './pages/LoginPage';

import KursinfosPage from './pages/KursinfosPage';
import KursinfoDetailsPage from './pages/KursinfoDetailsPage';

import BenutzerPage from './pages/BenutzerPage';

import {
    getCurrentUser,
    logout
} from './services/authService';

import './App.css';

function App() {

    const [user, setUser] =
        useState(null);

    const [authLoading, setAuthLoading] =
        useState(true);


    /* =====================================================
       SESSION PRÜFEN
       ===================================================== */

    useEffect(() => {

        const checkAuthentication =
            async () => {

                try {

                    const currentUser =
                        await getCurrentUser();

                    setUser(
                        currentUser
                    );

                } catch (error) {

                    console.error(
                        'Benutzer konnte nicht geprüft werden:',
                        error
                    );

                    setUser(null);

                } finally {

                    setAuthLoading(
                        false
                    );
                }
            };

        checkAuthentication();

    }, []);


    /* =====================================================
       LOGIN
       ===================================================== */

    const handleLogin = (
        loggedInUser
    ) => {

        setUser(
            loggedInUser
        );
    };


    /* =====================================================
       LOGOUT
       ===================================================== */

    const handleLogout =
        async () => {

            try {

                await logout();

            } catch (error) {

                console.error(
                    'Fehler beim Abmelden:',
                    error
                );

            } finally {

                setUser(null);
            }
        };


    /* =====================================================
       LOADING
       ===================================================== */

    if (authLoading) {

        return (

            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                Anwendung wird geladen...
            </div>
        );
    }


    /* =====================================================
       NICHT ANGEMELDET
       ===================================================== */

    if (!user) {

        return (

            <LoginPage
                onLogin={
                    handleLogin
                }
            />
        );
    }


    /* =====================================================
       ROLLE
       ===================================================== */

    const isAdmin =
        user.role === 'ADMIN';


    /* =====================================================
       ROUTING
       ===================================================== */

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    element={
                        <MainLayout
                            user={user}
                            onLogout={
                                handleLogout
                            }
                        />
                    }
                >

                    {/* =====================================
                        NUR ADMIN
                       ===================================== */}

                    {isAdmin && (

                        <>

                            <Route
                                path="/"
                                element={
                                    <HomePage />
                                }
                            />

                            <Route
                                path="/gesamtuebersicht"
                                element={
                                    <GesamtuebersichtPage />
                                }
                            />

                            <Route
                                path="/kurse"
                                element={
                                    <KursePage />
                                }
                            />

                            <Route
                                path="/kurse/:id"
                                element={
                                    <KursDetailsPage />
                                }
                            />

                            <Route
                                path="/gebuehren"
                                element={
                                    <GebuehrenPage />
                                }
                            />

                            <Route
                                path="/import"
                                element={
                                    <ImportPage />
                                }
                            />

                            <Route
                                path="/students/:id"
                                element={
                                    <StudentDetailsPage />
                                }
                            />

                            <Route
                                path="/zuschuesse"
                                element={
                                    <ZuschuessePage />
                                }
                            />

                            <Route
                                path="/benutzer"
                                element={
                                    <BenutzerPage />
                                }
                            />

                        </>

                    )}


                    {/* =====================================
                        ADMIN + ANWENDER
                       ===================================== */}

                    <Route
                        path="/anwesenheit"
                        element={
                            <AnwesenheitPage />
                        }
                    />

                    <Route
                        path="/kursinfos"
                        element={
                            <KursinfosPage />
                        }
                    />

                    <Route
                        path="/kursinfos/:id"
                        element={
                            <KursinfoDetailsPage />
                        }
                    />


                    {/* =====================================
                        FALLBACK
                       ===================================== */}

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to={
                                    isAdmin
                                        ? '/'
                                        : '/anwesenheit'
                                }
                                replace
                            />
                        }
                    />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default App;