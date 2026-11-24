import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getStudents } from '../services/studentService';
import { getKurse } from '../services/kursService';

import {
    exportAbwesenheitPdf
} from '../services/exportService';

import './HomePage.css';


/* =====================================================
   HEUTIGES DATUM
   ===================================================== */

function getToday() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        now.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


/* =====================================================
   HOME PAGE
   ===================================================== */

function HomePage({ isAdmin = false }) {

    const [stats, setStats] = useState({
        studentsTotal: 0,
        klassenTotal: 0,
        kurseTotal: 0,
        gehtUm1530: 0
    });

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');


    /* =================================================
       PDF EXPORT
       ================================================= */

    const [exporting, setExporting] =
        useState(false);

    const [exportError, setExportError] =
        useState('');


    /* =================================================
       DASHBOARD LADEN

       Administrative Daten werden ausschließlich
       für Administratoren geladen.
       ================================================= */

    useEffect(() => {

        if (!isAdmin) {

            setLoading(false);

            return;
        }

        loadDashboard();

    }, [isAdmin]);


    const loadDashboard = async () => {

        try {

            setLoading(true);

            setError('');

            const [students, kurse] =
                await Promise.all([

                    getStudents(),

                    getKurse()

                ]);

            const safeStudents =
                Array.isArray(students)
                    ? students
                    : [];

            const safeKurse =
                Array.isArray(kurse)
                    ? kurse
                    : [];

            const klassen = new Set(

                safeStudents

                    .map((student) => student.klasse)

                    .filter(Boolean)
            );

            setStats({

                studentsTotal:
                safeStudents.length,

                klassenTotal:
                klassen.size,

                kurseTotal:
                safeKurse.length,

                gehtUm1530:
                safeStudents.filter(
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


    /* =================================================
       ABWESENHEITSLISTE HERUNTERLADEN
       ================================================= */

    const handleDownloadAbwesenheit = async () => {

        if (exporting) {

            return;
        }

        try {

            setExporting(true);

            setExportError('');

            await exportAbwesenheitPdf(
                getToday()
            );

        } catch (error) {

            console.error(
                'Fehler beim Export der Abwesenheitsliste:',
                error
            );

            setExportError(
                'Die Abwesenheitsliste konnte nicht heruntergeladen werden.'
            );

        } finally {

            setExporting(false);
        }
    };


    /* =================================================
       DATUM FORMATIEREN
       ================================================= */

    const today = new Date().toLocaleDateString(

        'de-DE',

        {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
    );


    /* =================================================
       RENDER
       ================================================= */

    return (

        <div className="home-page">

            {/* HEADER */}

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


            {/* FEHLERMELDUNGEN */}

            {error && (

                <div
                    className="home-error"
                    role="alert"
                >

                    {error}

                </div>

            )}


            {/* WILLKOMMEN */}

            <section className="home-welcome">

                <div>

                    <h2>
                        Willkommen zur Anwesenheitsverwaltung
                    </h2>

                    <p>

                        {isAdmin

                            ? 'Verwalten Sie Schüler, Kurse, Anwesenheiten, Gebühren und Zuschüsse zentral an einem Ort.'

                            : 'Hier finden Sie aktuelle Anwesenheiten, Schülerinformationen und Kursübersichten.'

                        }

                    </p>

                </div>

            </section>


            {/* =================================================
                ABWESENHEITSLISTE PDF
                ADMIN + ANWENDER
               ================================================= */}

            <section className="home-absence-section">

                <div className="home-absence-content">

                    <div
                        className="home-absence-icon"
                        aria-hidden="true"
                    >

                        PDF

                    </div>

                    <div className="home-absence-info">

                        <h2>
                            Aktuelle Abwesenheitsliste
                        </h2>

                        <p>
                            Laden Sie die Abwesenheitsliste
                            für den heutigen Tag herunter.
                        </p>

                        <span className="home-absence-date">

                            {today}

                        </span>

                    </div>

                </div>

                <button
                    type="button"
                    className="home-absence-download"
                    onClick={handleDownloadAbwesenheit}
                    disabled={exporting}
                    aria-busy={exporting}
                >

                    <span
                        className="home-download-icon"
                        aria-hidden="true"
                    >

                        ↓

                    </span>

                    {exporting

                        ? 'PDF wird erstellt...'

                        : 'Abwesenheitsliste herunterladen (PDF)'

                    }

                </button>

                {exportError && (

                    <div
                        className="home-error home-export-error"
                        role="alert"
                    >

                        {exportError}

                    </div>

                )}

            </section>


            {/* =================================================
                DASHBOARD STATISTIKEN
                NUR ADMIN
               ================================================= */}

            {isAdmin && (

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

            )}


            {/* =================================================
                DASHBOARD BEREICHE
               ================================================= */}

            <section className="dashboard-sections">

                {/* SCHNELLZUGRIFFE */}

                <div className="dashboard-panel">

                    <div className="dashboard-panel-header">

                        <div>

                            <h2>Schnellzugriffe</h2>

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
                            to={
                                isAdmin

                                    ? '/gesamtuebersicht'

                                    : '/schuelerinfos'
                            }
                            className="quick-action-btn"
                        >

                            <span>

                                {isAdmin

                                    ? 'Schüler verwalten'

                                    : 'Schülerinformationen'

                                }

                            </span>

                            <span className="quick-action-arrow">
                                →
                            </span>

                        </Link>


                        <Link
                            to={
                                isAdmin

                                    ? '/kurse'

                                    : '/kursinfos'
                            }
                            className="quick-action-btn"
                        >

                            <span>

                                {isAdmin

                                    ? 'Kurse verwalten'

                                    : 'ANA-Informationen'

                                }

                            </span>

                            <span className="quick-action-arrow">
                                →
                            </span>

                        </Link>


                        {isAdmin ? (

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

                        ) : (

                            <Link
                                to="/angebotinfos"
                                className="quick-action-btn"
                            >

                                <span>
                                    Angebotsinformationen
                                </span>

                                <span className="quick-action-arrow">
                                    →
                                </span>

                            </Link>

                        )}


                        <Link
                            to="/exporte"
                            className="quick-action-btn"
                        >

                            <span>
                                Exporte
                            </span>

                            <span className="quick-action-arrow">
                                →
                            </span>

                        </Link>

                    </div>

                </div>


                {/* FUNKTIONSÜBERSICHT */}

                <div className="dashboard-panel">

                    <div className="dashboard-panel-header">

                        <div>

                            <h2>Aktueller Stand</h2>

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

                                {isAdmin

                                    ? 'Schülerdaten, Kurse und Kurszuordnungen können importiert und verwaltet werden.'

                                    : 'Schülerdaten und Kursinformationen können eingesehen werden.'

                                }

                            </p>

                        </div>


                        <div className="dashboard-summary-item">

                            <strong>
                                Anwesenheit
                            </strong>

                            <p>
                                Anwesenheiten können erfasst
                                und im Verlauf kontrolliert werden.
                            </p>

                        </div>


                        <div className="dashboard-summary-item">

                            <strong>
                                Abwesenheitsliste
                            </strong>

                            <p>
                                Die aktuelle Abwesenheitsliste
                                steht täglich als PDF
                                zum Download bereit.
                            </p>

                        </div>


                        {isAdmin && (

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

                        )}

                    </div>

                </div>

            </section>

        </div>
    );
}

export default HomePage;