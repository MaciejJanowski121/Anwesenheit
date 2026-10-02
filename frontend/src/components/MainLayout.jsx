import React, {
    useEffect,
    useState
} from 'react';

import {
    NavLink,
    Outlet
} from 'react-router-dom';

import logo from '../assets/montessori.png';

import './MainLayout.css';

function MainLayout({
                        user,
                        onLogout
                    }) {

    /* =====================================================
       THEME
       ===================================================== */

    const [theme, setTheme] =
        useState(() => {

            return (
                localStorage.getItem(
                    'theme'
                ) ||
                'dark'
            );
        });


    useEffect(() => {

        document.documentElement
            .setAttribute(
                'data-theme',
                theme
            );

        localStorage.setItem(
            'theme',
            theme
        );

    }, [theme]);


    const toggleTheme = () => {

        setTheme(
            (currentTheme) =>
                currentTheme === 'dark'
                    ? 'light'
                    : 'dark'
        );
    };


    /* =====================================================
       ROLLE
       ===================================================== */

    const isAdmin =
        user?.role === 'ADMIN';


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="app-layout">

            <header className="app-header">

                <div className="header-brand">

                    <img
                        src={logo}
                        alt="Montessori Logo"
                        className="header-logo"
                    />

                    <h1 className="header-title">
                        Anwesenheitsliste
                    </h1>

                </div>


                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}
                >

                    <div
                        style={{
                            color:
                                'var(--text-secondary)',
                            fontSize:
                                '0.85rem',
                            textAlign:
                                'right'
                        }}
                    >

                        <div>
                            {user?.username}
                        </div>

                        <div
                            style={{
                                color:
                                    'var(--text-muted)',
                                fontSize:
                                    '0.75rem'
                            }}
                        >

                            {isAdmin
                                ? 'Administrator'
                                : 'Anwender'}

                        </div>

                    </div>


                    <button
                        className="theme-toggle"
                        onClick={
                            toggleTheme
                        }
                        type="button"
                        title={
                            theme === 'dark'
                                ? 'Helles Design'
                                : 'Dunkles Design'
                        }
                        aria-label="Design wechseln"
                    >

                        <span className="theme-icon">

                            {theme === 'dark'
                                ? '☀️'
                                : '🌙'}

                        </span>

                        <span className="theme-text">

                            {theme === 'dark'
                                ? 'Hell'
                                : 'Dunkel'}

                        </span>

                    </button>


                    <button
                        className="theme-toggle"
                        onClick={
                            onLogout
                        }
                        type="button"
                        title="Abmelden"
                    >
                        Abmelden
                    </button>

                </div>

            </header>


            {/* =============================================
                NAVIGATION
               ============================================= */}

            <div className="main-nav-wrapper">

                <nav className="main-nav">

                    {isAdmin && (

                        <>

                            <NavLink
                                to="/"
                                end
                            >
                                Startseite
                            </NavLink>

                            <NavLink
                                to="/gesamtuebersicht"
                            >
                                Gesamtübersicht
                            </NavLink>

                            <NavLink
                                to="/kurse"
                            >
                                Kurse
                            </NavLink>

                        </>

                    )}


                    {/* ADMIN + ANWENDER */}

                    <NavLink
                        to="/anwesenheit"
                    >
                        Anwesenheit
                    </NavLink>

                    <NavLink
                        to="/kursinfos"
                    >
                        Kursinfos
                    </NavLink>


                    {isAdmin && (

                        <>

                            <NavLink
                                to="/zuschuesse"
                            >
                                Zuschüsse
                            </NavLink>

                            <NavLink
                                to="/gebuehren"
                            >
                                Gebühren
                            </NavLink>

                            <NavLink
                                to="/import"
                            >
                                Import
                            </NavLink>

                            <NavLink
                                to="/benutzer"
                            >
                                Benutzer
                            </NavLink>

                        </>

                    )}

                </nav>

            </div>


            <main className="app-main">

                <div className="app-content">

                    <Outlet />

                </div>

            </main>

        </div>
    );
}

export default MainLayout;