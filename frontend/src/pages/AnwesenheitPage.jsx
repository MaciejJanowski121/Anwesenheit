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

            setKurse(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(error);

            setMessage(
                'Kurse konnten nicht geladen werden.'
            );
        }
    };

    const loadAnwesenheiten = async () => {
        try {
            const data = await getAllAnwesenheiten();

            setSavedAnwesenheiten(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(error);
        }
    };

    const getKurseByWochentag = (wochentag) => {
        return kurse.filter(
            (kurs) => kurs.wochentag === wochentag
        );
    };

    const filteredAnwesenheiten =
        savedAnwesenheiten.filter((anwesenheit) => {
            const matchesDatum =
                !filterDatum ||
                anwesenheit.datum === filterDatum;

            const matchesKurs =
                !filterKurs ||
                anwesenheit.kurs?.id === Number(filterKurs);

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

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const buchungen = await response.json();

            const studentList = buchungen
                .map((buchung) => buchung.student)
                .filter(Boolean);

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

            setStudents([]);
            setStatuses({});
            setBemerkungen({});

            setMessage(
                'Schüler konnten nicht geladen werden.'
            );
        }
    };

    const handleStatusChange = (
        studentId,
        status
    ) => {
        setStatuses((previous) => ({
            ...previous,
            [studentId]: status
        }));
    };

    const handleBemerkungChange = (
        studentId,
        bemerkung
    ) => {
        setBemerkungen((previous) => ({
            ...previous,
            [studentId]: bemerkung
        }));
    };

    const handleSave = async () => {
        if (!selectedKurs) {
            setMessage(
                'Bitte zuerst einen Kurs auswählen.'
            );
            return;
        }

        if (students.length === 0) {
            setMessage(
                'Für diesen Kurs gibt es keine Schüler.'
            );
            return;
        }

        try {
            for (const student of students) {
                const anwesenheit = {
                    datum,
                    status:
                        statuses[student.id] ||
                        'ANWESEND',
                    bemerkung:
                        bemerkungen[student.id] ||
                        ''
                };

                await createAnwesenheit(
                    student.id,
                    selectedKurs,
                    anwesenheit
                );
            }

            setMessage(
                'Anwesenheit erfolgreich gespeichert.'
            );

            await loadAnwesenheiten();
        } catch (error) {
            console.error(error);

            setMessage(
                'Fehler beim Speichern der Anwesenheit.'
            );
        }
    };

    const handleEditStart = (anwesenheit) => {
        setEditingId(anwesenheit.id);

        setEditStatus(
            anwesenheit.status || 'ANWESEND'
        );

        setEditBemerkung(
            anwesenheit.bemerkung || ''
        );
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditStatus('');
        setEditBemerkung('');
    };

    const handleEditSave = async (
        anwesenheit
    ) => {
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

            setMessage(
                'Anwesenheit wurde aktualisiert.'
            );

            await loadAnwesenheiten();
        } catch (error) {
            console.error(error);

            setMessage(
                'Fehler beim Aktualisieren der Anwesenheit.'
            );
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            'Möchten Sie diesen Anwesenheitseintrag wirklich löschen?'
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteAnwesenheit(id);

            setMessage(
                'Anwesenheit wurde gelöscht.'
            );

            await loadAnwesenheiten();
        } catch (error) {
            console.error(error);

            setMessage(
                'Fehler beim Löschen der Anwesenheit.'
            );
        }
    };

    return (
        <div className="anwesenheit-page">

            <header className="page-header">
                <div className="page-header-content">
                    <h1>Anwesenheit</h1>

                    <p>
                        Anwesenheiten erfassen und bereits
                        gespeicherte Einträge verwalten
                    </p>
                </div>
            </header>

            <div className="anwesenheit-tabs">
                <button
                    type="button"
                    className={
                        activeTab === 'erfassen'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() =>
                        setActiveTab('erfassen')
                    }
                >
                    Anwesenheit erfassen
                </button>

                <button
                    type="button"
                    className={
                        activeTab === 'verlauf'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() =>
                        setActiveTab('verlauf')
                    }
                >
                    Verlauf
                </button>
            </div>

            {message && (
                <div className="anwesenheit-message">
                    {message}
                </div>
            )}

            {activeTab === 'erfassen' && (
                <section className="anwesenheit-section">

                    <div className="anwesenheit-section-header">
                        <div>
                            <h2>Anwesenheit erfassen</h2>

                            <p>
                                Datum und Kurs auswählen und
                                anschließend den Status der Schüler
                                erfassen.
                            </p>
                        </div>
                    </div>

                    <div className="anwesenheit-toolbar">
                        <div className="anwesenheit-field">
                            <label htmlFor="anwesenheit-datum">
                                Datum
                            </label>

                            <input
                                id="anwesenheit-datum"
                                type="date"
                                value={datum}
                                onChange={(event) =>
                                    setDatum(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="anwesenheit-field anwesenheit-field-large">
                            <label htmlFor="anwesenheit-kurs">
                                Kurs
                            </label>

                            <select
                                id="anwesenheit-kurs"
                                value={selectedKurs}
                                onChange={(event) =>
                                    handleKursChange(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Kurs auswählen...
                                </option>

                                {wochentage.map((tag) => {
                                    const kurseAmTag =
                                        getKurseByWochentag(
                                            tag
                                        );

                                    if (
                                        kurseAmTag.length === 0
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <optgroup
                                            key={tag}
                                            label={tag}
                                        >
                                            {kurseAmTag.map(
                                                (kurs) => (
                                                    <option
                                                        key={
                                                            kurs.id
                                                        }
                                                        value={
                                                            kurs.id
                                                        }
                                                    >
                                                        {
                                                            kurs.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </optgroup>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    {students.length === 0 ? (
                        <div className="anwesenheit-empty">
                            Kein Kurs ausgewählt oder keine
                            Schüler vorhanden.
                        </div>
                    ) : (
                        <>
                            <div className="anwesenheit-table-scroll">
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
                                    {students.map(
                                        (student) => (
                                            <tr
                                                key={
                                                    student.id
                                                }
                                            >
                                                <td>
                                                    {formatStudentName(
                                                        student
                                                    )}
                                                </td>

                                                <td>
                                                    {student.klasse ||
                                                        '–'}
                                                </td>

                                                <td>
                                                    <select
                                                        className="status-select"
                                                        value={
                                                            statuses[
                                                                student
                                                                    .id
                                                                ] ||
                                                            'ANWESEND'
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleStatusChange(
                                                                student.id,
                                                                event
                                                                    .target
                                                                    .value
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
                                                            bemerkungen[
                                                                student
                                                                    .id
                                                                ] ||
                                                            ''
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleBemerkungChange(
                                                                student.id,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="anwesenheit-actions">
                                <button
                                    type="button"
                                    className="save-button"
                                    onClick={
                                        handleSave
                                    }
                                >
                                    Anwesenheit speichern
                                </button>
                            </div>
                        </>
                    )}
                </section>
            )}

            {activeTab === 'verlauf' && (
                <section className="anwesenheit-section">

                    <div className="anwesenheit-section-header">
                        <div>
                            <h2>Verlauf</h2>

                            <p>
                                Gespeicherte Anwesenheiten
                                filtern, bearbeiten und löschen.
                            </p>
                        </div>

                        <span className="anwesenheit-count">
                            {
                                filteredAnwesenheiten.length
                            }{' '}
                            Einträge
                        </span>
                    </div>

                    <div className="anwesenheit-toolbar">
                        <div className="anwesenheit-field">
                            <label htmlFor="filter-datum">
                                Datum
                            </label>

                            <input
                                id="filter-datum"
                                type="date"
                                value={filterDatum}
                                onChange={(event) =>
                                    setFilterDatum(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="anwesenheit-field anwesenheit-field-large">
                            <label htmlFor="filter-kurs">
                                Kurs
                            </label>

                            <select
                                id="filter-kurs"
                                value={filterKurs}
                                onChange={(event) =>
                                    setFilterKurs(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Alle Kurse
                                </option>

                                {wochentage.map((tag) => {
                                    const kurseAmTag =
                                        getKurseByWochentag(
                                            tag
                                        );

                                    if (
                                        kurseAmTag.length === 0
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <optgroup
                                            key={tag}
                                            label={tag}
                                        >
                                            {kurseAmTag.map(
                                                (kurs) => (
                                                    <option
                                                        key={
                                                            kurs.id
                                                        }
                                                        value={
                                                            kurs.id
                                                        }
                                                    >
                                                        {
                                                            kurs.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </optgroup>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    {filteredAnwesenheiten.length === 0 ? (
                        <div className="anwesenheit-empty">
                            Keine Anwesenheiten für die
                            aktuelle Auswahl gefunden.
                        </div>
                    ) : (
                        <div className="anwesenheit-table-scroll">
                            <table className="anwesenheit-table anwesenheit-history-table">
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
                                {filteredAnwesenheiten.map(
                                    (anwesenheit) => (
                                        <tr
                                            key={
                                                anwesenheit.id
                                            }
                                        >
                                            <td>
                                                {
                                                    anwesenheit.datum
                                                }
                                            </td>

                                            <td>
                                                {formatStudentName(
                                                    anwesenheit.student
                                                )}
                                            </td>

                                            <td>
                                                {anwesenheit
                                                        .kurs
                                                        ?.name ||
                                                    '–'}
                                            </td>

                                            {editingId ===
                                            anwesenheit.id ? (
                                                <>
                                                    <td>
                                                        <select
                                                            className="status-select"
                                                            value={
                                                                editStatus
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setEditStatus(
                                                                    event
                                                                        .target
                                                                        .value
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
                                                            className="bemerkung-input"
                                                            value={
                                                                editBemerkung
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setEditBemerkung(
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td className="anwesenheit-action-cell">
                                                        <button
                                                            type="button"
                                                            className="btn-save"
                                                            onClick={() =>
                                                                handleEditSave(
                                                                    anwesenheit
                                                                )
                                                            }
                                                        >
                                                            Speichern
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-cancel"
                                                            onClick={
                                                                handleEditCancel
                                                            }
                                                        >
                                                            Abbrechen
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>
                                                        {
                                                            anwesenheit.status
                                                        }
                                                    </td>

                                                    <td>
                                                        {anwesenheit.bemerkung ||
                                                            '–'}
                                                    </td>

                                                    <td className="anwesenheit-action-cell">
                                                        <button
                                                            type="button"
                                                            className="btn-edit"
                                                            onClick={() =>
                                                                handleEditStart(
                                                                    anwesenheit
                                                                )
                                                            }
                                                        >
                                                            Bearbeiten
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    anwesenheit.id
                                                                )
                                                            }
                                                        >
                                                            Löschen
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    )
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default AnwesenheitPage;