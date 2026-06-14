import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import logo from '../assets/montessori.png';
import './MainLayout.css';

function MainLayout() {
    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="header-brand">
                    <img src={logo} alt="Montessori Logo" className="header-logo" />
                    <h1 className="header-title">Anwesenheitsliste</h1>
                </div>
            </header>
            <nav className="main-nav">
                <NavLink to="/" end>Startseite</NavLink>
                <NavLink to="/gesamtuebersicht">Gesamtübersicht</NavLink>
                <NavLink to="/kurse">Kurse</NavLink>
                <NavLink to="/anwesenheit">Anwesenheit</NavLink>
                <NavLink to="/import">Import</NavLink>
            </nav>
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}

export default MainLayout;
