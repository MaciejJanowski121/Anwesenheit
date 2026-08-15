import React, { useEffect, useMemo, useState } from 'react';

import { getKurse } from '../services/kursService';

import {
    createAnwesenheit,
    getAnwesenheitenByZeitraum,
    deleteAnwesenheit,
    exportAnwesenheiten
} from '../services/anwesenheitService';

import './AnwesenheitPage.css';

const wochentage = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag'
];

const getToday = () => {
    return new Date()
        .toISOString()
        .split('T')[0];
};

function AnwesenheitPage() {

    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [kurse, setKurse] =
        useState([]);

    const [selectedKurs, setSelectedKurs] =
        useState('');

    const [students, setStudents] =
        useState([]);

    const [statuses, setStatuses] =
        useState({});

    const [bemerkungen, setBemerkungen] =
        useState({});

    const [savedAnwesenheiten, setSavedAnwesenheiten] =
        useState([]);

    /* =====================================================
       MELDUNGEN
       ===================================================== */

    const [message, setMessage] =
        useState('');

    /*
     * success
     * error
     * info
     */
    const [messageType, setMessageType] =
        useState('success');

    const showSuccess = (text) => {
        setMessageType('success');
        setMessage(text);
    };

    const showError = (text) => {
        setMessageType('error');
        setMessage(text);
    };

    const clearMessage = () => {
        setMessage('');
    };

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

    const [saveLoading, setSaveLoading] =
        useState(false);

    /* =====================================================
       VERLAUF
       ===================================================== */

    const [filterVon, setFilterVon] =
        useState(getToday());

    const [filterBis, setFilterBis] =
        useState(getToday());

    const [filterKurs, setFilterKurs] =
        useState('');

    const [anzeigeModus, setAnzeigeModus] =
        useState('gesamt');

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [exportLoading, setExportLoading] =
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
            getToday(),
            false
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

            showError(
                'Kurse konnten nicht geladen werden.'
            );
        }
    };

    /* =====================================================
       ZEITRAUM LADEN
       ===================================================== */

    const loadZeitraum = async (
        von = filterVon,
        bis = filterBis,
        resetMessage = true
    ) => {

        if (!von || !bis) {

            showError(
                'Bitte Von- und Bis-Datum auswählen.'
            );

            return false;
        }

        if (von > bis) {

            showError(
                'Das Von-Datum darf nicht nach dem Bis-Datum liegen.'
            );

            return false;
        }

        try {

            setHistoryLoading(true);

            /*
             * Beim manuellen Laden darf die alte
             * Meldung verschwinden.
             *
             * Nach dem Speichern setzen wir
             * resetMessage = false, damit die
             * Erfolgsmeldung sichtbar bleibt.
             */
            if (resetMessage) {
                clearMessage();
            }

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

            return true;

        } catch (error) {

            console.error(error);

            setSavedAnwesenheiten([]);

            showError(
                'Anwesenheiten für den Zeitraum konnten nicht geladen werden.'
            );

            return false;

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
                kurs.wochentag ===
                wochentag
        );
    };

    /* =====================================================
       VERLAUF FILTERN
       ===================================================== */

    const filteredAnwesenheiten =
        useMemo(() => {

            return savedAnwesenheiten
                .filter(
                    (anwesenheit) => {

                        const matchesKurs =
                            !filterKurs ||
                            anwesenheit
                                .kurs
                                ?.id ===
                            Number(filterKurs);

                        return matchesKurs;
                    }
                )
                .sort(
                    (a, b) => {

                        const datumA =
                            String(
                                a.datum ?? ''
                            );

                        const datumB =
                            String(
                                b.datum ?? ''
                            );

                        return datumB
                            .localeCompare(
                                datumA
                            );
                    }
                );

        }, [
            savedAnwesenheiten,
            filterKurs
        ]);

    /* =====================================================
       NACH KURS GRUPPIEREN
       ===================================================== */

    const gruppiertNachKurs =
        useMemo(() => {

            const gruppen = {};

            filteredAnwesenheiten.forEach(
                (anwesenheit) => {

                    const kursId =
                        anwesenheit
                            .kurs
                            ?.id ??
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

            return Object
                .values(gruppen)
                .sort(
                    (a, b) =>
                        String(
                            a.kurs
                                ?.name ??
                            ''
                        ).localeCompare(
                            String(
                                b.kurs
                                    ?.name ??
                                ''
                            ),
                            'de'
                        )
                );

        }, [
            filteredAnwesenheiten
        ]);

    /* =====================================================
       NACH KIND GRUPPIEREN
       ===================================================== */

    const gruppiertNachKind =
        useMemo(() => {

            const gruppen = {};

            filteredAnwesenheiten.forEach(
                (anwesenheit) => {

                    const studentId =
                        anwesenheit
                            .student
                            ?.id ??
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

            return Object
                .values(gruppen)
                .sort(
                    (a, b) =>
                        formatStudentName(
                            a.student
                        ).localeCompare(
                            formatStudentName(
                                b.student
                            ),
                            'de'
                        )
                );

        }, [
            filteredAnwesenheiten
        ]);

    /* =====================================================
       KURS AUSWÄHLEN
       ===================================================== */

    const handleKursChange = async (
        kursId
    ) => {

        setSelectedKurs(
            kursId
        );

        clearMessage();

        if (!kursId) {

            setStudents([]);

            setStatuses({});

            setBemerkungen({});

            return;
        }

        try {

            const response =
                await fetch(
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

            showError(
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

            showError(
                'Bitte zuerst einen Kurs auswählen.'
            );

            return;
        }

        if (students.length === 0) {

            showError(
                'Für diesen Kurs gibt es keine Schüler.'
            );

            return;
        }

        try {

            setSaveLoading(true);

            clearMessage();

            for (
                const student of students
                ) {

                const anwesenheit = {

                    datum,

                    status:
                        statuses[
                            student.id
                            ] ||
                        'ANWESEND',

                    bemerkung:
                        bemerkungen[
                            student.id
                            ] ||
                        ''
                };

                await createAnwesenheit(
                    student.id,
                    selectedKurs,
                    anwesenheit
                );
            }

            /*
             * Erfolgsmeldung setzen.
             */
            showSuccess(
                'Anwesenheit wurde erfolgreich gespeichert.'
            );

            /*
             * Verlauf aktualisieren, wenn das Datum
             * innerhalb des ausgewählten Zeitraums liegt.
             *
             * false verhindert, dass loadZeitraum()
             * unsere Erfolgsmeldung wieder löscht.
             */
            if (
                datum >= filterVon &&
                datum <= filterBis
            ) {

                await loadZeitraum(
                    filterVon,
                    filterBis,
                    false
                );
            }

        } catch (error) {

            console.error(error);

            showError(
                'Anwesenheit konnte nicht gespeichert werden.'
            );

        } finally {

            setSaveLoading(false);
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

            showSuccess(
                'Anwesenheit wurde erfolgreich aktualisiert.'
            );

            await loadZeitraum(
                filterVon,
                filterBis,
                false
            );

        } catch (error) {

            console.error(error);

            showError(
                'Anwesenheit konnte nicht aktualisiert werden.'
            );
        }
    };

    /* =====================================================
       LÖSCHEN
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

            showSuccess(
                'Anwesenheit wurde erfolgreich gelöscht.'
            );

            await loadZeitraum(
                filterVon,
                filterBis,
                false
            );

        } catch (error) {

            console.error(error);

            showError(
                'Anwesenheit konnte nicht gelöscht werden.'
            );
        }
    };

    /* =====================================================
       EXCEL EXPORT
       ===================================================== */

    const handleExport = async () => {

        if (
            !filterVon ||
            !filterBis
        ) {

            showError(
                'Bitte einen Zeitraum für den Export auswählen.'
            );

            return;
        }

        if (
            filterVon >
            filterBis
        ) {

            showError(
                'Das Von-Datum darf nicht nach dem Bis-Datum liegen.'
            );

            return;
        }

        try {

            setExportLoading(true);

            clearMessage();

            const blob =
                await exportAnwesenheiten(
                    filterVon,
                    filterBis,
                    filterKurs
                );

            const url =
                window.URL
                    .createObjectURL(
                        blob
                    );

            const link =
                document
                    .createElement(
                        'a'
                    );

            link.href = url;

            link.download =
                `Anwesenheit_${filterVon}_bis_${filterBis}.xlsx`;

            document.body
                .appendChild(
                    link
                );

            link.click();

            link.remove();

            window.URL
                .revokeObjectURL(
                    url
                );

            showSuccess(
                'Excel-Export wurde erfolgreich erstellt.'
            );

        } catch (error) {

            console.error(
                'Fehler beim Excel-Export:',
                error
            );

            showError(
                'Excel-Export konnte nicht erstellt werden.'
            );

        } finally {

            setExportLoading(false);
        }
    };

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="anwesenheit-page">

            {/* =================================================
                PAGE HEADER
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
                        activeTab ===
                        'erfassen'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() => {

                        setActiveTab(
                            'erfassen'
                        );

                        clearMessage();
                    }}
                >
                    Anwesenheit erfassen
                </button>

                <button
                    type="button"
                    className={
                        activeTab ===
                        'verlauf'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() => {

                        setActiveTab(
                            'verlauf'
                        );

                        clearMessage();
                    }}
                >
                    Verlauf
                </button>

            </div>

            {/* =================================================
                MELDUNG
               ================================================= */}

            {message && (

                <div
                    className={
                        `anwesenheit-message ${messageType}`
                    }
                >
                    <span className="anwesenheit-message-icon">
                        {messageType ===
                        'success'
                            ? '✓'
                            : '!'}
                    </span>

                    <span>
                        {message}
                    </span>
                </div>

            )}

            {/* =================================================
                ANWESENHEIT ERFASSEN
               ================================================= */}

            {activeTab ===
                'erfassen' && (

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

                        {/* =================================================
                        DATUM / KURS
                       ================================================= */}

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
                                                kurseAmTag
                                                    .length ===
                                                0
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

                                                                {
                                                                    kurs.uhrzeit
                                                                        ? ` | ${kurs.uhrzeit}`
                                                                        : ''
                                                                }
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

                        {/* =================================================
                        SCHÜLER
                       ================================================= */}

                        {students.length ===
                        0 ? (

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

                                                <tr
                                                    key={
                                                        student.id
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            formatStudentName(
                                                                student
                                                            )
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            student.klasse ||
                                                            '–'
                                                        }
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
                                                            onChange={(
                                                                event
                                                            ) =>
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
                                                            onChange={(
                                                                event
                                                            ) =>
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
                                        onClick={
                                            handleSave
                                        }
                                        disabled={
                                            saveLoading
                                        }
                                    >

                                        {saveLoading
                                            ? 'Wird gespeichert...'
                                            : 'Anwesenheit speichern'}

                                    </button>

                                </div>

                            </>

                        )}

                    </section>

                )}

            {/* =================================================
                VERLAUF
               ================================================= */}

            {activeTab ===
                'verlauf' && (

                    <section className="anwesenheit-section">

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

                            {
                                filteredAnwesenheiten
                                    .length
                            }{' '}
                                Einträge

                        </span>

                        </div>

                        {/* =================================================
                        FILTER
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
                                                kurseAmTag
                                                    .length ===
                                                0
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
                                        }
                                    )}

                                </select>

                            </div>

                            <div className="anwesenheit-toolbar-actions">

                                <button
                                    type="button"
                                    className="anwesenheit-load-button"
                                    onClick={() =>
                                        loadZeitraum()
                                    }
                                    disabled={
                                        historyLoading
                                    }
                                >

                                    {historyLoading
                                        ? 'Wird geladen...'
                                        : 'Zeitraum anzeigen'}

                                </button>

                                <button
                                    type="button"
                                    className="anwesenheit-export-button"
                                    onClick={
                                        handleExport
                                    }
                                    disabled={
                                        exportLoading
                                    }
                                >

                                    {exportLoading
                                        ? 'Export läuft...'
                                        : 'Excel exportieren'}

                                </button>

                            </div>

                        </div>

                        {/* =================================================
                        ANZEIGEMODUS
                       ================================================= */}

                        <div className="anwesenheit-view-switch">

                            <button
                                type="button"
                                className={
                                    anzeigeModus ===
                                    'gesamt'
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
                                    anzeigeModus ===
                                    'kurse'
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
                                    anzeigeModus ===
                                    'kinder'
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

                        {filteredAnwesenheiten
                            .length ===
                        0 ? (

                            <div className="anwesenheit-empty">

                                Keine Anwesenheiten für den ausgewählten Zeitraum gefunden.

                            </div>

                        ) : (

                            <>

                                {/* =================================================
                                GESAMT
                               ================================================= */}

                                {anzeigeModus ===
                                    'gesamt' && (

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
                                                    (
                                                        anwesenheit
                                                    ) => (

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
                                                                {
                                                                    formatStudentName(
                                                                        anwesenheit.student
                                                                    )
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    anwesenheit
                                                                        .kurs
                                                                        ?.name ||
                                                                    '–'
                                                                }
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
                                                                            value={
                                                                                editBemerkung
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
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
                                                                            formatStatus(
                                                                                anwesenheit.status
                                                                            )
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            anwesenheit.bemerkung ||
                                                                            '–'
                                                                        }
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

                                {/* =================================================
                                NACH KURSEN
                               ================================================= */}

                                {anzeigeModus ===
                                    'kurse' && (

                                        <div className="anwesenheit-group-list">

                                            {gruppiertNachKurs.map(
                                                (
                                                    gruppe
                                                ) => (

                                                    <div
                                                        key={
                                                            gruppe
                                                                .kurs
                                                                ?.id ??
                                                            'ohne-kurs'
                                                        }
                                                        className="anwesenheit-group"
                                                    >

                                                        <div className="anwesenheit-group-header">

                                                            <h3>
                                                                {
                                                                    gruppe
                                                                        .kurs
                                                                        ?.name ||
                                                                    'Ohne Kurs'
                                                                }
                                                            </h3>

                                                            <span>
                                                        {
                                                            gruppe
                                                                .eintraege
                                                                .length
                                                        }{' '}
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
                                                                    (
                                                                        anwesenheit
                                                                    ) => (

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
                                                                                {
                                                                                    formatStudentName(
                                                                                        anwesenheit.student
                                                                                    )
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    formatStatus(
                                                                                        anwesenheit.status
                                                                                    )
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    anwesenheit.bemerkung ||
                                                                                    '–'
                                                                                }
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

                                {/* =================================================
                                NACH KINDERN
                               ================================================= */}

                                {anzeigeModus ===
                                    'kinder' && (

                                        <div className="anwesenheit-group-list">

                                            {gruppiertNachKind.map(
                                                (
                                                    gruppe
                                                ) => (

                                                    <div
                                                        key={
                                                            gruppe
                                                                .student
                                                                ?.id ??
                                                            'ohne-student'
                                                        }
                                                        className="anwesenheit-group"
                                                    >

                                                        <div className="anwesenheit-group-header">

                                                            <h3>
                                                                {
                                                                    formatStudentName(
                                                                        gruppe.student
                                                                    )
                                                                }
                                                            </h3>

                                                            <span>
                                                        {
                                                            gruppe
                                                                .eintraege
                                                                .length
                                                        }{' '}
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
                                                                    (
                                                                        anwesenheit
                                                                    ) => (

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
                                                                                {
                                                                                    anwesenheit
                                                                                        .kurs
                                                                                        ?.name ||
                                                                                    '–'
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    formatStatus(
                                                                                        anwesenheit.status
                                                                                    )
                                                                                }
                                                                            </td>

                                                                            <td>
                                                                                {
                                                                                    anwesenheit.bemerkung ||
                                                                                    '–'
                                                                                }
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