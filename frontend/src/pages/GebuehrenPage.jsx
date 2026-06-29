import React, { useEffect, useState } from 'react';
import {
    getStudents,
    getBuchungenByStudent,
    getZahlungenByStudent,
    deleteZahlung,
    bezahleKurs
} from '../services/gebuehrenService';
import './GebuehrenPage.css';

function GebuehrenPage() {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [buchungen, setBuchungen] = useState([]);
    const [zahlungen, setZahlungen] = useState([]);
    const [message, setMessage] = useState('');
    const [abrechnungsmonat, setAbrechnungsmonat] = useState(currentMonth);

    useEffect(() => {
        getStudents()
            .then((data) => setStudents(data))
            .catch((error) => {
                console.error(error);
                setMessage('Schüler konnten nicht geladen werden.');
            });
    }, []);

    const loadGebuehrenData = async (studentId) => {
        const [buchungenData, zahlungenData] = await Promise.all([
            getBuchungenByStudent(studentId),
            getZahlungenByStudent(studentId)
        ]);

        setBuchungen(buchungenData);
        setZahlungen(zahlungenData);
    };

    const handleStudentChange = async (studentId) => {
        setSelectedStudentId(studentId);
        setMessage('');

        if (!studentId) {
            setBuchungen([]);
            setZahlungen([]);
            return;
        }

        try {
            await loadGebuehrenData(studentId);
        } catch (error) {
            console.error(error);
            setMessage('Gebührendaten konnten nicht geladen werden.');
        }
    };

    const selectedStudent = students.find(
        (student) => String(student.id) === String(selectedStudentId)
    );

    const filteredZahlungen = zahlungen.filter((zahlung) => {
        if (!abrechnungsmonat) {
            return true;
        }

        return String(zahlung.abrechnungsmonat) === abrechnungsmonat;
    });

    const getBezahltForBuchung = (buchungId) => {
        return filteredZahlungen
            .filter((zahlung) => zahlung.buchung?.id === buchungId)
            .reduce((sum, zahlung) => sum + (zahlung.betrag || 0), 0);
    };

    const total = buchungen.reduce((sum, buchung) => {
        return sum + (buchung.kurs?.kursgebuehr || 0);
    }, 0);

    const bezahlt = filteredZahlungen.reduce((sum, zahlung) => {
        return sum + (zahlung.betrag || 0);
    }, 0);

    const offen = total - bezahlt;

    const formatCurrency = (value) => {
        return value.toLocaleString('de-DE', {
            style: 'currency',
            currency: 'EUR'
        });
    };

    const handleBezahleKurs = async (buchungId) => {
        try {
            await bezahleKurs(buchungId, abrechnungsmonat);
            setMessage('Zahlung wurde gespeichert.');
            await loadGebuehrenData(selectedStudentId);
        } catch (error) {
            console.error(error);
            setMessage(
                error.response?.data?.message ||
                error.response?.data ||
                'Kurs wurde für diesen Monat bereits bezahlt.'
            );
        }
    };

    const handleDeleteZahlung = async (id) => {
        try {
            await deleteZahlung(id);
            setMessage('Zahlung wurde gelöscht.');
            await loadGebuehrenData(selectedStudentId);
        } catch (error) {
            console.error(error);
            setMessage('Zahlung konnte nicht gelöscht werden.');
        }
    };

    return (
        <div className="gebuehren-page">
            <h2>Gebühren</h2>

            <section className="gebuehren-card">
                <h3>Schüler auswählen</h3>

                <select
                    className="student-select"
                    value={selectedStudentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                >
                    <option value="">Bitte Schüler auswählen...</option>

                    {students.map((student) => (
                        <option key={student.id} value={student.id}>
                            {student.nachname}, {student.vorname}
                        </option>
                    ))}
                </select>
            </section>

            {selectedStudent && (
                <>
                    <section className="gebuehren-card">
                        <h3>
                            Gebührenübersicht für {selectedStudent.nachname}, {selectedStudent.vorname}
                        </h3>

                        <div className="month-selector">
                            <label>Abrechnungsmonat</label>

                            <input
                                type="month"
                                value={abrechnungsmonat}
                                onChange={(e) => setAbrechnungsmonat(e.target.value)}
                            />
                        </div>

                        {buchungen.length === 0 ? (
                            <p className="empty-text">
                                Für diesen Schüler sind noch keine Kurse gebucht.
                            </p>
                        ) : (
                            <>
                                <table className="gebuehren-table">
                                    <thead>
                                    <tr>
                                        <th>Kurs</th>
                                        <th>Wochentag</th>
                                        <th>Uhrzeit</th>
                                        <th>Gebucht seit</th>
                                        <th>Gebühr</th>
                                        <th>Bezahlt</th>
                                        <th>Offen</th>
                                        <th>Status</th>
                                        <th>Aktion</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {buchungen.map((buchung) => {
                                        const kursGebuehr = buchung.kurs?.kursgebuehr || 0;
                                        const bezahltForBuchung = getBezahltForBuchung(buchung.id);
                                        const offenForBuchung = kursGebuehr - bezahltForBuchung;
                                        const isBezahlt = offenForBuchung <= 0 && kursGebuehr > 0;

                                        return (
                                            <tr key={buchung.id}>
                                                <td>{buchung.kurs?.name || '–'}</td>
                                                <td>{buchung.kurs?.wochentag || '–'}</td>
                                                <td>{buchung.kurs?.uhrzeit || '–'}</td>
                                                <td>{buchung.buchungsdatum || '–'}</td>
                                                <td>{formatCurrency(kursGebuehr)}</td>
                                                <td>{formatCurrency(bezahltForBuchung)}</td>
                                                <td>{formatCurrency(offenForBuchung)}</td>
                                                <td>
                                                    {isBezahlt ? (
                                                        <span className="bezahlt-label">
                                                            Bezahlt
                                                        </span>
                                                    ) : (
                                                        <span className="offen-label">
                                                            Offen
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {isBezahlt ? (
                                                        <span className="already-paid-text">
                                                            ✔ Bezahlt
                                                        </span>
                                                    ) : (
                                                        <button
                                                            className="payment-button"
                                                            onClick={() => handleBezahleKurs(buchung.id)}
                                                            disabled={kursGebuehr <= 0}
                                                        >
                                                            Bezahlen
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>

                                <div className="gebuehren-summary">
                                    <div>
                                        <span>Anzahl Kurse</span>
                                        <strong>{buchungen.length}</strong>
                                    </div>

                                    <div>
                                        <span>Gesamtbetrag</span>
                                        <strong>{formatCurrency(total)}</strong>
                                    </div>

                                    <div>
                                        <span>Bezahlt</span>
                                        <strong>{formatCurrency(bezahlt)}</strong>
                                    </div>

                                    <div>
                                        <span>Offen</span>
                                        <strong>{formatCurrency(offen)}</strong>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>

                    {filteredZahlungen.length > 0 && (
                        <section className="gebuehren-card">
                            <h3>Zahlungshistorie für {abrechnungsmonat}</h3>

                            <table className="gebuehren-table">
                                <thead>
                                <tr>
                                    <th>Abrechnungsmonat</th>
                                    <th>Zahlungsdatum</th>
                                    <th>Kurs</th>
                                    <th>Betrag</th>
                                    <th>Bemerkung</th>
                                    <th>Aktionen</th>
                                </tr>
                                </thead>

                                <tbody>
                                {filteredZahlungen.map((zahlung) => (
                                    <tr key={zahlung.id}>
                                        <td>{String(zahlung.abrechnungsmonat) || '–'}</td>
                                        <td>{zahlung.zahlungsdatum || '–'}</td>
                                        <td>{zahlung.buchung?.kurs?.name || '–'}</td>
                                        <td>{formatCurrency(zahlung.betrag || 0)}</td>
                                        <td>{zahlung.bemerkung || '–'}</td>
                                        <td>
                                            <button
                                                className="delete-payment-button"
                                                onClick={() => handleDeleteZahlung(zahlung.id)}
                                            >
                                                Löschen
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </section>
                    )}
                </>
            )}

            {message && (
                <p className="gebuehren-message">
                    {message}
                </p>
            )}
        </div>
    );
}

export default GebuehrenPage;