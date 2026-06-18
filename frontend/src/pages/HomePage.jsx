import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudents } from '../services/studentService';
import { getKurse } from '../services/kursService';
import { getAllAnwesenheiten } from '../services/anwesenheitService';
import './HomePage.css';

function HomePage() {
    const [stats, setStats] = useState({
        studentsTotal: 0,
        klassenTotal: 0,
        kurseTotal: 0,
        anwesenheitenToday: 0,
        fehltToday: 0
    });

    const [loading, setLoading] = useState(true);

    const todayIso = new Date().toISOString().split('T')[0];

    useEffect(() => {
        Promise.all([
            getStudents(),
            getKurse(),
            getAllAnwesenheiten()
        ])
            .then(([students, kurse, anwesenheiten]) => {
                const klassen = new Set(
                    students.map((student) => student.klasse).filter(Boolean)
                );

                const todayAnwesenheiten = anwesenheiten.filter(
                    (a) => a.datum === todayIso
                );

                setStats({
                    studentsTotal: students.length,
                    klassenTotal: klassen.size,
                    kurseTotal: kurse.length,
                    anwesenheitenToday: todayAnwesenheiten.length,
                    fehltToday: todayAnwesenheiten.filter((a) => a.status === 'FEHLT').length
                });
            })
            .catch((error) => {
                console.error('Fehler beim Laden der Dashboard-Daten:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [todayIso]);

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
                    Übersicht über Schülerdaten, Kursbuchungen und Anwesenheiten
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
                    <span className="stat-icon">A</span>
                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? '...' : stats.anwesenheitenToday}
                        </span>
                        <span className="stat-label">Anwesenheiten heute</span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon">F</span>
                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? '...' : stats.fehltToday}
                        </span>
                        <span className="stat-label">Fehlend heute</span>
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
                    <h3>Heute</h3>

                    <div className="dashboard-summary">
                        <p>
                            <strong>{loading ? '...' : stats.anwesenheitenToday}</strong>
                            {' '}Anwesenheitseinträge wurden heute gespeichert.
                        </p>

                        <p>
                            <strong>{loading ? '...' : stats.fehltToday}</strong>
                            {' '}Schüler wurden heute als fehlend markiert.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;