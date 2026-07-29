import React, { useEffect, useState } from 'react';
import { getKurse } from '../services/kursService';
import {
    createAnwesenheit,
    getAllAnwesenheiten,
    deleteAnwesenheit
} from '../services/anwesenheitService';
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
    const [savedAnwesenheiten, setSavedAnwesenheiten] = useState([]);
    const [activeTab, setActiveTab] = useState('erfassen');

    const [editingId, setEditingId] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editBemerkung, setEditBemerkung] = useState('');

    const [filterDatum, setFilterDatum] = useState(
        new Date().toISOString().split('T')[0]
    );

    const [filterKurs, setFilterKurs] = useState('');

    const [datum, setDatum] = useState(
        new Date().toISOString().split('T')[0]
    );

    useEffect(() => {
        loadKurse();
        loadAnwesenheiten();
    }, []);

    const formatStudentName = (student) => {
        if (!student) {
            return '–';
        }

        const nachname = student.nachname || '';
        const vorname = student.vorname || '';

        if (!nachname && !vorname) {
            return '–';
        }

        return `${nachname}, ${vorname}`.trim();
    };

    const loadKurse = async () => {
        try {
            const data = await getKurse();
            setKurse(data);
        } catch (error) {
            console.error(error);
            setMessage('Kurse konnten nicht geladen werden.');
        }
    };

    const loadAnwesenheiten = async () => {
        try {
            const data = await getAllAnwesenheiten();
            setSavedAnwesenheiten(data);
        } catch (error) {
            console.error(error);
        }
    };

    const getKurseByWochentag = (wochentag) => {
        return kurse.filter((kurs) => kurs.wochentag === wochentag);
    };

    const filteredAnwesenheiten = savedAnwesenheiten.filter((anwesenheit) => {
        const matchesDatum =
            !filterDatum || anwesenheit.datum === filterDatum;

        const matchesKurs =
            !filterKurs || anwesenheit.kurs?.id === Number(filterKurs);

        return matchesDatum && matchesKurs;
    });

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
                `/api/buchungen/kurs/${kursId}`
            );

            const buchungen = await response.json();
            const studentList = buchungen.map((buchung) => buchung.student);

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
            await loadAnwesenheiten();
        } catch (error) {
            console.error(error);
            setMessage('Fehler beim Speichern der Anwesenheit.');
        }
    };

    const handleEditStart = (anwesenheit) => {
        setEditingId(anwesenheit.id);
        setEditStatus(anwesenheit.status || 'ANWESEND');
        setEditBemerkung(anwesenheit.bemerkung || '');
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditStatus('');
        setEditBemerkung('');
    };

    const handleEditSave = async (anwesenheit) => {
        try {
            await createAnwesenheit(
                anwesenheit.student.id,
                anwesenheit.kurs.id,
                {
                    datum: anwesenheit.datum,
                    status: editStatus,
                    bemerkung: editBemerkung
                }
            );

            setEditingId(null);
            setEditStatus('');
            setEditBemerkung('');
            setMessage('Anwesenheit wurde aktualisiert.');

            await loadAnwesenheiten();
        } catch (error) {
            console.error(error);
            setMessage('Fehler beim Aktualisieren der Anwesenheit.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteAnwesenheit(id);
            setMessage('Anwesenheit wurde gelöscht.');
            await loadAnwesenheiten();
        } catch (error) {
            console.error(error);
            setMessage('Fehler beim Löschen der Anwesenheit.');
        }
    };

    return (
        <div className="anwesenheit-page">
            <h2>Anwesenheit</h2>

            <div className="anwesenheit-tabs">
                <button
                    className={
                        activeTab === 'erfassen'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() => setActiveTab('erfassen')}
                >
                    Anwesenheit erfassen
                </button>

                <button
                    className={
                        activeTab === 'verlauf'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() => setActiveTab('verlauf')}
                >
                    Verlauf
                </button>
            </div>

            {activeTab === 'erfassen' && (
                <>
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
                            <option value="">Kurs auswählen...</option>

                            {wochentage.map((tag) => {
                                const kurseAmTag = getKurseByWochentag(tag);

                                if (kurseAmTag.length === 0) {
                                    return null;
                                }

                                return (
                                    <optgroup key={tag} label={tag}>
                                        {kurseAmTag.map((kurs) => (
                                            <option key={kurs.id} value={kurs.id}>
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
                                            <td>{formatStudentName(student)}</td>
                                            <td>{student.klasse || '–'}</td>
                                            <td>
                                                <select
                                                    className="status-select"
                                                    value={statuses[student.id] || 'ANWESEND'}
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            student.id,
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="ANWESEND">Anwesend</option>
                                                    <option value="FEHLT">Fehlt</option>
                                                    <option value="ENTSCHULDIGT">Entschuldigt</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="bemerkung-input"
                                                    placeholder="Bemerkung..."
                                                    value={bemerkungen[student.id] || ''}
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
                </>
            )}

            {activeTab === 'verlauf' && (
                <section className="saved-anwesenheiten">
                    <h3>Gespeicherte Anwesenheiten</h3>

                    <div className="anwesenheit-toolbar">
                        <input
                            type="date"
                            value={filterDatum}
                            onChange={(e) => setFilterDatum(e.target.value)}
                        />

                        <select
                            value={filterKurs}
                            onChange={(e) => setFilterKurs(e.target.value)}
                        >
                            <option value="">Alle Kurse</option>

                            {wochentage.map((tag) => {
                                const kurseAmTag = getKurseByWochentag(tag);

                                if (kurseAmTag.length === 0) {
                                    return null;
                                }

                                return (
                                    <optgroup key={tag} label={tag}>
                                        {kurseAmTag.map((kurs) => (
                                            <option key={kurs.id} value={kurs.id}>
                                                {kurs.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                );
                            })}
                        </select>
                    </div>

                    {filteredAnwesenheiten.length === 0 ? (
                        <p className="empty-text">
                            Keine Anwesenheiten für die aktuelle Auswahl gefunden.
                        </p>
                    ) : (
                        <table className="anwesenheit-table">
                            <thead>
                            <tr>
                                <th>Datum</th>
                                <th>Schüler</th>
                                <th>Kurs</th>
                                <th>Status</th>
                                <th>Bemerkung</th>
                                <th>Aktionen</th>
                            </tr>
                            </thead>

                            <tbody>
                            {filteredAnwesenheiten.map((anwesenheit) => (
                                <tr key={anwesenheit.id}>
                                    <td>{anwesenheit.datum}</td>
                                    <td>{formatStudentName(anwesenheit.student)}</td>
                                    <td>{anwesenheit.kurs?.name || '-'}</td>

                                    {editingId === anwesenheit.id ? (
                                        <>
                                            <td>
                                                <select
                                                    className="status-select"
                                                    value={editStatus}
                                                    onChange={(e) =>
                                                        setEditStatus(e.target.value)
                                                    }
                                                >
                                                    <option value="ANWESEND">Anwesend</option>
                                                    <option value="FEHLT">Fehlt</option>
                                                    <option value="ENTSCHULDIGT">Entschuldigt</option>
                                                </select>
                                            </td>

                                            <td>
                                                <input
                                                    className="bemerkung-input"
                                                    value={editBemerkung}
                                                    onChange={(e) =>
                                                        setEditBemerkung(e.target.value)
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <button
                                                    className="btn-save"
                                                    onClick={() => handleEditSave(anwesenheit)}
                                                >
                                                    Speichern
                                                </button>

                                                <button
                                                    className="btn-cancel"
                                                    onClick={handleEditCancel}
                                                >
                                                    Abbrechen
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{anwesenheit.status}</td>
                                            <td>{anwesenheit.bemerkung || '-'}</td>
                                            <td>
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => handleEditStart(anwesenheit)}
                                                >
                                                    Bearbeiten
                                                </button>

                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDelete(anwesenheit.id)}
                                                >
                                                    Löschen
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}

                    {message && (
                        <p className="anwesenheit-message">
                            {message}
                        </p>
                    )}
                </section>
            )}
        </div>
    );
}

export default AnwesenheitPage;