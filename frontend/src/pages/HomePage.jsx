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

    useEffect(() => {
        Promise.all([
            getStudents(),
            getKurse()
        ])
            .then(([students, kurse]) => {
                const klassen = new Set(
                    students.map((student) => student.klasse).filter(Boolean)
                );

                setStats({
                    studentsTotal: students.length,
                    klassenTotal: klassen.size,
                    kurseTotal: kurse.length,
                    gehtUm1530: students.filter((student) => student.gehtUm1530).length
                });
            })
            .catch((error) => {
                console.error('Fehler beim Laden der Dashboard-Daten:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const today = new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="home-page">
            <section className="welcome-section">
                <h2>Willkommen zur Anwesenheitsverwaltung</h2>
                <p className="welcome-date">{today}</p>
                <p>
                    Übersicht über Schülerdaten, Kurse und Anwesenheiten
                    der Montessori Schule Augsburg.
                </p>
            </section>

            <section className="dashboard-stats">
                <div className="stat-card">
                    <span className="stat-icon">S</span>
                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? '...' : stats.studentsTotal}
                        </span>
                        <span className="stat-label">Schüler gesamt</span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">K</span>
                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? '...' : stats.klassenTotal}
                        </span>
                        <span className="stat-label">Klassen</span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">C</span>
                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? '...' : stats.kurseTotal}
                        </span>
                        <span className="stat-label">Kurse</span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">15</span>
                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? '...' : stats.gehtUm1530}
                        </span>
                        <span className="stat-label">Gehen um 15:30</span>
                    </div>
                </div>
            </section>

            <section className="dashboard-sections">
                <div className="dashboard-panel">
                    <h3>Schnellzugriffe</h3>

                    <div className="quick-actions">
                        <Link to="/anwesenheit" className="quick-action-btn">
                            Anwesenheit erfassen
                        </Link>

                        <Link to="/gesamtuebersicht" className="quick-action-btn">
                            Schüler verwalten
                        </Link>

                        <Link to="/kurse" className="quick-action-btn">
                            Kurse verwalten
                        </Link>

                        <Link to="/import" className="quick-action-btn">
                            Excel importieren
                        </Link>
                    </div>
                </div>

                <div className="dashboard-panel">
                    <h3>Aktueller Stand</h3>

                    <div className="dashboard-summary">
                        <p>
                            Die Schülerdaten, Kurse und Kurszuordnungen werden
                            aus der Excel-Datei importiert.
                        </p>

                        <p>
                            Die Anwesenheit kann kursbezogen erfasst und im Verlauf
                            später kontrolliert werden.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;