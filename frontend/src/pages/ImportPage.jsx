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

    const handleStudentImport = async () => {
        if (!studentFile) {
            setStudentMessage('Bitte eine Schüler-Excel-Datei auswählen.');
            return;
        }

        try {
            await importStudentsFromExcel(studentFile);
            setStudentMessage('Schülerimport erfolgreich.');
        } catch (error) {
            console.error(error);
            setStudentMessage('Fehler beim Schülerimport.');
        }
    };

    const handleKursImport = async () => {
        if (!kursFile) {
            setKursMessage('Bitte eine Kurs-Excel-Datei auswählen.');
            return;
        }

        try {
            await importKurseFromExcel(kursFile);
            setKursMessage('Kursimport erfolgreich.');
        } catch (error) {
            console.error(error);
            setKursMessage('Fehler beim Kursimport.');
        }
    };

    return (
        <div className="import-page">
            <h2>Excel Import</h2>

            <div className="import-grid">
                <div className="import-card">
                    <h3>Schüler importieren</h3>

                    <p>
                        Wählen Sie die Datei Schülerimport.xlsx aus, um
                        Schülerdaten zu importieren.
                    </p>

                    <input
                        className="file-input"
                        type="file"
                        accept=".xlsx,.xlsm"
                        onChange={(e) => setStudentFile(e.target.files[0])}
                    />

                    <button
                        className="import-button"
                        onClick={handleStudentImport}
                    >
                        Schüler importieren
                    </button>

                    {studentMessage && (
                        <p className="import-message">
                            {studentMessage}
                        </p>
                    )}
                </div>

                <div className="import-card">
                    <h3>Kurse importieren</h3>

                    <p>
                        Wählen Sie die Datei Kursliste Import.xlsx aus, um
                        Kursdaten zu importieren.
                    </p>

                    <input
                        className="file-input"
                        type="file"
                        accept=".xlsx,.xlsm"
                        onChange={(e) => setKursFile(e.target.files[0])}
                    />

                    <button
                        className="import-button"
                        onClick={handleKursImport}
                    >
                        Kurse importieren
                    </button>

                    {kursMessage && (
                        <p className="import-message">
                            {kursMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ImportPage;