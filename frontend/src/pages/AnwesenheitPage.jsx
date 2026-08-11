import React, { useEffect, useMemo, useState } from 'react';
import { getKurse } from '../services/kursService';

import {
    createAnwesenheit,
    getAnwesenheitenByZeitraum,
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

/*
 * Gibt das heutige Datum im Format YYYY-MM-DD zurück.
 */
const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

function AnwesenheitPage() {

    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [kurse, setKurse] = useState([]);

    const [selectedKurs, setSelectedKurs] = useState('');

    const [students, setStudents] = useState([]);

    const [statuses, setStatuses] = useState({});

    const [bemerkungen, setBemerkungen] = useState({});

    const [message, setMessage] = useState('');

    const [savedAnwesenheiten, setSavedAnwesenheiten] =
        useState([]);

    /* =====================================================
       TABS
       ===================================================== */

    const [activeTab, setActiveTab] =
        useState('erfassen');

    /* =====================================================
       ANWESENHEIT ERFASSEN
       ===================================================== */

    const [datum, setDatum] =
        useState(getToday());

    /* =====================================================
       VERLAUF / ZEITRAUM
       ===================================================== */

    const [filterVon, setFilterVon] =
        useState(getToday());

    const [filterBis, setFilterBis] =
        useState(getToday());

    const [filterKurs, setFilterKurs] =
        useState('');

    /*
     * Mögliche Werte:
     *
     * gesamt
     * kurse
     * kinder
     */
    const [anzeigeModus, setAnzeigeModus] =
        useState('gesamt');

    const [historyLoading, setHistoryLoading] =
        useState(false);

    /* =====================================================
       BEARBEITUNG
       ===================================================== */

    const [editingId, setEditingId] =
        useState(null);

    const [editStatus, setEditStatus] =
        useState('');

    const [editBemerkung, setEditBemerkung] =
        useState('');

    /* =====================================================
       INITIALISIERUNG
       ===================================================== */

    useEffect(() => {
        loadKurse();
        loadZeitraum(
            getToday(),
            getToday()
        );
    }, []);

    /* =====================================================
       HILFSFUNKTIONEN
       ===================================================== */

    const formatStudentName = (student) => {
        if (!student) {
            return '–';
        }

        const nachname =
            student.nachname || '';

        const vorname =
            student.vorname || '';

        if (!nachname && !vorname) {
            return '–';
        }

        return `${nachname}, ${vorname}`;
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'ANWESEND':
                return 'Anwesend';

            case 'FEHLT':
                return 'Fehlt';

            case 'ENTSCHULDIGT':
                return 'Entschuldigt';

            default:
                return status || '–';
        }
    };

    /* =====================================================
       KURSE LADEN
       ===================================================== */

    const loadKurse = async () => {
        try {
            const data =
                await getKurse();

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

    /* =====================================================
       ANWESENHEITEN NACH ZEITRAUM LADEN
       ===================================================== */

    const loadZeitraum = async (
        von = filterVon,
        bis = filterBis
    ) => {

        if (!von || !bis) {
            setMessage(
                'Bitte Von- und Bis-Datum auswählen.'
            );

            return;
        }

        if (von > bis) {
            setMessage(
                'Das Von-Datum darf nicht nach dem Bis-Datum liegen.'
            );

            return;
        }

        try {
            setHistoryLoading(true);
            setMessage('');

            const data =
                await getAnwesenheitenByZeitraum(
                    von,
                    bis
                );

            setSavedAnwesenheiten(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {
            console.error(error);

            setSavedAnwesenheiten([]);

            setMessage(
                'Anwesenheiten für den Zeitraum konnten nicht geladen werden.'
            );

        } finally {
            setHistoryLoading(false);
        }
    };

    /* =====================================================
       KURSE NACH WOCHENTAG
       ===================================================== */

    const getKurseByWochentag = (
        wochentag
    ) => {
        return kurse.filter(
            (kurs) =>
                kurs.wochentag === wochentag
        );
    };

    /* =====================================================
       VERLAUF FILTERN
       ===================================================== */

    const filteredAnwesenheiten =
        useMemo(() => {

            return savedAnwesenheiten
                .filter((anwesenheit) => {

                    const matchesKurs =
                        !filterKurs ||
                        anwesenheit.kurs?.id ===
                        Number(filterKurs);

                    return matchesKurs;
                })
                .sort((a, b) => {

                    const datumA =
                        String(a.datum ?? '');

                    const datumB =
                        String(b.datum ?? '');

                    return datumB.localeCompare(
                        datumA
                    );
                });

        }, [
            savedAnwesenheiten,
            filterKurs
        ]);

    /* =====================================================
       GRUPPIERUNG NACH KURS
       ===================================================== */

    const gruppiertNachKurs =
        useMemo(() => {

            const gruppen = {};

            filteredAnwesenheiten.forEach(
                (anwesenheit) => {

                    const kursId =
                        anwesenheit.kurs?.id ??
                        'ohne-kurs';

                    if (!gruppen[kursId]) {
                        gruppen[kursId] = {
                            kurs:
                            anwesenheit.kurs,
                            eintraege: []
                        };
                    }

                    gruppen[
                        kursId
                        ].eintraege.push(
                        anwesenheit
                    );
                }
            );

            return Object.values(
                gruppen
            ).sort((a, b) =>
                String(
                    a.kurs?.name ?? ''
                ).localeCompare(
                    String(
                        b.kurs?.name ?? ''
                    ),
                    'de'
                )
            );

        }, [filteredAnwesenheiten]);

    /* =====================================================
       GRUPPIERUNG NACH KIND
       ===================================================== */

    const gruppiertNachKind =
        useMemo(() => {

            const gruppen = {};

            filteredAnwesenheiten.forEach(
                (anwesenheit) => {

                    const studentId =
                        anwesenheit.student?.id ??
                        'ohne-student';

                    if (!gruppen[studentId]) {
                        gruppen[studentId] = {
                            student:
                            anwesenheit.student,
                            eintraege: []
                        };
                    }

                    gruppen[
                        studentId
                        ].eintraege.push(
                        anwesenheit
                    );
                }
            );

            return Object.values(
                gruppen
            ).sort((a, b) =>
                formatStudentName(
                    a.student
                ).localeCompare(
                    formatStudentName(
                        b.student
                    ),
                    'de'
                )
            );

        }, [filteredAnwesenheiten]);

    /* =====================================================
       KURS AUSWÄHLEN
       ===================================================== */

    const handleKursChange = async (
        kursId
    ) => {

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

            const buchungen =
                await response.json();

            const studentList =
                buchungen
                    .map(
                        (buchung) =>
                            buchung.student
                    )
                    .filter(Boolean);

            setStudents(
                studentList
            );

            const initialStatuses = {};
            const initialBemerkungen = {};

            studentList.forEach(
                (student) => {

                    initialStatuses[
                        student.id
                        ] = 'ANWESEND';

                    initialBemerkungen[
                        student.id
                        ] = '';
                }
            );

            setStatuses(
                initialStatuses
            );

            setBemerkungen(
                initialBemerkungen
            );

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

    /* =====================================================
       STATUS ÄNDERN
       ===================================================== */

    const handleStatusChange = (
        studentId,
        status
    ) => {

        setStatuses(
            (previous) => ({
                ...previous,

                [studentId]:
                status
            })
        );
    };

    /* =====================================================
       BEMERKUNG ÄNDERN
       ===================================================== */

    const handleBemerkungChange = (
        studentId,
        bemerkung
    ) => {

        setBemerkungen(
            (previous) => ({
                ...previous,

                [studentId]:
                bemerkung
            })
        );
    };

    /* =====================================================
       ANWESENHEIT SPEICHERN
       ===================================================== */

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

            for (
                const student of students
                ) {

                const anwesenheit = {
                    datum,

                    status:
                        statuses[
                            student.id
                            ] || 'ANWESEND',

                    bemerkung:
                        bemerkungen[
                            student.id
                            ] || ''
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

            /*
             * Wenn das gespeicherte Datum innerhalb
             * des aktuell angezeigten Zeitraums liegt,
             * aktualisieren wir direkt den Verlauf.
             */
            if (
                datum >= filterVon &&
                datum <= filterBis
            ) {
                await loadZeitraum();
            }

        } catch (error) {
            console.error(error);

            setMessage(
                'Fehler beim Speichern der Anwesenheit.'
            );
        }
    };

    /* =====================================================
       BEARBEITUNG STARTEN
       ===================================================== */

    const handleEditStart = (
        anwesenheit
    ) => {

        setEditingId(
            anwesenheit.id
        );

        setEditStatus(
            anwesenheit.status ||
            'ANWESEND'
        );

        setEditBemerkung(
            anwesenheit.bemerkung ||
            ''
        );
    };

    /* =====================================================
       BEARBEITUNG ABBRECHEN
       ===================================================== */

    const handleEditCancel = () => {

        setEditingId(null);

        setEditStatus('');

        setEditBemerkung('');
    };

    /* =====================================================
       BEARBEITUNG SPEICHERN
       ===================================================== */

    const handleEditSave = async (
        anwesenheit
    ) => {

        try {

            await createAnwesenheit(
                anwesenheit.student.id,
                anwesenheit.kurs.id,
                {
                    datum:
                    anwesenheit.datum,

                    status:
                    editStatus,

                    bemerkung:
                    editBemerkung
                }
            );

            setEditingId(null);

            setEditStatus('');

            setEditBemerkung('');

            setMessage(
                'Anwesenheit wurde aktualisiert.'
            );

            await loadZeitraum();

        } catch (error) {
            console.error(error);

            setMessage(
                'Fehler beim Aktualisieren der Anwesenheit.'
            );
        }
    };

    /* =====================================================
       ANWESENHEIT LÖSCHEN
       ===================================================== */

    const handleDelete = async (
        id
    ) => {

        const confirmed =
            window.confirm(
                'Möchten Sie diesen Anwesenheitseintrag wirklich löschen?'
            );

        if (!confirmed) {
            return;
        }

        try {

            await deleteAnwesenheit(
                id
            );

            setMessage(
                'Anwesenheit wurde gelöscht.'
            );

            await loadZeitraum();

        } catch (error) {
            console.error(error);

            setMessage(
                'Fehler beim Löschen der Anwesenheit.'
            );
        }
    };

    /* =====================================================
       RENDER
       ===================================================== */

    return (
        <div className="anwesenheit-page">

            {/* =================================================
                HEADER
               ================================================= */}

            <header className="page-header">

                <div className="page-header-content">

                    <h1>
                        Anwesenheit
                    </h1>

                    <p>
                        Anwesenheiten erfassen und bereits
                        gespeicherte Einträge verwalten
                    </p>

                </div>

            </header>

            {/* =================================================
                TABS
               ================================================= */}

            <div className="anwesenheit-tabs">

                <button
                    type="button"
                    className={
                        activeTab === 'erfassen'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() =>
                        setActiveTab(
                            'erfassen'
                        )
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
                        setActiveTab(
                            'verlauf'
                        )
                    }
                >
                    Verlauf
                </button>

            </div>

            {/* =================================================
                MELDUNG
               ================================================= */}

            {message && (
                <div className="anwesenheit-message">
                    {message}
                </div>
            )}

            {/* =================================================
                TAB: ANWESENHEIT ERFASSEN
               ================================================= */}

            {activeTab === 'erfassen' && (

                <section className="anwesenheit-section">

                    <div className="anwesenheit-section-header">

                        <div>

                            <h2>
                                Anwesenheit erfassen
                            </h2>

                            <p>
                                Datum und Kurs auswählen und
                                anschließend den Status der Schüler
                                erfassen.
                            </p>

                        </div>

                    </div>

                    {/* Auswahl */}

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

                                {wochentage.map(
                                    (tag) => {

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
                                                            key={kurs.id}
                                                            value={kurs.id}
                                                        >
                                                            {kurs.name}
                                                            {kurs.uhrzeit
                                                                ? ` | ${kurs.uhrzeit}`
                                                                : ''}
                                                        </option>

                                                    )
                                                )}

                                            </optgroup>
                                        );
                                    }
                                )}

                            </select>

                        </div>

                    </div>

                    {/* Keine Schüler */}

                    {students.length === 0 ? (

                        <div className="anwesenheit-empty">
                            Kein Kurs ausgewählt oder keine Schüler vorhanden.
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

                                            <tr key={student.id}>

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
                                                                student.id
                                                                ] ||
                                                            'ANWESEND'
                                                        }
                                                        onChange={(event) =>
                                                            handleStatusChange(
                                                                student.id,
                                                                event.target.value
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
                                                                student.id
                                                                ] ||
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            handleBemerkungChange(
                                                                student.id,
                                                                event.target.value
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
                                    onClick={handleSave}
                                >
                                    Anwesenheit speichern
                                </button>

                            </div>

                        </>

                    )}

                </section>

            )}

            {/* =================================================
                TAB: VERLAUF
               ================================================= */}

            {activeTab === 'verlauf' && (

                <section className="anwesenheit-section">

                    {/* Header */}

                    <div className="anwesenheit-section-header">

                        <div>

                            <h2>
                                Verlauf
                            </h2>

                            <p>
                                Anwesenheiten nach Zeitraum anzeigen,
                                filtern und auswerten.
                            </p>

                        </div>

                        <span className="anwesenheit-count">
                            {filteredAnwesenheiten.length}{' '}
                            Einträge
                        </span>

                    </div>

                    {/* =================================================
                        ZEITRAUM + KURS
                       ================================================= */}

                    <div className="anwesenheit-toolbar">

                        <div className="anwesenheit-field">

                            <label htmlFor="filter-von">
                                Von
                            </label>

                            <input
                                id="filter-von"
                                type="date"
                                value={filterVon}
                                onChange={(event) =>
                                    setFilterVon(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="anwesenheit-field">

                            <label htmlFor="filter-bis">
                                Bis
                            </label>

                            <input
                                id="filter-bis"
                                type="date"
                                value={filterBis}
                                onChange={(event) =>
                                    setFilterBis(
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

                                {wochentage.map(
                                    (tag) => {

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
                                                            key={kurs.id}
                                                            value={kurs.id}
                                                        >
                                                            {kurs.name}
                                                        </option>

                                                    )
                                                )}

                                            </optgroup>
                                        );
                                    }
                                )}

                            </select>

                        </div>

                        <button
                            type="button"
                            className="anwesenheit-load-button"
                            onClick={() =>
                                loadZeitraum()
                            }
                            disabled={historyLoading}
                        >
                            {historyLoading
                                ? 'Wird geladen...'
                                : 'Zeitraum anzeigen'}
                        </button>

                    </div>

                    {/* =================================================
                        ANZEIGEMODUS
                       ================================================= */}

                    <div className="anwesenheit-view-switch">

                        <button
                            type="button"
                            className={
                                anzeigeModus === 'gesamt'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setAnzeigeModus(
                                    'gesamt'
                                )
                            }
                        >
                            Gesamt
                        </button>

                        <button
                            type="button"
                            className={
                                anzeigeModus === 'kurse'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setAnzeigeModus(
                                    'kurse'
                                )
                            }
                        >
                            Nach Kursen
                        </button>

                        <button
                            type="button"
                            className={
                                anzeigeModus === 'kinder'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setAnzeigeModus(
                                    'kinder'
                                )
                            }
                        >
                            Nach Kindern
                        </button>

                    </div>

                    {/* =================================================
                        KEINE DATEN
                       ================================================= */}

                    {filteredAnwesenheiten.length === 0 ? (

                        <div className="anwesenheit-empty">
                            Keine Anwesenheiten für den ausgewählten
                            Zeitraum gefunden.
                        </div>

                    ) : (

                        <>

                            {/* =========================================
                                GESAMT
                               ========================================= */}

                            {anzeigeModus === 'gesamt' && (

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

                                                <tr key={anwesenheit.id}>

                                                    <td>
                                                        {anwesenheit.datum}
                                                    </td>

                                                    <td>
                                                        {formatStudentName(
                                                            anwesenheit.student
                                                        )}
                                                    </td>

                                                    <td>
                                                        {anwesenheit.kurs?.name ||
                                                            '–'}
                                                    </td>

                                                    {editingId ===
                                                    anwesenheit.id ? (

                                                        <>

                                                            <td>

                                                                <select
                                                                    className="status-select"
                                                                    value={editStatus}
                                                                    onChange={(event) =>
                                                                        setEditStatus(
                                                                            event.target.value
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
                                                                    value={editBemerkung}
                                                                    onChange={(event) =>
                                                                        setEditBemerkung(
                                                                            event.target.value
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
                                                                    onClick={handleEditCancel}
                                                                >
                                                                    Abbrechen
                                                                </button>

                                                            </td>

                                                        </>

                                                    ) : (

                                                        <>

                                                            <td>
                                                                {formatStatus(
                                                                    anwesenheit.status
                                                                )}
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

                            {/* =========================================
                                NACH KURSEN
                               ========================================= */}

                            {anzeigeModus === 'kurse' && (

                                <div className="anwesenheit-group-list">

                                    {gruppiertNachKurs.map(
                                        (gruppe) => (

                                            <div
                                                key={
                                                    gruppe.kurs?.id ??
                                                    'ohne-kurs'
                                                }
                                                className="anwesenheit-group"
                                            >

                                                <div className="anwesenheit-group-header">

                                                    <h3>
                                                        {gruppe.kurs?.name ||
                                                            'Ohne Kurs'}
                                                    </h3>

                                                    <span>
                                                        {gruppe.eintraege.length}{' '}
                                                        Einträge
                                                    </span>

                                                </div>

                                                <div className="anwesenheit-table-scroll">

                                                    <table className="anwesenheit-table">

                                                        <thead>
                                                        <tr>
                                                            <th>Datum</th>
                                                            <th>Schüler</th>
                                                            <th>Status</th>
                                                            <th>Bemerkung</th>
                                                        </tr>
                                                        </thead>

                                                        <tbody>

                                                        {gruppe.eintraege.map(
                                                            (anwesenheit) => (

                                                                <tr key={anwesenheit.id}>

                                                                    <td>
                                                                        {anwesenheit.datum}
                                                                    </td>

                                                                    <td>
                                                                        {formatStudentName(
                                                                            anwesenheit.student
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {formatStatus(
                                                                            anwesenheit.status
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {anwesenheit.bemerkung ||
                                                                            '–'}
                                                                    </td>

                                                                </tr>

                                                            )
                                                        )}

                                                        </tbody>

                                                    </table>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                            {/* =========================================
                                NACH KINDERN
                               ========================================= */}

                            {anzeigeModus === 'kinder' && (

                                <div className="anwesenheit-group-list">

                                    {gruppiertNachKind.map(
                                        (gruppe) => (

                                            <div
                                                key={
                                                    gruppe.student?.id ??
                                                    'ohne-student'
                                                }
                                                className="anwesenheit-group"
                                            >

                                                <div className="anwesenheit-group-header">

                                                    <h3>
                                                        {formatStudentName(
                                                            gruppe.student
                                                        )}
                                                    </h3>

                                                    <span>
                                                        {gruppe.eintraege.length}{' '}
                                                        Einträge
                                                    </span>

                                                </div>

                                                <div className="anwesenheit-table-scroll">

                                                    <table className="anwesenheit-table">

                                                        <thead>
                                                        <tr>
                                                            <th>Datum</th>
                                                            <th>Kurs</th>
                                                            <th>Status</th>
                                                            <th>Bemerkung</th>
                                                        </tr>
                                                        </thead>

                                                        <tbody>

                                                        {gruppe.eintraege.map(
                                                            (anwesenheit) => (

                                                                <tr key={anwesenheit.id}>

                                                                    <td>
                                                                        {anwesenheit.datum}
                                                                    </td>

                                                                    <td>
                                                                        {anwesenheit.kurs?.name ||
                                                                            '–'}
                                                                    </td>

                                                                    <td>
                                                                        {formatStatus(
                                                                            anwesenheit.status
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {anwesenheit.bemerkung ||
                                                                            '–'}
                                                                    </td>

                                                                </tr>

                                                            )
                                                        )}

                                                        </tbody>

                                                    </table>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </>

                    )}

                </section>

            )}

        </div>
    );
}

export default AnwesenheitPage;