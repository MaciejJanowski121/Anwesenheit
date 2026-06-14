import React, { useState } from 'react';
import { importStudentsFromExcel } from '../services/importService';
import './ImportPage.css';

function ImportPage() {

    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    const handleImport = async () => {

        if (!file) {
            setMessage('Bitte eine Excel-Datei auswählen.');
            return;
        }

        try {

            await importStudentsFromExcel(file);

            setMessage('Import erfolgreich.');

        } catch (error) {

            console.error(error);

            setMessage('Fehler beim Import.');

        }
    };

    return (
        <div className="import-page">
            <div className="import-card">
                <h2>Excel Import</h2>

                <p>
                    Wählen Sie eine Excel-Datei aus, um Schülerdaten in die
                    Anwendung zu importieren.
                </p>

                <input
                    className="file-input"
                    type="file"
                    accept=".xlsx,.xlsm"
                    onChange={(e) => setFile(e.target.files[0])}
                />

                <br/>

                <button className="import-button" onClick={handleImport}>
                    Import starten
                </button>

                {message && <p className="import-message">{message}</p>}
            </div>
        </div>
    );
}
export default ImportPage;