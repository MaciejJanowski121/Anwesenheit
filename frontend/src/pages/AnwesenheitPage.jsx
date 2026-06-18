import React, { useEffect, useState } from 'react';
import { getKurse } from '../services/kursService';
import { createAnwesenheit } from '../services/anwesenheitService';
import './AnwesenheitPage.css';

const wochentage = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag'
];

function AnwesenheitPage() {

    const [kurse, setKurse] = useState([]);
    const [selectedKurs, setSelectedKurs] = useState('');
    const [students, setStudents] = useState([]);
    const [statuses, setStatuses] = useState({});
    const [bemerkungen, setBemerkungen] = useState({});
    const [message, setMessage] = useState('');

    const [datum, setDatum] = useState(
        new Date().toISOString().split('T')[0]
    );

    useEffect(() => {
        loadKurse();
    }, []);

    const loadKurse = async () => {
        try {
            const data = await getKurse();
            setKurse(data);
        } catch (error) {
            console.error(error);
            setMessage('Kurse konnten nicht geladen werden.');
        }
    };

    const getKurseByWochentag = (wochentag) => {
        return kurse.filter(
            (kurs) => kurs.wochentag === wochentag
        );
    };

    const handleKursChange = async (kursId) => {

        setSelectedKurs(kursId);
        setMessage('');

        if (!kursId) {
            setStudents([]);
            setStatuses({});
            setBemerkungen({});
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:8080/api/buchungen/kurs/${kursId}`
            );

            const buchungen = await response.json();

            const studentList = buchungen.map(
                (buchung) => buchung.student
            );

            setStudents(studentList);

            const initialStatuses = {};
            const initialBemerkungen = {};

            studentList.forEach((student) => {
                initialStatuses[student.id] = 'ANWESEND';
                initialBemerkungen[student.id] = '';
            });

            setStatuses(initialStatuses);
            setBemerkungen(initialBemerkungen);

        } catch (error) {

            console.error(error);
            setMessage('Schüler konnten nicht geladen werden.');
        }
    };

    const handleStatusChange = (studentId, status) => {

        setStatuses((prev) => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleBemerkungChange = (studentId, bemerkung) => {

        setBemerkungen((prev) => ({
            ...prev,
            [studentId]: bemerkung
        }));
    };

    const handleSave = async () => {

        if (!selectedKurs) {
            setMessage('Bitte zuerst einen Kurs auswählen.');
            return;
        }

        if (students.length === 0) {
            setMessage('Für diesen Kurs gibt es keine Schüler.');
            return;
        }

        try {

            for (const student of students) {

                const anwesenheit = {
                    datum: datum,
                    status: statuses[student.id] || 'ANWESEND',
                    bemerkung: bemerkungen[student.id] || ''
                };

                await createAnwesenheit(
                    student.id,
                    selectedKurs,
                    anwesenheit
                );
            }

            setMessage('Anwesenheit erfolgreich gespeichert.');

        } catch (error) {

            console.error(error);
            setMessage('Fehler beim Speichern der Anwesenheit.');
        }
    };

    return (
        <div className="anwesenheit-page">

            <h2>Anwesenheit</h2>

            <div className="anwesenheit-toolbar">

                <input
                    type="date"
                    value={datum}
                    onChange={(e) => setDatum(e.target.value)}
                />

                <select
                    value={selectedKurs}
                    onChange={(e) => handleKursChange(e.target.value)}
                >
                    <option value="">
                        Kurs auswählen...
                    </option>

                    {wochentage.map((tag) => {

                        const kurseAmTag =
                            getKurseByWochentag(tag);

                        if (kurseAmTag.length === 0) {
                            return null;
                        }

                        return (
                            <optgroup
                                key={tag}
                                label={tag}
                            >
                                {kurseAmTag.map((kurs) => (
                                    <option
                                        key={kurs.id}
                                        value={kurs.id}
                                    >
                                        {kurs.name}
                                    </option>
                                ))}
                            </optgroup>
                        );
                    })}
                </select>

            </div>

            <div className="anwesenheit-list">

                {students.length === 0 ? (

                    <p className="empty-text">
                        Kein Kurs ausgewählt oder keine Schüler vorhanden.
                    </p>

                ) : (

                    <>
                        <table className="anwesenheit-table">

                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Klasse</th>
                                <th>Status</th>
                                <th>Bemerkung</th>
                            </tr>
                            </thead>

                            <tbody>

                            {students.map((student) => (
                                <tr key={student.id}>

                                    <td>{student.name}</td>

                                    <td>{student.klasse}</td>

                                    <td>
                                        <select
                                            className="status-select"
                                            value={
                                                statuses[student.id]
                                            }
                                            onChange={(e) =>
                                                handleStatusChange(
                                                    student.id,
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="ANWESEND">
                                                Anwesend
                                            </option>

                                            <option value="FEHLT">
                                                Fehlt
                                            </option>

                                            <option value="ENTSCHULDIGT">
                                                Entschuldigt
                                            </option>
                                        </select>
                                    </td>

                                    <td>
                                        <input
                                            type="text"
                                            className="bemerkung-input"
                                            placeholder="Bemerkung..."
                                            value={
                                                bemerkungen[student.id] || ''
                                            }
                                            onChange={(e) =>
                                                handleBemerkungChange(
                                                    student.id,
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>

                                </tr>
                            ))}

                            </tbody>

                        </table>

                        <button
                            className="save-button"
                            onClick={handleSave}
                        >
                            Anwesenheit speichern
                        </button>
                    </>
                )}

                {message && (
                    <p className="anwesenheit-message">
                        {message}
                    </p>
                )}

            </div>

        </div>
    );
}

export default AnwesenheitPage;