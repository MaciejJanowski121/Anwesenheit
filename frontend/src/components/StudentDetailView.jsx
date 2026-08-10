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
                               onClose
                           }) {
    const [selectedWochentag, setSelectedWochentag] = useState('');
    const [selectedKursId, setSelectedKursId] = useState('');

    const filteredKurse = useMemo(() => {
        if (!selectedWochentag) {
            return [];
        }

        return kurse.filter(
            (kurs) => kurs.wochentag === selectedWochentag
        );
    }, [kurse, selectedWochentag]);

    const handleWochentagChange = (event) => {
        setSelectedWochentag(event.target.value);
        setSelectedKursId('');
    };

    const handleKursChange = (event) => {
        setSelectedKursId(event.target.value);
    };

    const handleAssign = async () => {
        if (!selectedKursId) {
            return;
        }

        await onAssignKurs(selectedKursId);

        setSelectedKursId('');
    };

    return (
        <div className="student-detail-view">
            <button
                type="button"
                className="back-button"
                onClick={onClose}
            >
                Zurück zur Übersicht
            </button>

            <div className="detail-header">
                <h2>
                    {student.nachname}, {student.vorname}
                </h2>

                <p>Schülerdetails</p>
            </div>

            <section className="detail-section">
                <h3>Allgemeine Informationen</h3>

                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">
                            Vorname
                        </span>

                        <span className="detail-value">
                            {student.vorname || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Nachname
                        </span>

                        <span className="detail-value">
                            {student.nachname || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Jahrgang
                        </span>

                        <span className="detail-value">
                            {student.jahrgang || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Klasse
                        </span>

                        <span className="detail-value">
                            {student.klasse || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Foto- und Bildfreigabe
                        </span>

                        <span className="detail-value">
                            {student.fotoFreigabe || '–'}
                        </span>
                    </div>
                </div>
            </section>

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

            <section className="detail-section">
                <h3>Kursbuchungen</h3>

                <div className="assign-kurs-box">
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

                    <button
                        type="button"
                        className="assign-kurs-button"
                        onClick={handleAssign}
                        disabled={!selectedKursId}
                    >
                        Kurs hinzufügen
                    </button>
                </div>

                {selectedWochentag &&
                    filteredKurse.length === 0 && (
                        <p className="empty-text">
                            Für {selectedWochentag} sind keine Kurse vorhanden.
                        </p>
                    )}

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
                                    b.datum.localeCompare(a.datum)
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