import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import logo from '../assets/montessori.png';
import './MainLayout.css';

function MainLayout() {

    // Zapisany motyw lub domyślnie "dark"
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    // Ustawienie motywu dla całej aplikacji
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Przełączanie light <-> dark
    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === 'dark' ? 'light' : 'dark'
        );
    };

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

                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    type="button"
                    title={
                        theme === 'dark'
                            ? 'Helles Design'
                            : 'Dunkles Design'
                    }
                    aria-label="Design wechseln"
                >
                    <span className="theme-icon">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </span>

                    <span className="theme-text">
                        {theme === 'dark' ? 'Hell' : 'Dunkel'}
                    </span>
                </button>

            </header>

            <div className="main-nav-wrapper">

                <nav className="main-nav">

                    <NavLink to="/" end>
                        Startseite
                    </NavLink>

                    <NavLink to="/gesamtuebersicht">
                        Gesamtübersicht
                    </NavLink>

                    <NavLink to="/kurse">
                        Kurse
                    </NavLink>

                    <NavLink to="/anwesenheit">
                        Anwesenheit
                    </NavLink>

                    <NavLink to="/zuschuesse">
                        Zuschüsse
                    </NavLink>

                    <NavLink to="/gebuehren">
                        Gebühren
                    </NavLink>

                    <NavLink to="/import">
                        Import
                    </NavLink>

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