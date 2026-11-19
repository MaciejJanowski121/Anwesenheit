import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    getTagesAnwesenheitenByZeitraum,
    updateTagesAnwesenheit,
    deleteTagesAnwesenheit
} from '../../services/tagesAnwesenheitService';

import {
    getSchuelerinfos
} from '../../services/schuelerinfoService';

import {
    getKlassen
} from '../../services/klasseService';

import {
    getAngebote
} from '../../services/angebotService';

import {
    getKurse
} from '../../services/kursService';

import {
    getTeilnahmenByAngebot
} from '../../services/angebotTeilnahmeService';

import {
    getBuchungenByKurs
} from '../../services/buchungService';

import {
    getToday,
    formatDatum,
    formatTime,
    getStudentName,
    getKlasseClassName,
    normalizeAnwesenheit,
    getChangedFields,
    validateAnwesenheit,
    matchesWochentag,
    getErrorMessage,
    TIME_OPTIONS
} from './AnwesenheitUtils';

/* =====================================================
   ANSICHTEN
   ===================================================== */

const VIEW_MODES = [
    { key: 'gesamt', label: 'Gesamt' },
    { key: 'klasse', label: 'Nach Klasse' },
    { key: 'angebot', label: 'Nach Angebot' },
    { key: 'ana', label: 'Nach ANA' },
    { key: 'kind', label: 'Nach Kind' }
];

const normalizeId = value =>
    String(value ?? '');

const normalizeText = value =>
    String(value ?? '')
        .trim()
        .toLocaleLowerCase('de');

/* =====================================================
   MONATSBEGINN
   ===================================================== */

const getMonthStart = () => {

    const today = getToday();

    return `${today.slice(0, 7)}-01`;
};

/* =====================================================
   UHRZEIT SELECT
   ===================================================== */

function HistoryTimeSelect({
                               value,
                               onChange,
                               disabled,
                               label
                           }) {

    return (

        <select
            className="anwesenheit-time-select"
            value={value || ''}
            disabled={disabled}
            aria-label={label}
            onChange={event =>
                onChange(event.target.value)
            }
        >

            <option value="">
                –
            </option>

            {TIME_OPTIONS.map(time => (

                <option
                    key={time}
                    value={time}
                >
                    {time}
                </option>

            ))}

        </select>
    );
}

/* =====================================================
   ANWESENHEIT VERLAUF
   ===================================================== */

function AnwesenheitVerlauf({
                                isAdmin = false
                            }) {

    /* =====================================================
       ZEITRAUM
       ===================================================== */

    const [von, setVon] =
        useState(getMonthStart);

    const [bis, setBis] =
        useState(getToday);

    const [loadedZeitraum, setLoadedZeitraum] =
        useState(null);

    /* =====================================================
       DATEN
       ===================================================== */

    const [entries, setEntries] =
        useState([]);

    const [students, setStudents] =
        useState([]);

    const [klassen, setKlassen] =
        useState([]);

    const [angebote, setAngebote] =
        useState([]);

    const [kurse, setKurse] =
        useState([]);

    const [angebotTeilnahmen, setAngebotTeilnahmen] =
        useState([]);

    const [buchungen, setBuchungen] =
        useState([]);

    /* =====================================================
       FILTER
       ===================================================== */

    const [viewMode, setViewMode] =
        useState('gesamt');

    const [selectedKlasse, setSelectedKlasse] =
        useState('');

    const [selectedAngebot, setSelectedAngebot] =
        useState('');

    const [selectedKurs, setSelectedKurs] =
        useState('');

    const [selectedStudent, setSelectedStudent] =
        useState('');

    const [search, setSearch] =
        useState('');

    const [jahrgangFilter, setJahrgangFilter] =
        useState('');

    /* =====================================================
       SORTIERUNG
       ===================================================== */

    const [sortKey, setSortKey] =
        useState('datum');

    const [sortDirection, setSortDirection] =
        useState('desc');

    /* =====================================================
       BEARBEITUNG
       ===================================================== */

    const [editingId, setEditingId] =
        useState(null);

    const [editValues, setEditValues] =
        useState(null);

    /* =====================================================
       STATUS
       ===================================================== */

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const [message, setMessage] =
        useState('');

    /* =====================================================
       GRUNDDATEN LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const initialize = async () => {

            try {

                setLoading(true);
                setError('');

                const [
                    studentData,
                    klassenData,
                    angeboteData,
                    kurseData,
                    anwesenheitData
                ] = await Promise.all([

                    getSchuelerinfos(),
                    getKlassen(),
                    getAngebote(),
                    getKurse(),
                    getTagesAnwesenheitenByZeitraum(
                        getMonthStart(),
                        getToday()
                    )
                ]);

                const angebotResults =
                    await Promise.all(

                        angeboteData.map(async angebot => {

                            const teilnahmen =
                                await getTeilnahmenByAngebot(
                                    angebot.id
                                );

                            return teilnahmen.map(
                                teilnahme => ({
                                    ...teilnahme,
                                    angebot
                                })
                            );
                        })
                    );

                const kursResults =
                    await Promise.all(

                        kurseData.map(async kurs => {

                            const kursBuchungen =
                                await getBuchungenByKurs(
                                    kurs.id
                                );

                            return kursBuchungen.map(
                                buchung => ({
                                    ...buchung,
                                    kurs
                                })
                            );
                        })
                    );

                if (!active) {
                    return;
                }

                setStudents(studentData);
                setKlassen(klassenData);
                setAngebote(angeboteData);
                setKurse(kurseData);

                setAngebotTeilnahmen(
                    angebotResults.flat()
                );

                setBuchungen(
                    kursResults.flat()
                );

                setEntries(anwesenheitData);

                setLoadedZeitraum({
                    von: getMonthStart(),
                    bis: getToday()
                });

            } catch (err) {

                if (active) {

                    setError(
                        getErrorMessage(
                            err,
                            'Der Anwesenheitsverlauf konnte nicht geladen werden.'
                        )
                    );
                }

            } finally {

                if (active) {
                    setLoading(false);
                }
            }
        };

        initialize();

        return () => {
            active = false;
        };

    }, []);

    /* =====================================================
       ZEITRAUM LADEN
       ===================================================== */

    const handleLoad = async () => {

        if (loading || saving || editingId !== null) {
            return;
        }

        if (!von || !bis) {

            setError(
                'Bitte geben Sie einen vollständigen Zeitraum an.'
            );

            return;
        }

        if (von > bis) {

            setError(
                'Das Startdatum darf nicht nach dem Enddatum liegen.'
            );

            return;
        }

        try {

            setLoading(true);
            setError('');
            setMessage('');

            const result =
                await getTagesAnwesenheitenByZeitraum(
                    von,
                    bis
                );

            setEntries(result);

            setLoadedZeitraum({
                von,
                bis
            });

        } catch (err) {

            setError(
                getErrorMessage(
                    err,
                    'Der Zeitraum konnte nicht geladen werden.'
                )
            );

        } finally {

            setLoading(false);
        }
    };

    /* =====================================================
       ANGEBOTE PRO SCHÜLER
       ===================================================== */

    const angeboteByStudent = useMemo(() => {

        const result = {};

        angebotTeilnahmen.forEach(teilnahme => {

            const studentId =
                normalizeId(
                    teilnahme.student?.id
                );

            if (!studentId) {
                return;
            }

            if (!result[studentId]) {
                result[studentId] = [];
            }

            result[studentId].push(teilnahme);
        });

        return result;

    }, [angebotTeilnahmen]);

    /* =====================================================
       ANA PRO SCHÜLER
       ===================================================== */

    const anaByStudent = useMemo(() => {

        const result = {};

        buchungen.forEach(buchung => {

            const studentId =
                normalizeId(
                    buchung.student?.id
                );

            if (!studentId) {
                return;
            }

            if (!result[studentId]) {
                result[studentId] = [];
            }

            result[studentId].push(buchung);
        });

        return result;

    }, [buchungen]);

    /* =====================================================
       JAHRGÄNGE
       ===================================================== */

    const jahrgaenge = useMemo(() => {

        return [
            ...new Set(

                students
                    .map(student => student.jahrgang)
                    .filter(value => value != null)

            )
        ].sort((a, b) =>
            Number(a) - Number(b)
        );

    }, [students]);

    /* =====================================================
       TABELLENDATEN
       ===================================================== */

    const rows = useMemo(() => {

        return entries.map(entry => {

            const student =
                entry.student || {};

            const studentId =
                normalizeId(student.id);

            const tagesAngebote = (
                angeboteByStudent[studentId] || []
            ).filter(teilnahme =>

                matchesWochentag(
                    teilnahme.angebot?.wochentag,
                    entry.datum
                )
            );

            const tagesAna = (
                anaByStudent[studentId] || []
            ).filter(buchung =>

                matchesWochentag(
                    buchung.kurs?.wochentag,
                    entry.datum
                )
            );

            const gruppen = [

                ...tagesAngebote.map(teilnahme => ({
                    id: teilnahme.angebot?.id,
                    typ: 'Angebot',
                    name: teilnahme.angebot?.name
                })),

                ...tagesAna.map(buchung => ({
                    id: buchung.kurs?.id,
                    typ: 'ANA',
                    name: buchung.kurs?.name
                }))
            ];

            return {

                ...entry,

                studentId,

                name: getStudentName(student),

                klasse: student.klasse || '',

                jahrgang: student.jahrgang,

                angebote: tagesAngebote,

                ana: tagesAna,

                gruppen,

                gruppenText: gruppen
                    .map(gruppe =>
                        `${gruppe.typ}: ${gruppe.name}`
                    )
                    .join(' · ')
            };
        });

    }, [
        entries,
        angeboteByStudent,
        anaByStudent
    ]);

    /* =====================================================
       FILTERN
       ===================================================== */

    const filteredRows = useMemo(() => {

        const term = normalizeText(search);

        return rows.filter(row => {

            if (
                viewMode === 'klasse' &&
                selectedKlasse &&
                normalizeText(row.klasse) !==
                normalizeText(selectedKlasse)
            ) {
                return false;
            }

            if (
                viewMode === 'angebot' &&
                selectedAngebot
            ) {

                const assigned =
                    row.angebote.some(teilnahme =>

                        normalizeId(
                            teilnahme.angebot?.id
                        ) ===
                        normalizeId(selectedAngebot)
                    );

                if (!assigned) {
                    return false;
                }
            }

            if (
                viewMode === 'ana' &&
                selectedKurs
            ) {

                const assigned =
                    row.ana.some(buchung =>

                        normalizeId(
                            buchung.kurs?.id
                        ) ===
                        normalizeId(selectedKurs)
                    );

                if (!assigned) {
                    return false;
                }
            }

            if (
                viewMode === 'kind' &&
                selectedStudent &&
                row.studentId !==
                normalizeId(selectedStudent)
            ) {
                return false;
            }

            if (
                jahrgangFilter &&
                normalizeId(row.jahrgang) !==
                normalizeId(jahrgangFilter)
            ) {
                return false;
            }

            if (!term) {
                return true;
            }

            return [

                row.name,
                row.student?.vorname,
                row.student?.nachname,
                `${row.student?.vorname ?? ''} ${row.student?.nachname ?? ''}`,
                row.klasse,
                row.gruppenText,
                row.grundAbwesenheit,
                row.bemerkung

            ].some(value =>
                normalizeText(value).includes(term)
            );
        });

    }, [
        rows,
        viewMode,
        selectedKlasse,
        selectedAngebot,
        selectedKurs,
        selectedStudent,
        jahrgangFilter,
        search
    ]);

    /* =====================================================
       SORTIEREN
       ===================================================== */

    const sortedRows = useMemo(() => {

        return [...filteredRows].sort((a, b) => {

            let result;

            if (sortKey === 'jahrgang') {

                result =
                    Number(a.jahrgang ?? 0) -
                    Number(b.jahrgang ?? 0);

            } else {

                result = String(
                    a[sortKey] ?? ''
                ).localeCompare(

                    String(b[sortKey] ?? ''),

                    'de',

                    {
                        numeric: true,
                        sensitivity: 'base'
                    }
                );
            }

            if (result === 0) {

                result = a.name.localeCompare(
                    b.name,
                    'de'
                );
            }

            return sortDirection === 'asc'
                ? result
                : -result;
        });

    }, [
        filteredRows,
        sortKey,
        sortDirection
    ]);

    const handleSort = key => {

        if (sortKey === key) {

            setSortDirection(previous =>
                previous === 'asc'
                    ? 'desc'
                    : 'asc'
            );

        } else {

            setSortKey(key);
            setSortDirection('asc');
        }
    };

    /* =====================================================
       ANSICHT WECHSELN
       ===================================================== */

    const handleViewChange = mode => {

        setViewMode(mode);

        setSelectedKlasse('');
        setSelectedAngebot('');
        setSelectedKurs('');
        setSelectedStudent('');

        setSearch('');
        setJahrgangFilter('');
    };

    /* =====================================================
       BEARBEITUNG STARTEN
       ===================================================== */

    const handleEdit = entry => {

        setEditingId(entry.id);

        setEditValues(
            normalizeAnwesenheit(entry)
        );

        setError('');
        setMessage('');
    };

    /* =====================================================
       BEARBEITUNG ABBRECHEN
       ===================================================== */

    const handleCancelEdit = () => {

        setEditingId(null);
        setEditValues(null);
        setError('');
    };

    /* =====================================================
       FELD ÄNDERN
       ===================================================== */

    const handleEditChange = (
        field,
        value
    ) => {

        setEditValues(previous => {

            const next = {

                ...previous,

                [field]: value
            };

            if (
                field === 'status' &&
                value === 'FEHLT'
            ) {

                next.abwesendAb = '';
                next.abwesendBis = '';
            }

            return next;
        });
    };

    /* =====================================================
       BEARBEITUNG SPEICHERN
       ===================================================== */

    const handleSaveEdit = async entry => {

        if (!editValues || saving) {
            return;
        }

        const validationError =
            validateAnwesenheit(editValues);

        if (validationError) {

            setError(validationError);

            return;
        }

        const changes =
            getChangedFields(
                entry,
                editValues
            );

        if (
            Object.keys(changes).length === 0
        ) {

            handleCancelEdit();

            return;
        }

        try {

            setSaving(true);
            setError('');
            setMessage('');

            const updated =
                await updateTagesAnwesenheit(

                    entry.student.id,

                    entry.datum,

                    changes
                );

            setEntries(previous =>

                previous.map(item =>

                    item.id === entry.id

                        ? updated

                        : item
                )
            );

            setEditingId(null);
            setEditValues(null);

            setMessage(
                'Die Anwesenheit wurde aktualisiert.'
            );

        } catch (err) {

            setError(
                getErrorMessage(
                    err,
                    'Die Anwesenheit konnte nicht gespeichert werden.'
                )
            );

        } finally {

            setSaving(false);
        }
    };

    /* =====================================================
       ANWESENHEIT LÖSCHEN
       ===================================================== */

    const handleDelete = async entry => {

        if (!isAdmin || saving) {
            return;
        }

        const confirmed = window.confirm(

            `Soll die Anwesenheit von ${entry.name} ` +
            `am ${formatDatum(entry.datum)} wirklich gelöscht werden?`

        );

        if (!confirmed) {
            return;
        }

        try {

            setSaving(true);
            setError('');
            setMessage('');

            await deleteTagesAnwesenheit(
                entry.id
            );

            setEntries(previous =>

                previous.filter(item =>
                    item.id !== entry.id
                )
            );

            setMessage(
                'Der Anwesenheitseintrag wurde gelöscht.'
            );

        } catch (err) {

            setError(
                getErrorMessage(
                    err,
                    'Der Eintrag konnte nicht gelöscht werden.'
                )
            );

        } finally {

            setSaving(false);
        }
    };

    /* =====================================================
       SORTIERBARE ÜBERSCHRIFT
       ===================================================== */

    const renderSortHeader = (
        label,
        key
    ) => (

        <th
            className="sortable-header"
            aria-sort={
                sortKey === key
                    ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                    : 'none'
            }
        >

            <button
                type="button"
                className="anwesenheit-sort-button"
                onClick={() => handleSort(key)}
            >

                {label}

                {sortKey === key && (

                    <span className="anwesenheit-sort-icon">

                        {sortDirection === 'asc'
                            ? '▲'
                            : '▼'}

                    </span>

                )}

            </button>

        </th>
    );

    /* =====================================================
       STATISTIK
       ===================================================== */

    const statistik = useMemo(() => {

        return {

            gesamt: sortedRows.length,

            anwesend: sortedRows.filter(
                row => row.status === 'ANWESEND'
            ).length,

            fehlend: sortedRows.filter(
                row => row.status === 'FEHLT'
            ).length,

            teilweise: sortedRows.filter(
                row =>
                    row.status !== 'FEHLT' &&
                    (
                        row.abwesendAb ||
                        row.abwesendBis
                    )
            ).length

        };

    }, [sortedRows]);

    const controlsDisabled =
        loading ||
        saving ||
        editingId !== null;

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <section className="anwesenheit-section">

            {/* HEADER */}

            <div className="anwesenheit-section-header">

                <div>

                    <h2>
                        Anwesenheitsverlauf
                    </h2>

                    <p>
                        Gespeicherte Anwesenheiten anzeigen
                        und bearbeiten
                    </p>

                </div>

                <span className="anwesenheit-count">

                    {sortedRows.length} Einträge

                </span>

            </div>

            {/* MELDUNGEN */}

            {error && (

                <div
                    className="anwesenheit-message error"
                    role="alert"
                >
                    {error}
                </div>

            )}

            {message && (

                <div className="anwesenheit-message success">
                    {message}
                </div>

            )}

            {/* ZEITRAUM */}

            <div className="anwesenheit-toolbar">

                <div className="anwesenheit-field">

                    <label htmlFor="verlauf-von">
                        Von
                    </label>

                    <input
                        id="verlauf-von"
                        type="date"
                        value={von}
                        disabled={controlsDisabled}
                        onChange={event =>
                            setVon(event.target.value)
                        }
                    />

                </div>

                <div className="anwesenheit-field">

                    <label htmlFor="verlauf-bis">
                        Bis
                    </label>

                    <input
                        id="verlauf-bis"
                        type="date"
                        value={bis}
                        disabled={controlsDisabled}
                        onChange={event =>
                            setBis(event.target.value)
                        }
                    />

                </div>

                <div className="anwesenheit-toolbar-actions">

                    <button
                        type="button"
                        className="anwesenheit-load-button"
                        disabled={controlsDisabled}
                        onClick={handleLoad}
                    >

                        Zeitraum laden

                    </button>

                </div>

            </div>

            {/* ANSICHTEN */}

            <div className="anwesenheit-view-switch">

                {VIEW_MODES.map(mode => (

                    <button
                        key={mode.key}
                        type="button"
                        disabled={controlsDisabled}
                        className={
                            viewMode === mode.key
                                ? 'active'
                                : ''
                        }
                        onClick={() =>
                            handleViewChange(mode.key)
                        }
                    >

                        {mode.label}

                    </button>

                ))}

            </div>

            {/* GRUPPENFILTER */}

            {viewMode !== 'gesamt' && (

                <div className="anwesenheit-toolbar">

                    {viewMode === 'klasse' && (

                        <div className="anwesenheit-field anwesenheit-field-large">

                            <label htmlFor="verlauf-klasse">
                                Klasse
                            </label>

                            <select
                                id="verlauf-klasse"
                                value={selectedKlasse}
                                disabled={controlsDisabled}
                                onChange={event =>
                                    setSelectedKlasse(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Alle Klassen
                                </option>

                                {klassen.map(klasse => (

                                    <option
                                        key={klasse.id}
                                        value={klasse.name}
                                    >
                                        {klasse.name}
                                    </option>

                                ))}

                            </select>

                        </div>

                    )}

                    {viewMode === 'angebot' && (

                        <div className="anwesenheit-field anwesenheit-field-large">

                            <label htmlFor="verlauf-angebot">
                                Angebot
                            </label>

                            <select
                                id="verlauf-angebot"
                                value={selectedAngebot}
                                disabled={controlsDisabled}
                                onChange={event =>
                                    setSelectedAngebot(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Alle Angebote
                                </option>

                                {angebote.map(angebot => (

                                    <option
                                        key={angebot.id}
                                        value={angebot.id}
                                    >

                                        {angebot.name}
                                        {' · '}
                                        {angebot.wochentag}

                                    </option>

                                ))}

                            </select>

                        </div>

                    )}

                    {viewMode === 'ana' && (

                        <div className="anwesenheit-field anwesenheit-field-large">

                            <label htmlFor="verlauf-ana">
                                ANA
                            </label>

                            <select
                                id="verlauf-ana"
                                value={selectedKurs}
                                disabled={controlsDisabled}
                                onChange={event =>
                                    setSelectedKurs(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Alle ANA
                                </option>

                                {kurse.map(kurs => (

                                    <option
                                        key={kurs.id}
                                        value={kurs.id}
                                    >

                                        {kurs.name}
                                        {' · '}
                                        {kurs.wochentag}

                                    </option>

                                ))}

                            </select>

                        </div>

                    )}

                    {viewMode === 'kind' && (

                        <div className="anwesenheit-field anwesenheit-field-large">

                            <label htmlFor="verlauf-kind">
                                Schüler
                            </label>

                            <select
                                id="verlauf-kind"
                                value={selectedStudent}
                                disabled={controlsDisabled}
                                onChange={event =>
                                    setSelectedStudent(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Alle Schüler
                                </option>

                                {[...students]
                                    .sort((a, b) =>
                                        getStudentName(a)
                                            .localeCompare(
                                                getStudentName(b),
                                                'de'
                                            )
                                    )
                                    .map(student => (

                                        <option
                                            key={student.id}
                                            value={student.id}
                                        >

                                            {getStudentName(student)}
                                            {' · '}
                                            {student.klasse || '–'}

                                        </option>

                                    ))}

                            </select>

                        </div>

                    )}

                </div>

            )}

            {/* SUCHE */}

            <div className="anwesenheit-student-filters">

                <div className="anwesenheit-field anwesenheit-student-search">

                    <label htmlFor="verlauf-suche">
                        Suche
                    </label>

                    <input
                        id="verlauf-suche"
                        type="text"
                        value={search}
                        disabled={controlsDisabled}
                        placeholder="Name, Klasse, Angebot, ANA..."
                        onChange={event =>
                            setSearch(event.target.value)
                        }
                    />

                </div>

                <div className="anwesenheit-field">

                    <label htmlFor="verlauf-jahrgang">
                        Jahrgang
                    </label>

                    <select
                        id="verlauf-jahrgang"
                        value={jahrgangFilter}
                        disabled={controlsDisabled}
                        onChange={event =>
                            setJahrgangFilter(
                                event.target.value
                            )
                        }
                    >

                        <option value="">
                            Alle Jahrgänge
                        </option>

                        {jahrgaenge.map(jahrgang => (

                            <option
                                key={jahrgang}
                                value={jahrgang}
                            >

                                Jahrgang {jahrgang}

                            </option>

                        ))}

                    </select>

                </div>

            </div>

            {/* GELADENER ZEITRAUM */}

            {loadedZeitraum && (

                <div className="anwesenheit-history-period">

                    Zeitraum:

                    {' '}

                    <strong>

                        {formatDatum(loadedZeitraum.von)}
                        {' – '}
                        {formatDatum(loadedZeitraum.bis)}

                    </strong>

                    <p>
                        Klassen- und Gruppenzuordnungen
                        entsprechen dem aktuellen Stand.
                    </p>

                </div>

            )}

            {/* STATISTIK */}

            {!loading && (

                <div className="anwesenheit-history-statistik">

                    <div className="anwesenheit-statistik-card">

                        <span>Einträge</span>

                        <strong>
                            {statistik.gesamt}
                        </strong>

                    </div>

                    <div className="anwesenheit-statistik-card present">

                        <span>Als anwesend markiert</span>

                        <strong>
                            {statistik.anwesend}
                        </strong>

                    </div>

                    <div className="anwesenheit-statistik-card absent">

                        <span>Vollständig fehlend</span>

                        <strong>
                            {statistik.fehlend}
                        </strong>

                    </div>

                    <div className="anwesenheit-statistik-card partial">

                        <span>Teilweise abwesend</span>

                        <strong>
                            {statistik.teilweise}
                        </strong>

                    </div>

                </div>

            )}

            {/* TABELLE */}

            {loading ? (

                <div className="anwesenheit-empty">

                    Anwesenheitsverlauf wird geladen...

                </div>

            ) : sortedRows.length === 0 ? (

                <div className="anwesenheit-empty">

                    Keine Anwesenheitseinträge gefunden.

                </div>

            ) : (

                <div className="anwesenheit-table-scroll">

                    <table className="anwesenheit-table anwesenheit-daily-history-table">

                        <thead>

                        <tr>

                            {renderSortHeader(
                                'Datum',
                                'datum'
                            )}

                            {renderSortHeader(
                                'Name',
                                'name'
                            )}

                            {renderSortHeader(
                                'Jahrgang',
                                'jahrgang'
                            )}

                            {renderSortHeader(
                                'Klasse',
                                'klasse'
                            )}

                            {renderSortHeader(
                                'Angebot / ANA',
                                'gruppenText'
                            )}

                            <th className="status-column">
                                Anwesend
                            </th>

                            <th className="status-column">
                                Fehlt
                            </th>

                            <th>
                                Abwesend ab
                            </th>

                            <th>
                                Abwesend bis
                            </th>

                            <th>
                                Grund Abwesenheit
                            </th>

                            <th className="anwesenheit-ana-kontrolle-column">
                                ANA<br />
                                Anwesenheitskontrolle
                            </th>

                            <th>
                                Bemerkung
                            </th>

                            <th>
                                Aktionen
                            </th>

                        </tr>

                        </thead>

                        <tbody>

                        {sortedRows.map(entry => {

                            const editing =
                                editingId === entry.id;

                            const values =
                                editing
                                    ? editValues
                                    : normalizeAnwesenheit(entry);

                            const isFehlend =
                                values.status === 'FEHLT';

                            return (

                                <tr
                                    key={entry.id}
                                    className={
                                        getKlasseClassName(
                                            entry.klasse
                                        )
                                    }
                                >

                                    {/* DATUM */}

                                    <td>
                                        {formatDatum(entry.datum)}
                                    </td>

                                    {/* NAME */}

                                    <td className="anwesenheit-name-cell">
                                        {entry.name}
                                    </td>

                                    {/* JAHRGANG */}

                                    <td>
                                        {entry.jahrgang ?? '–'}
                                    </td>

                                    {/* KLASSE */}

                                    <td className="klasse-cell">
                                        {entry.klasse || '–'}
                                    </td>

                                    {/* ANGEBOTE / ANA */}

                                    <td className="anwesenheit-gruppen-cell">

                                        {entry.gruppen.length === 0

                                            ? '–'

                                            : entry.gruppen.map(gruppe => (

                                                <div
                                                    key={`${gruppe.typ}-${gruppe.id}`}
                                                    className="anwesenheit-history-gruppe"
                                                >

                                                    <span
                                                        className={
                                                            `anwesenheit-gruppe-badge ${
                                                                gruppe.typ === 'ANA'
                                                                    ? 'ana'
                                                                    : 'angebot'
                                                            }`
                                                        }
                                                    >

                                                        {gruppe.typ}

                                                    </span>

                                                    <span>
                                                        {gruppe.name}
                                                    </span>

                                                </div>

                                            ))}

                                    </td>

                                    {/* ANWESEND */}

                                    <td className="attendance-checkbox-cell">

                                        <input
                                            type="checkbox"
                                            className="attendance-checkbox anwesenheit-present-checkbox"
                                            checked={
                                                values.status === 'ANWESEND'
                                            }
                                            disabled={
                                                !editing || saving
                                            }
                                            aria-label={`${entry.name}: Anwesend`}
                                            onChange={() =>
                                                handleEditChange(
                                                    'status',
                                                    values.status === 'ANWESEND'
                                                        ? ''
                                                        : 'ANWESEND'
                                                )
                                            }
                                        />

                                    </td>

                                    {/* FEHLT */}

                                    <td className="attendance-checkbox-cell">

                                        <input
                                            type="checkbox"
                                            className="attendance-checkbox anwesenheit-absent-checkbox"
                                            checked={isFehlend}
                                            disabled={
                                                !editing || saving
                                            }
                                            aria-label={`${entry.name}: Fehlt`}
                                            onChange={() =>
                                                handleEditChange(
                                                    'status',
                                                    isFehlend
                                                        ? ''
                                                        : 'FEHLT'
                                                )
                                            }
                                        />

                                    </td>

                                    {/* ABWESEND AB */}

                                    <td className="anwesenheit-time-cell">

                                        {editing ? (

                                            <HistoryTimeSelect
                                                value={values.abwesendAb}
                                                disabled={saving || isFehlend}
                                                label={`${entry.name}: Abwesend ab`}
                                                onChange={value =>
                                                    handleEditChange(
                                                        'abwesendAb',
                                                        value
                                                    )
                                                }
                                            />

                                        ) : (

                                            formatTime(
                                                values.abwesendAb
                                            ) || '–'

                                        )}

                                    </td>

                                    {/* ABWESEND BIS */}

                                    <td className="anwesenheit-time-cell">

                                        {editing ? (

                                            <HistoryTimeSelect
                                                value={values.abwesendBis}
                                                disabled={saving || isFehlend}
                                                label={`${entry.name}: Abwesend bis`}
                                                onChange={value =>
                                                    handleEditChange(
                                                        'abwesendBis',
                                                        value
                                                    )
                                                }
                                            />

                                        ) : (

                                            formatTime(
                                                values.abwesendBis
                                            ) || '–'

                                        )}

                                    </td>

                                    {/* GRUND */}

                                    <td className="anwesenheit-grund-cell">

                                        {editing ? (

                                            <input
                                                type="text"
                                                className="anwesenheit-grund-input"
                                                value={values.grundAbwesenheit}
                                                maxLength={50}
                                                disabled={saving}
                                                aria-label={`${entry.name}: Grund Abwesenheit`}
                                                onChange={event =>
                                                    handleEditChange(
                                                        'grundAbwesenheit',
                                                        event.target.value
                                                    )
                                                }
                                            />

                                        ) : (

                                            values.grundAbwesenheit || '–'

                                        )}

                                    </td>

                                    {/* ANA KONTROLLE */}

                                    <td className="attendance-checkbox-cell">

                                        <input
                                            type="checkbox"
                                            className="attendance-checkbox"
                                            checked={
                                                values.anaAnwesenheitskontrolle
                                            }
                                            disabled={
                                                !editing || saving
                                            }
                                            aria-label={`${entry.name}: ANA Anwesenheitskontrolle`}
                                            onChange={event =>
                                                handleEditChange(
                                                    'anaAnwesenheitskontrolle',
                                                    event.target.checked
                                                )
                                            }
                                        />

                                    </td>

                                    {/* BEMERKUNG */}

                                    <td className="anwesenheit-bemerkung-cell">

                                        {editing ? (

                                            <input
                                                type="text"
                                                className="bemerkung-input"
                                                value={values.bemerkung}
                                                disabled={saving}
                                                aria-label={`${entry.name}: Bemerkung`}
                                                onChange={event =>
                                                    handleEditChange(
                                                        'bemerkung',
                                                        event.target.value
                                                    )
                                                }
                                            />

                                        ) : (

                                            values.bemerkung || '–'

                                        )}

                                    </td>

                                    {/* AKTIONEN */}

                                    <td>

                                        <div className="anwesenheit-action-cell">

                                            {editing ? (

                                                <>

                                                    <button
                                                        type="button"
                                                        className="btn-save"
                                                        disabled={saving}
                                                        onClick={() =>
                                                            handleSaveEdit(entry)
                                                        }
                                                    >

                                                        Speichern

                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-cancel"
                                                        disabled={saving}
                                                        onClick={handleCancelEdit}
                                                    >

                                                        Abbrechen

                                                    </button>

                                                </>

                                            ) : (

                                                <>

                                                    <button
                                                        type="button"
                                                        className="btn-edit"
                                                        disabled={
                                                            saving ||
                                                            editingId !== null
                                                        }
                                                        onClick={() =>
                                                            handleEdit(entry)
                                                        }
                                                    >

                                                        Bearbeiten

                                                    </button>

                                                    {isAdmin && (

                                                        <button
                                                            type="button"
                                                            className="btn-delete"
                                                            disabled={
                                                                saving ||
                                                                editingId !== null
                                                            }
                                                            onClick={() =>
                                                                handleDelete(entry)
                                                            }
                                                        >

                                                            Löschen

                                                        </button>

                                                    )}

                                                </>

                                            )}

                                        </div>

                                    </td>

                                </tr>

                            );
                        })}

                        </tbody>

                    </table>

                </div>

            )}

        </section>
    );
}

export default AnwesenheitVerlauf;