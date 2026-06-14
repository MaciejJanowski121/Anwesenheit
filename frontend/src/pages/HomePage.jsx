import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudents } from '../services/studentService';
import './HomePage.css';

function HomePage() {

    const [stats, setStats] = useState({
        total: 0,
        klassen: 0,
        mittagessen: 0,
        gehtUm1530: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        getStudents()
            .then((data) => {

                const klassen = new Set(
                    data.map(student => student.klasse).filter(Boolean)
                );

                setStats({
                    total: data.length,
                    klassen: klassen.size,
                    mittagessen: data.filter(student => student.mittagessen).length,
                    gehtUm1530: data.filter(student => student.gehtUm1530).length
                });

            })
            .catch((error) => {
                console.error("Fehler beim Laden der Statistik:", error);
            })
            .finally(() => {
                setLoading(false);
            });

    }, []);

    const today = new Date().toLocaleDateString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return (
        <div className="home-page">

            <div className="welcome-section">
                <h2>Willkommen zur Anwesenheitsverwaltung</h2>
                <p className="welcome-date">{today}</p>
                <p>
                    Verwaltung von Schülern, Kursen und Anwesenheiten
                    an einem zentralen Ort.
                </p>
            </div>

            <div className="dashboard-stats">

                <div className="stat-card">
                    <span className="stat-icon">S</span>

                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? "..." : stats.total}
                        </span>

                        <span className="stat-label">
                            Schüler gesamt
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">K</span>

                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? "..." : stats.klassen}
                        </span>

                        <span className="stat-label">
                            Klassen
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">M</span>

                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? "..." : stats.mittagessen}
                        </span>

                        <span className="stat-label">
                            Mittagessen
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">15</span>

                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? "..." : stats.gehtUm1530}
                        </span>

                        <span className="stat-label">
                            Gehen um 15:30
                        </span>
                    </div>
                </div>

            </div>

            <div className="dashboard-sections">

                <div className="dashboard-panel">
                    <h3>Schnellzugriffe</h3>

                    <div className="quick-actions">

                        <Link
                            to="/import"
                            className="quick-action-btn"
                        >
                            Excel importieren
                        </Link>

                        <Link
                            to="/gesamtuebersicht"
                            className="quick-action-btn"
                        >
                            Neuen Schüler anlegen
                        </Link>

                        <Link
                            to="/anwesenheit"
                            className="quick-action-btn"
                        >
                            Anwesenheit erfassen
                        </Link>

                    </div>
                </div>

                <div className="dashboard-panel">
                    <h3>Letzte Aktivitäten</h3>

                    <p className="placeholder-text">
                        Noch keine Aktivitäten erfasst.
                    </p>
                </div>

            </div>

        </div>
    );
}

export default HomePage;