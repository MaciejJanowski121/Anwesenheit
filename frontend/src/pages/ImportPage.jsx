import React, { useState } from 'react';

import {
    importStudentsFromExcel,
    importKurseFromExcel
} from '../services/importService';

import './ImportPage.css';

function ImportPage() {
    const [studentFile, setStudentFile] = useState(null);
    const [kursFile, setKursFile] = useState(null);

    const [studentMessage, setStudentMessage] = useState('');
    const [kursMessage, setKursMessage] = useState('');

    const [studentLoading, setStudentLoading] = useState(false);
    const [kursLoading, setKursLoading] = useState(false);

    const handleStudentImport = async () => {
        if (!studentFile) {
            setStudentMessage(
                'Bitte eine Schüler-Excel-Datei auswählen.'
            );

            return;
        }

        try {
            setStudentLoading(true);
            setStudentMessage('');

            await importStudentsFromExcel(studentFile);

            setStudentMessage(
                'Schülerimport erfolgreich.'
            );
        } catch (error) {
            console.error(error);

            setStudentMessage(
                'Fehler beim Schülerimport.'
            );
        } finally {
            setStudentLoading(false);
        }
    };

    const handleKursImport = async () => {
        if (!kursFile) {
            setKursMessage(
                'Bitte eine Kurs-Excel-Datei auswählen.'
            );

            return;
        }

        try {
            setKursLoading(true);
            setKursMessage('');

            await importKurseFromExcel(kursFile);

            setKursMessage(
                'Kursimport erfolgreich.'
            );
        } catch (error) {
            console.error(error);

            setKursMessage(
                'Fehler beim Kursimport.'
            );
        } finally {
            setKursLoading(false);
        }
    };

    return (
        <div className="import-page">

            <header className="page-header">
                <div className="page-header-content">
                    <h1>Import</h1>

                    <p>
                        Schüler- und Kursdaten aus Excel-Dateien importieren
                    </p>
                </div>
            </header>

            <section className="import-grid">

                <div className="import-card">
                    <div className="import-card-header">
                        <div>
                            <h2>
                                Schüler importieren
                            </h2>

                            <p>
                                Importieren Sie Schülerdaten
                                aus einer Excel-Datei.
                            </p>
                        </div>

                        <span className="import-card-badge">
                            Schüler
                        </span>
                    </div>

                    <div className="import-card-content">
                        <label
                            className="import-file-label"
                            htmlFor="student-file"
                        >
                            Excel-Datei auswählen
                        </label>

                        <input
                            id="student-file"
                            className="file-input"
                            type="file"
                            accept=".xlsx,.xlsm"
                            onChange={(event) =>
                                setStudentFile(
                                    event.target.files[0] || null
                                )
                            }
                        />

                        {studentFile && (
                            <div className="import-file-info">
                                Ausgewählt:
                                <strong>
                                    {studentFile.name}
                                </strong>
                            </div>
                        )}

                        <button
                            type="button"
                            className="import-button"
                            onClick={handleStudentImport}
                            disabled={studentLoading}
                        >
                            {studentLoading
                                ? 'Import läuft...'
                                : 'Schüler importieren'}
                        </button>

                        {studentMessage && (
                            <div className="import-message">
                                {studentMessage}
                            </div>
                        )}
                    </div>
                </div>

                <div className="import-card">
                    <div className="import-card-header">
                        <div>
                            <h2>
                                Kurse importieren
                            </h2>

                            <p>
                                Importieren Sie Kursdaten
                                aus einer Excel-Datei.
                            </p>
                        </div>

                        <span className="import-card-badge">
                            Kurse
                        </span>
                    </div>

                    <div className="import-card-content">
                        <label
                            className="import-file-label"
                            htmlFor="kurs-file"
                        >
                            Excel-Datei auswählen
                        </label>

                        <input
                            id="kurs-file"
                            className="file-input"
                            type="file"
                            accept=".xlsx,.xlsm"
                            onChange={(event) =>
                                setKursFile(
                                    event.target.files[0] || null
                                )
                            }
                        />

                        {kursFile && (
                            <div className="import-file-info">
                                Ausgewählt:
                                <strong>
                                    {kursFile.name}
                                </strong>
                            </div>
                        )}

                        <button
                            type="button"
                            className="import-button"
                            onClick={handleKursImport}
                            disabled={kursLoading}
                        >
                            {kursLoading
                                ? 'Import läuft...'
                                : 'Kurse importieren'}
                        </button>

                        {kursMessage && (
                            <div className="import-message">
                                {kursMessage}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ImportPage;