import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getStudents } from '../services/studentService';
import { getKurse } from '../services/kursService';

import './HomePage.css';

function HomePage() {
    const [stats, setStats] = useState({
        studentsTotal: 0,
        klassenTotal: 0,
        kurseTotal: 0,
        gehtUm1530: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError('');

            const [students, kurse] = await Promise.all([
                getStudents(),
                getKurse()
            ]);

            const safeStudents = Array.isArray(students)
                ? students
                : [];

            const safeKurse = Array.isArray(kurse)
                ? kurse
                : [];

            const klassen = new Set(
                safeStudents
                    .map((student) => student.klasse)
                    .filter(Boolean)
            );

            setStats({
                studentsTotal: safeStudents.length,
                klassenTotal: klassen.size,
                kurseTotal: safeKurse.length,
                gehtUm1530: safeStudents.filter(
                    (student) => student.gehtUm1530
                ).length
            });
        } catch (error) {
            console.error(
                'Fehler beim Laden der Dashboard-Daten:',
                error
            );

            setError(
                'Die Dashboard-Daten konnten nicht geladen werden.'
            );
        } finally {
            setLoading(false);
        }
    };

    const today = new Date().toLocaleDateString(
        'de-DE',
        {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
    );

    return (
        <div className="home-page">

            <header className="page-header">
                <div className="page-header-content">
                    <h1>Startseite</h1>

                    <p>
                        Übersicht über Schülerdaten,
                        Kurse und Anwesenheiten
                    </p>
                </div>

                <span className="home-date">
                    {today}
                </span>
            </header>

            {error && (
                <div className="home-error">
                    {error}
                </div>
            )}

            <section className="home-welcome">
                <div>
                    <h2>
                        Willkommen zur Anwesenheitsverwaltung
                    </h2>

                    <p>
                        Verwalten Sie Schüler,
                        Kurse, Anwesenheiten,
                        Gebühren und Zuschüsse
                        zentral an einem Ort.
                    </p>
                </div>
            </section>

            <section className="dashboard-stats">
                <div className="stat-card">
                    <span className="stat-icon">
                        S
                    </span>

                    <div className="stat-info">
                        <span className="stat-value">
                            {loading
                                ? '...'
                                : stats.studentsTotal}
                        </span>

                        <span className="stat-label">
                            Schüler gesamt
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">
                        K
                    </span>

                    <div className="stat-info">
                        <span className="stat-value">
                            {loading
                                ? '...'
                                : stats.klassenTotal}
                        </span>

                        <span className="stat-label">
                            Klassen
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">
                        C
                    </span>

                    <div className="stat-info">
                        <span className="stat-value">
                            {loading
                                ? '...'
                                : stats.kurseTotal}
                        </span>

                        <span className="stat-label">
                            Kurse
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">
                        15
                    </span>

                    <div className="stat-info">
                        <span className="stat-value">
                            {loading
                                ? '...'
                                : stats.gehtUm1530}
                        </span>

                        <span className="stat-label">
                            Gehen um 15:30
                        </span>
                    </div>
                </div>
            </section>

            <section className="dashboard-sections">

                <div className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div>
                            <h2>
                                Schnellzugriffe
                            </h2>

                            <p>
                                Häufig verwendete Funktionen
                            </p>
                        </div>
                    </div>

                    <div className="quick-actions">
                        <Link
                            to="/anwesenheit"
                            className="quick-action-btn"
                        >
                            <span>
                                Anwesenheit erfassen
                            </span>

                            <span className="quick-action-arrow">
                                →
                            </span>
                        </Link>

                        <Link
                            to="/gesamtuebersicht"
                            className="quick-action-btn"
                        >
                            <span>
                                Schüler verwalten
                            </span>

                            <span className="quick-action-arrow">
                                →
                            </span>
                        </Link>

                        <Link
                            to="/kurse"
                            className="quick-action-btn"
                        >
                            <span>
                                Kurse verwalten
                            </span>

                            <span className="quick-action-arrow">
                                →
                            </span>
                        </Link>

                        <Link
                            to="/import"
                            className="quick-action-btn"
                        >
                            <span>
                                Excel importieren
                            </span>

                            <span className="quick-action-arrow">
                                →
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <div>
                            <h2>
                                Aktueller Stand
                            </h2>

                            <p>
                                Funktionsübersicht der Anwendung
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-summary">
                        <div className="dashboard-summary-item">
                            <strong>
                                Schüler & Kurse
                            </strong>

                            <p>
                                Schülerdaten, Kurse und
                                Kurszuordnungen können importiert
                                und verwaltet werden.
                            </p>
                        </div>

                        <div className="dashboard-summary-item">
                            <strong>
                                Anwesenheit
                            </strong>

                            <p>
                                Anwesenheiten können kursbezogen
                                erfasst und im Verlauf kontrolliert
                                werden.
                            </p>
                        </div>

                        <div className="dashboard-summary-item">
                            <strong>
                                Gebühren & Zuschüsse
                            </strong>

                            <p>
                                Gebühren und Zuschussberechnungen
                                stehen ebenfalls zentral zur
                                Verfügung.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;