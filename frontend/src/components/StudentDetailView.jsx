import React, { useMemo, useState } from 'react';
import './StudentDetailView.css';

const WOCHENTAGE = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag'
];

function StudentDetailView({
                               student,
                               buchungen,
                               kurse,
                               anwesenheiten,
                               onAssignKurs,
                               onDeleteBuchung,
                               onUpdateGehtUm1530,
                               onClose
                           }) {
    const [selectedWochentag, setSelectedWochentag] = useState('');
    const [selectedKursId, setSelectedKursId] = useState('');

    const [gehtUm1530, setGehtUm1530] = useState(
        student.gehtUm1530 ?? false
    );

    const [saving1530, setSaving1530] = useState(false);

    /*
     * Zeigt nur die Kurse des ausgewählten Wochentags an.
     */
    const filteredKurse = useMemo(() => {
        if (!selectedWochentag) {
            return [];
        }

        return kurse.filter(
            (kurs) =>
                kurs.wochentag === selectedWochentag
        );
    }, [kurse, selectedWochentag]);

    /*
     * Wochentag für Kurszuweisung ändern.
     */
    const handleWochentagChange = (event) => {
        setSelectedWochentag(event.target.value);
        setSelectedKursId('');
    };

    /*
     * Kurs auswählen.
     */
    const handleKursChange = (event) => {
        setSelectedKursId(event.target.value);
    };

    /*
     * Kurs dem Schüler zuweisen.
     */
    const handleAssign = async () => {
        if (!selectedKursId) {
            return;
        }

        await onAssignKurs(selectedKursId);

        setSelectedKursId('');
    };

    /*
     * 15:30-Einstellung speichern.
     *
     * Der Wert wird direkt gespeichert,
     * sobald Ja oder Nein ausgewählt wird.
     */
    const handle1530Change = async (newValue) => {
        /*
         * Wenn bereits derselbe Wert gesetzt ist,
         * muss nichts gespeichert werden.
         */
        if (newValue === gehtUm1530) {
            return;
        }

        try {
            setSaving1530(true);

            /*
             * Erst Backend aktualisieren.
             */
            await onUpdateGehtUm1530(newValue);

            /*
             * Lokalen Zustand erst nach erfolgreichem
             * Speichern ändern.
             */
            setGehtUm1530(newValue);

        } catch (error) {
            console.error(
                '15:30-Einstellung konnte nicht gespeichert werden:',
                error
            );
        } finally {
            setSaving1530(false);
        }
    };

    return (
        <div className="student-detail-view">

            {/* =====================================================
                ZURÜCK
               ===================================================== */}

            <button
                type="button"
                className="back-button"
                onClick={onClose}
            >
                Zurück zur Übersicht
            </button>

            {/* =====================================================
                HEADER
               ===================================================== */}

            <div className="detail-header">
                <h2>
                    {student.nachname}, {student.vorname}
                </h2>

                <p>Schülerdetails</p>
            </div>

            {/* =====================================================
                ALLGEMEINE INFORMATIONEN
               ===================================================== */}

            <section className="detail-section">
                <h3>Allgemeine Informationen</h3>

                <div className="detail-grid">

                    {/* Vorname */}

                    <div className="detail-item">
                        <span className="detail-label">
                            Vorname
                        </span>

                        <span className="detail-value">
                            {student.vorname || '–'}
                        </span>
                    </div>

                    {/* Nachname */}

                    <div className="detail-item">
                        <span className="detail-label">
                            Nachname
                        </span>

                        <span className="detail-value">
                            {student.nachname || '–'}
                        </span>
                    </div>

                    {/* Jahrgang */}

                    <div className="detail-item">
                        <span className="detail-label">
                            Jahrgang
                        </span>

                        <span className="detail-value">
                            {student.jahrgang ?? '–'}
                        </span>
                    </div>

                    {/* Klasse */}

                    <div className="detail-item">
                        <span className="detail-label">
                            Klasse
                        </span>

                        <span className="detail-value">
                            {student.klasse || '–'}
                        </span>
                    </div>

                    {/* Fotofreigabe */}

                    <div className="detail-item">
                        <span className="detail-label">
                            Foto- und Bildfreigabe
                        </span>

                        <span className="detail-value">
                            {student.fotoFreigabe || '–'}
                        </span>
                    </div>

                    {/* =================================================
                        15:30 EINSTELLUNG
                       ================================================= */}

                    <div className="detail-item detail-item-1530">

                        <div className="detail-1530-header">

                            <span className="detail-label">
                                Geht um 15:30 Uhr
                            </span>

                            <div className="detail-1530-options">

                                {/* JA */}

                                <button
                                    type="button"
                                    className={
                                        gehtUm1530
                                            ? 'detail-1530-option active'
                                            : 'detail-1530-option'
                                    }
                                    disabled={saving1530}
                                    onClick={() =>
                                        handle1530Change(true)
                                    }
                                >
                                    Ja
                                </button>

                                {/* NEIN */}

                                <button
                                    type="button"
                                    className={
                                        !gehtUm1530
                                            ? 'detail-1530-option active'
                                            : 'detail-1530-option'
                                    }
                                    disabled={saving1530}
                                    onClick={() =>
                                        handle1530Change(false)
                                    }
                                >
                                    Nein
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                KONTAKT 1
               ===================================================== */}

            <section className="detail-section">
                <h3>Kontakt 1</h3>

                <div className="detail-grid">

                    <div className="detail-item">
                        <span className="detail-label">
                            Email 1
                        </span>

                        <span className="detail-value">
                            {student.email1 || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Telefon 1
                        </span>

                        <span className="detail-value">
                            {student.telefon1 || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Mobil 1
                        </span>

                        <span className="detail-value">
                            {student.mobil1 || '–'}
                        </span>
                    </div>

                </div>
            </section>

            {/* =====================================================
                KONTAKT 2
               ===================================================== */}

            <section className="detail-section">
                <h3>Kontakt 2</h3>

                <div className="detail-grid">

                    <div className="detail-item">
                        <span className="detail-label">
                            Email 2
                        </span>

                        <span className="detail-value">
                            {student.email2 || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Telefon 2
                        </span>

                        <span className="detail-value">
                            {student.telefon2 || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Mobil 2
                        </span>

                        <span className="detail-value">
                            {student.mobil2 || '–'}
                        </span>
                    </div>

                </div>
            </section>

            {/* =====================================================
                KURSBUCHUNGEN
               ===================================================== */}

            <section className="detail-section">
                <h3>Kursbuchungen</h3>

                {/* Kurs hinzufügen */}

                <div className="assign-kurs-box">

                    {/* Wochentag */}

                    <div className="assign-kurs-field">
                        <label htmlFor="kurs-wochentag">
                            Wochentag
                        </label>

                        <select
                            id="kurs-wochentag"
                            value={selectedWochentag}
                            onChange={handleWochentagChange}
                        >
                            <option value="">
                                Wochentag auswählen...
                            </option>

                            {WOCHENTAGE.map((tag) => (
                                <option
                                    key={tag}
                                    value={tag}
                                >
                                    {tag}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Kurs */}

                    <div className="assign-kurs-field">
                        <label htmlFor="kurs-auswahl">
                            Kurs
                        </label>

                        <select
                            id="kurs-auswahl"
                            value={selectedKursId}
                            onChange={handleKursChange}
                            disabled={!selectedWochentag}
                        >
                            <option value="">
                                {!selectedWochentag
                                    ? 'Zuerst Wochentag auswählen...'
                                    : 'Kurs auswählen...'}
                            </option>

                            {filteredKurse.map((kurs) => (
                                <option
                                    key={kurs.id}
                                    value={kurs.id}
                                >
                                    {kurs.name}
                                    {kurs.uhrzeit
                                        ? ` | ${kurs.uhrzeit}`
                                        : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Hinzufügen */}

                    <button
                        type="button"
                        className="assign-kurs-button"
                        onClick={handleAssign}
                        disabled={!selectedKursId}
                    >
                        Kurs hinzufügen
                    </button>

                </div>

                {/* Keine Kurse am ausgewählten Tag */}

                {selectedWochentag &&
                    filteredKurse.length === 0 && (
                        <p className="empty-text">
                            Für {selectedWochentag} sind keine Kurse vorhanden.
                        </p>
                    )}

                {/* Kursbuchungen */}

                {buchungen && buchungen.length > 0 ? (
                    <div className="detail-table-scroll">

                        <table className="detail-table">

                            <thead>
                            <tr>
                                <th>Kurs</th>
                                <th>Kursleitung</th>
                                <th>Wochentag</th>
                                <th>Uhrzeit</th>
                                <th>Buchungsart</th>
                                <th>Gebühr</th>
                                <th>Aktionen</th>
                            </tr>
                            </thead>

                            <tbody>

                            {buchungen.map((buchung) => (
                                <tr key={buchung.id}>

                                    <td>
                                        {buchung.kurs?.name || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.kursleitung || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.wochentag || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.uhrzeit || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.buchungsart || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.kursgebuehr != null
                                            ? `${buchung.kurs.kursgebuehr} €`
                                            : '–'}
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            className="btn-remove-kurs"
                                            onClick={() =>
                                                onDeleteBuchung(
                                                    buchung.id
                                                )
                                            }
                                        >
                                            Entfernen
                                        </button>
                                    </td>

                                </tr>
                            ))}

                            </tbody>

                        </table>
                    </div>
                ) : (
                    <p className="empty-text">
                        Noch keine Kursbuchungen vorhanden.
                    </p>
                )}

            </section>

            {/* =====================================================
                ANWESENHEIT
               ===================================================== */}

            <section className="detail-section">
                <h3>Anwesenheit</h3>

                {anwesenheiten &&
                anwesenheiten.length > 0 ? (

                    <div className="detail-table-scroll">

                        <table className="detail-table">

                            <thead>
                            <tr>
                                <th>Datum</th>
                                <th>Kurs</th>
                                <th>Status</th>
                                <th>Bemerkung</th>
                            </tr>
                            </thead>

                            <tbody>

                            {[...anwesenheiten]
                                .sort((a, b) =>
                                    String(b.datum ?? '')
                                        .localeCompare(
                                            String(a.datum ?? '')
                                        )
                                )
                                .map((anwesenheit) => (

                                    <tr key={anwesenheit.id}>

                                        <td>
                                            {anwesenheit.datum || '–'}
                                        </td>

                                        <td>
                                            {anwesenheit.kurs?.name || '–'}
                                        </td>

                                        <td>
                                            {anwesenheit.status || '–'}
                                        </td>

                                        <td>
                                            {anwesenheit.bemerkung || '–'}
                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>

                ) : (
                    <p className="empty-text">
                        Noch keine Anwesenheitsdaten vorhanden.
                    </p>
                )}

            </section>

        </div>
    );
}

export default StudentDetailView;