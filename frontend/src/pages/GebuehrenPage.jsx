import React, { useEffect, useState } from 'react';

import {
    getStudents,
    getBuchungenByStudent,
    getGebuehrenStatus,
    toggleGebuehrenErfasst
} from '../services/gebuehrenService';

import './GebuehrenPage.css';

const schuljahre = [
    '2025/2026',
    '2026/2027',
    '2027/2028',
    '2028/2029'
];

function GebuehrenPage() {
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [buchungen, setBuchungen] = useState([]);
    const [message, setMessage] = useState('');

    const [schuljahr, setSchuljahr] = useState('2026/2027');
    const [halbjahr, setHalbjahr] = useState(1);
    const [erfassung, setErfassung] = useState(null);

    useEffect(() => {
        getStudents()
            .then((data) => {
                setStudents(
                    Array.isArray(data)
                        ? data
                        : []
                );
            })
            .catch((error) => {
                console.error(error);

                setMessage(
                    'Schüler konnten nicht geladen werden.'
                );
            });
    }, []);

    useEffect(() => {
        if (selectedStudentId) {
            loadErfassung(
                selectedStudentId,
                schuljahr,
                halbjahr
            );
        }
    }, [
        selectedStudentId,
        schuljahr,
        halbjahr
    ]);

    const loadBuchungen = async (
        studentId
    ) => {
        const data =
            await getBuchungenByStudent(
                studentId
            );

        setBuchungen(
            Array.isArray(data)
                ? data
                : []
        );
    };

    const loadErfassung = async (
        studentId,
        selectedSchuljahr,
        selectedHalbjahr
    ) => {
        try {
            const data =
                await getGebuehrenStatus(
                    studentId,
                    selectedSchuljahr,
                    selectedHalbjahr
                );

            setErfassung(data);
        } catch (error) {
            console.error(
                'Gebührenstatus konnte nicht geladen werden:',
                error
            );

            setErfassung(null);
        }
    };

    const handleStudentChange = async (
        studentId
    ) => {
        setSelectedStudentId(studentId);
        setMessage('');
        setErfassung(null);

        if (!studentId) {
            setBuchungen([]);
            return;
        }

        try {
            await loadBuchungen(studentId);

            await loadErfassung(
                studentId,
                schuljahr,
                halbjahr
            );
        } catch (error) {
            console.error(error);

            setMessage(
                'Gebührendaten konnten nicht geladen werden.'
            );
        }
    };

    const selectedStudent =
        students.find(
            (student) =>
                String(student.id) ===
                String(selectedStudentId)
        );

    const formatCurrency = (value) => {
        return new Intl.NumberFormat(
            'de-DE',
            {
                style: 'currency',
                currency: 'EUR'
            }
        ).format(
            Number(value) || 0
        );
    };

    const getKursFaktor = (
        buchungsart
    ) => {
        if (!buchungsart) {
            return 0;
        }

        const art =
            buchungsart.toUpperCase();

        if (art === 'OGS') {
            return 1;
        }

        if (art === 'OGSH') {
            return 0.5;
        }

        return 0;
    };

    const getKursGebuehr = (kurs) => {
        const art =
            kurs?.buchungsart?.toUpperCase();

        if (art === 'M') {
            return Number(
                kurs.kursgebuehr
            ) || 0;
        }

        return 0;
    };

    const getBerechnung = (kurs) => {
        const art =
            kurs?.buchungsart?.toUpperCase();

        if (art === 'M') {
            return 'Individuelle Kursgebühr';
        }

        if (art === 'OGS') {
            return '1 Kurs';
        }

        if (art === 'OGSH') {
            return '0,5 Kurs';
        }

        if (art === 'KURZ') {
            return 'Kostenlos';
        }

        if (art === 'OGSF') {
            return 'Kostenlos';
        }

        if (art === 'P') {
            return 'Kostenlos';
        }

        return '–';
    };

    const getOgsGebuehr = (
        faktor
    ) => {
        return faktor * 150;
    };

    const countByBuchungsart = (
        art
    ) => {
        return buchungen.filter(
            (buchung) =>
                buchung.kurs
                    ?.buchungsart
                    ?.toUpperCase() === art
        ).length;
    };

    const ogsFaktor =
        buchungen.reduce(
            (sum, buchung) => {
                return (
                    sum +
                    getKursFaktor(
                        buchung.kurs
                            ?.buchungsart
                    )
                );
            },
            0
        );

    const musikGebuehren =
        buchungen.reduce(
            (sum, buchung) => {
                return (
                    sum +
                    getKursGebuehr(
                        buchung.kurs
                    )
                );
            },
            0
        );

    const ogsGebuehr =
        getOgsGebuehr(ogsFaktor);

    const gesamt =
        ogsGebuehr +
        musikGebuehren;

    const handleToggleErfasst =
        async () => {
            if (!selectedStudentId) {
                return;
            }

            try {
                const data =
                    await toggleGebuehrenErfasst(
                        selectedStudentId,
                        schuljahr,
                        halbjahr
                    );

                setErfassung(data);

                setMessage(
                    'Erfassungsstatus wurde aktualisiert.'
                );
            } catch (error) {
                console.error(error);

                setMessage(
                    'Erfassungsstatus konnte nicht aktualisiert werden.'
                );
            }
        };

    return (
        <div className="gebuehren-page">

            <header className="page-header">
                <div className="page-header-content">
                    <h1>Gebühren</h1>

                    <p>
                        Kursgebühren berechnen
                        und die Übertragung in das
                        Schulverwaltungsprogramm dokumentieren
                    </p>
                </div>
            </header>

            {message && (
                <div className="gebuehren-message">
                    {message}
                </div>
            )}

            <section className="gebuehren-section">
                <div className="gebuehren-section-header">
                    <div>
                        <h2>
                            Schüler auswählen
                        </h2>

                        <p>
                            Wählen Sie einen Schüler aus,
                            um die Gebührenübersicht zu öffnen.
                        </p>
                    </div>
                </div>

                <div className="gebuehren-student-selection">
                    <select
                        className="student-select"
                        value={selectedStudentId}
                        onChange={(event) =>
                            handleStudentChange(
                                event.target.value
                            )
                        }
                    >
                        <option value="">
                            Bitte Schüler auswählen...
                        </option>

                        {students.map((student) => (
                            <option
                                key={student.id}
                                value={student.id}
                            >
                                {student.nachname},{' '}
                                {student.vorname}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {selectedStudent && (
                <section className="gebuehren-section">
                    <div className="gebuehren-section-header">
                        <div>
                            <h2>
                                Gebührenübersicht
                            </h2>

                            <p>
                                {selectedStudent.nachname},{' '}
                                {selectedStudent.vorname}
                            </p>
                        </div>

                        <span className="gebuehren-booking-count">
                            {buchungen.length}{' '}
                            {buchungen.length === 1
                                ? 'Buchung'
                                : 'Buchungen'}
                        </span>
                    </div>

                    <div className="gebuehren-filter-row">
                        <div className="gebuehren-filter-field">
                            <label htmlFor="gebuehren-schuljahr">
                                Schuljahr
                            </label>

                            <select
                                id="gebuehren-schuljahr"
                                value={schuljahr}
                                onChange={(event) =>
                                    setSchuljahr(
                                        event.target.value
                                    )
                                }
                            >
                                {schuljahre.map(
                                    (jahr) => (
                                        <option
                                            key={jahr}
                                            value={jahr}
                                        >
                                            {jahr}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="gebuehren-filter-field">
                            <label htmlFor="gebuehren-halbjahr">
                                Halbjahr
                            </label>

                            <select
                                id="gebuehren-halbjahr"
                                value={halbjahr}
                                onChange={(event) =>
                                    setHalbjahr(
                                        Number(
                                            event.target.value
                                        )
                                    )
                                }
                            >
                                <option value={1}>
                                    1. Halbjahr
                                </option>

                                <option value={2}>
                                    2. Halbjahr
                                </option>
                            </select>
                        </div>

                        <div className="erfassung-status-box">
                            <div className="erfassung-status-content">
                                <span>
                                    Status
                                </span>

                                {erfassung?.erfasst ? (
                                    <strong className="status-erfasst">
                                        Erfasst
                                    </strong>
                                ) : (
                                    <strong className="status-nicht-erfasst">
                                        Nicht erfasst
                                    </strong>
                                )}
                            </div>

                            <button
                                type="button"
                                className="gebuehren-erfasst-button"
                                onClick={
                                    handleToggleErfasst
                                }
                            >
                                {erfassung?.erfasst
                                    ? 'Rückgängig'
                                    : 'Als erfasst markieren'}
                            </button>
                        </div>
                    </div>

                    {buchungen.length === 0 ? (
                        <div className="gebuehren-empty">
                            Für diesen Schüler sind
                            noch keine Kurse gebucht.
                        </div>
                    ) : (
                        <>
                            <div className="gebuehren-table-scroll">
                                <table className="gebuehren-table">
                                    <thead>
                                    <tr>
                                        <th>Kurs</th>
                                        <th>Wochentag</th>
                                        <th>Uhrzeit</th>
                                        <th>Buchungsart</th>
                                        <th>Berechnung</th>
                                        <th>Faktor</th>
                                        <th>Kursgebühr</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {buchungen.map(
                                        (buchung) => {
                                            const kurs =
                                                buchung.kurs;

                                            const faktor =
                                                getKursFaktor(
                                                    kurs?.buchungsart
                                                );

                                            const kursGebuehr =
                                                getKursGebuehr(
                                                    kurs
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        buchung.id
                                                    }
                                                >
                                                    <td>
                                                        {kurs?.name ||
                                                            '–'}
                                                    </td>

                                                    <td>
                                                        {kurs?.wochentag ||
                                                            '–'}
                                                    </td>

                                                    <td>
                                                        {kurs?.uhrzeit ||
                                                            '–'}
                                                    </td>

                                                    <td>
                                                        {kurs?.buchungsart ||
                                                            '–'}
                                                    </td>

                                                    <td>
                                                        {getBerechnung(
                                                            kurs
                                                        )}
                                                    </td>

                                                    <td>
                                                        {faktor}
                                                    </td>

                                                    <td>
                                                        {formatCurrency(
                                                            kursGebuehr
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="gebuehren-summary">
                                <div className="gebuehren-summary-card">
                                    <span>
                                        OGS-Kurse
                                    </span>

                                    <strong>
                                        {countByBuchungsart(
                                            'OGS'
                                        )}
                                    </strong>
                                </div>

                                <div className="gebuehren-summary-card">
                                    <span>
                                        OGSH-Kurse
                                    </span>

                                    <strong>
                                        {countByBuchungsart(
                                            'OGSH'
                                        )}
                                    </strong>
                                </div>

                                <div className="gebuehren-summary-card">
                                    <span>
                                        Musikkurse
                                    </span>

                                    <strong>
                                        {countByBuchungsart(
                                            'M'
                                        )}
                                    </strong>
                                </div>

                                <div className="gebuehren-summary-card">
                                    <span>
                                        OGS-Faktor
                                    </span>

                                    <strong>
                                        {ogsFaktor}
                                    </strong>
                                </div>

                                <div className="gebuehren-summary-card">
                                    <span>
                                        OGS-Gebühr /
                                        Halbjahr
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            ogsGebuehr
                                        )}
                                    </strong>
                                </div>

                                <div className="gebuehren-summary-card">
                                    <span>
                                        Musikgebühren
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            musikGebuehren
                                        )}
                                    </strong>
                                </div>

                                <div className="gebuehren-summary-card gebuehren-summary-total">
                                    <span>
                                        Gesamtbetrag /
                                        Halbjahr
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            gesamt
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}

export default GebuehrenPage;