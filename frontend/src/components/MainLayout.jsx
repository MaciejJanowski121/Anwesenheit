import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import logo from '../assets/montessori.png';
import './MainLayout.css';

function MainLayout() {
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