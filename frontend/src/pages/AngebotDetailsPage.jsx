import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    useNavigate,
    useParams
} from 'react-router-dom';

import {
    getAngebotById
} from '../services/angebotService';

import {
    getTeilnahmenByAngebot,
    addJahrgangToAngebot,
    addStudentsToAngebot,
    deleteAngebotTeilnahme
} from '../services/angebotTeilnahmeService';

import {
    getAnwesenheitenByAngebot,
    saveAngebotAnwesenheit
} from '../services/angebotAnwesenheitService';

import {
    getStudents
} from '../services/studentService';

import './KursDetailsPage.css';
import './AngebotDetailsPage.css';


const today = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};


const STATUS_OPTIONS = [
    {
        value: 'ANWESEND',
        label: 'Anwesend'
    },
    {
        value: 'ENTSCHULDIGT',
        label: 'Entschuldigt'
    },
    {
        value: 'FEHLT',
        label: 'Fehlt'
    }
];


function AngebotDetailsPage({ readOnly = false }) {

    const { id } = useParams();
    const navigate = useNavigate();

    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [angebot, setAngebot] = useState(null);
    const [teilnahmen, setTeilnahmen] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [anwesenheiten, setAnwesenheiten] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    /* =====================================================
       FILTER / SORTIERUNG
       ===================================================== */

    const [filter, setFilter] = useState('');
    const [sortKey, setSortKey] = useState('nachname');
    const [sortDirection, setSortDirection] = useState('asc');

    /* =====================================================
       JAHRGANG
       ===================================================== */

    const [selectedJahrgang, setSelectedJahrgang] = useState('');
    const [jahrgangLoading, setJahrgangLoading] = useState(false);

    /* =====================================================
       SCHÜLER HINZUFÜGEN
       ===================================================== */

    const [addStudentsOpen, setAddStudentsOpen] = useState(false);
    const [addStudentSearch, setAddStudentSearch] = useState('');
    const [addStudentJahrgang, setAddStudentJahrgang] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [addStudentsLoading, setAddStudentsLoading] = useState(false);

    /* =====================================================
       ANWESENHEIT
       ===================================================== */

    const [selectedDate, setSelectedDate] = useState(today);
    const [savingStudentId, setSavingStudentId] = useState(null);
    const [deletingTeilnahmeId, setDeletingTeilnahmeId] = useState(null);

    /* =====================================================
       DATEN LADEN
       ===================================================== */

    const loadData = useCallback(async (showLoading = true) => {

        try {

            if (showLoading) {
                setLoading(true);
            }

            setError('');

            const [
                angebotData,
                teilnahmenData,
                studentsData,
                anwesenheitenData
            ] = await Promise.all([
                getAngebotById(id),
                getTeilnahmenByAngebot(id),
                readOnly ? Promise.resolve([]) : getStudents(),
                getAnwesenheitenByAngebot(id)
            ]);

            setAngebot(angebotData);

            setTeilnahmen(
                Array.isArray(teilnahmenData)
                    ? teilnahmenData
                    : []
            );

            setAllStudents(
                Array.isArray(studentsData)
                    ? studentsData
                    : []
            );

            setAnwesenheiten(
                Array.isArray(anwesenheitenData)
                    ? anwesenheitenData
                    : []
            );

        } catch (err) {

            console.error(
                'Angebot konnte nicht geladen werden:',
                err
            );

            setError(
                'Die Angebotsübersicht konnte nicht geladen werden.'
            );

        } finally {

            if (showLoading) {
                setLoading(false);
            }
        }

    }, [id, readOnly]);


    useEffect(() => {
        loadData();
    }, [loadData]);


    /* =====================================================
       TEILNEHMER MIT STATISTIK
       ===================================================== */

    const students = useMemo(() => {

        return teilnahmen
            .filter(teilnahme => teilnahme.student)
            .map(teilnahme => {

                const student = teilnahme.student;

                const studentAnwesenheiten = anwesenheiten.filter(
                    eintrag =>
                        Number(eintrag.student?.id) === Number(student.id)
                );

                return {
                    ...student,

                    teilnahmeId: teilnahme.id,

                    anzahlAnwesend: studentAnwesenheiten.filter(
                        eintrag => eintrag.status === 'ANWESEND'
                    ).length,

                    anzahlEntschuldigt: studentAnwesenheiten.filter(
                        eintrag => eintrag.status === 'ENTSCHULDIGT'
                    ).length,

                    anzahlFehlend: studentAnwesenheiten.filter(
                        eintrag => eintrag.status === 'FEHLT'
                    ).length
                };
            });

    }, [teilnahmen, anwesenheiten]);


    /* =====================================================
       JAHRGÄNGE
       ===================================================== */

    const jahrgaenge = useMemo(() => {

        return [
            ...new Set(
                allStudents
                    .map(student => student.jahrgang)
                    .filter(value =>
                        value !== null &&
                        value !== undefined &&
                        value !== ''
                    )
            )
        ].sort((a, b) => Number(a) - Number(b));

    }, [allStudents]);


    /* =====================================================
       JAHRGANG ZUORDNEN
       ===================================================== */

    const handleAddJahrgang = async () => {
        if (readOnly) return;
        if (!selectedJahrgang) {
            return;
        }

        const confirmed = window.confirm(
            `Möchten Sie alle Schüler des Jahrgangs ${selectedJahrgang} dem Angebot „${angebot.name}“ zuordnen?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setJahrgangLoading(true);
            setError('');
            setMessage('');

            const result = await addJahrgangToAngebot(
                id,
                selectedJahrgang
            );

            setMessage(
                `${result?.hinzugefuegt ?? 0} Schüler wurden hinzugefügt.`
            );

            setSelectedJahrgang('');

            await loadData(false);

        } catch (err) {

            console.error(err);

            setError(
                'Der Jahrgang konnte nicht hinzugefügt werden.'
            );

        } finally {

            setJahrgangLoading(false);
        }
    };


    /* =====================================================
       VERFÜGBARE SCHÜLER
       ===================================================== */

    const bookedStudentIds = useMemo(() => {

        return new Set(
            students.map(student => Number(student.id))
        );

    }, [students]);


    const availableStudents = useMemo(() => {

        const search = addStudentSearch.trim().toLowerCase();

        return allStudents
            .filter(student =>
                !bookedStudentIds.has(Number(student.id))
            )
            .filter(student => {

                if (
                    addStudentJahrgang &&
                    String(student.jahrgang) !== String(addStudentJahrgang)
                ) {
                    return false;
                }

                if (!search) {
                    return true;
                }

                return [
                    student.nachname,
                    student.vorname,
                    student.klasse,
                    student.jahrgang
                ].some(value =>
                    String(value ?? '')
                        .toLowerCase()
                        .includes(search)
                );
            })
            .sort((a, b) => {

                const lastNameCompare = String(
                    a.nachname ?? ''
                ).localeCompare(
                    String(b.nachname ?? ''),
                    'de'
                );

                if (lastNameCompare !== 0) {
                    return lastNameCompare;
                }

                return String(
                    a.vorname ?? ''
                ).localeCompare(
                    String(b.vorname ?? ''),
                    'de'
                );
            });

    }, [
        allStudents,
        bookedStudentIds,
        addStudentSearch,
        addStudentJahrgang
    ]);


    /* =====================================================
       SCHÜLERAUSWAHL
       ===================================================== */

    const handleStudentSelection = studentId => {

        setSelectedStudentIds(previous => {

            if (previous.includes(studentId)) {
                return previous.filter(id => id !== studentId);
            }

            return [...previous, studentId];
        });
    };


    const handleSelectAllVisible = () => {

        const visibleIds = availableStudents.map(student => student.id);

        const allSelected =
            visibleIds.length > 0 &&
            visibleIds.every(studentId =>
                selectedStudentIds.includes(studentId)
            );

        if (allSelected) {

            setSelectedStudentIds(previous =>
                previous.filter(studentId =>
                    !visibleIds.includes(studentId)
                )
            );

        } else {

            setSelectedStudentIds(previous => [
                ...new Set([...previous, ...visibleIds])
            ]);
        }
    };


    const handleAddSelectedStudents = async () => {
        if (readOnly) return;
        if (selectedStudentIds.length === 0) {
            return;
        }

        try {

            setAddStudentsLoading(true);
            setError('');
            setMessage('');

            const result = await addStudentsToAngebot(
                id,
                selectedStudentIds
            );

            setMessage(
                `${result?.hinzugefuegt ?? 0} Schüler wurden hinzugefügt.`
            );

            setSelectedStudentIds([]);

            await loadData(false);

        } catch (err) {

            console.error(err);

            setError(
                'Die ausgewählten Schüler konnten nicht hinzugefügt werden.'
            );

        } finally {

            setAddStudentsLoading(false);
        }
    };


    /* =====================================================
       TEILNEHMER ENTFERNEN
       ===================================================== */

    const handleRemoveStudent = async student => {
        if (readOnly) return;
        const confirmed = window.confirm(
            `Möchten Sie ${student.vorname} ${student.nachname} wirklich aus diesem Angebot entfernen?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setDeletingTeilnahmeId(student.teilnahmeId);
            setError('');
            setMessage('');

            await deleteAngebotTeilnahme(student.teilnahmeId);

            setMessage(
                `${student.vorname} ${student.nachname} wurde entfernt.`
            );

            await loadData(false);

        } catch (err) {

            console.error(err);

            setError(
                'Der Schüler konnte nicht entfernt werden.'
            );

        } finally {

            setDeletingTeilnahmeId(null);
        }
    };


    /* =====================================================
       ANWESENHEIT SPEICHERN
       ===================================================== */

    const handleSaveAnwesenheit = async (studentId, status) => {
        if (readOnly) return;
        try {

            setSavingStudentId(studentId);
            setError('');
            setMessage('');

            await saveAngebotAnwesenheit(
                id,
                studentId,
                selectedDate,
                status
            );

            setMessage('Anwesenheit wurde gespeichert.');

            await loadData(false);

        } catch (err) {

            console.error(err);

            setError(
                'Die Anwesenheit konnte nicht gespeichert werden.'
            );

        } finally {

            setSavingStudentId(null);
        }
    };


    /* =====================================================
       ANWESENHEIT AM GEWÄHLTEN TAG
       ===================================================== */

    const attendanceByStudent = useMemo(() => {

        const result = new Map();

        anwesenheiten
            .filter(eintrag => eintrag.datum === selectedDate)
            .forEach(eintrag => {

                if (eintrag.student?.id != null) {
                    result.set(
                        Number(eintrag.student.id),
                        eintrag.status
                    );
                }
            });

        return result;

    }, [anwesenheiten, selectedDate]);


    /* =====================================================
       FILTER
       ===================================================== */

    const filteredStudents = useMemo(() => {

        const search = filter.trim().toLowerCase();

        if (!search) {
            return students;
        }

        return students.filter(student =>
            [
                student.nachname,
                student.vorname,
                student.jahrgang,
                student.klasse,
                student.fotoFreigabe,
                student.email1,
                student.telefon1,
                student.mobil1,
                student.email2,
                student.telefon2,
                student.mobil2
            ].some(value =>
                String(value ?? '')
                    .toLowerCase()
                    .includes(search)
            )
        );

    }, [students, filter]);


    /* =====================================================
       SORTIERUNG
       ===================================================== */

    const sortedStudents = useMemo(() => {

        return [...filteredStudents].sort((a, b) => {

            const valueA = a[sortKey];
            const valueB = b[sortKey];

            const numericKeys = [
                'jahrgang',
                'anzahlAnwesend',
                'anzahlEntschuldigt',
                'anzahlFehlend'
            ];

            if (numericKeys.includes(sortKey)) {

                const numberA = Number(valueA) || 0;
                const numberB = Number(valueB) || 0;

                return sortDirection === 'asc'
                    ? numberA - numberB
                    : numberB - numberA;
            }

            const comparison = String(
                valueA ?? ''
            ).localeCompare(
                String(valueB ?? ''),
                'de',
                { sensitivity: 'base' }
            );

            return sortDirection === 'asc'
                ? comparison
                : -comparison;
        });

    }, [
        filteredStudents,
        sortKey,
        sortDirection
    ]);


    const handleSort = key => {

        if (sortKey === key) {

            setSortDirection(previous =>
                previous === 'asc' ? 'desc' : 'asc'
            );

        } else {

            setSortKey(key);
            setSortDirection('asc');
        }
    };


    const sortIndicator = key => {

        if (sortKey !== key) {
            return '';
        }

        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    };


    /* =====================================================
       GESAMTSTATISTIK
       ===================================================== */

    const statistik = useMemo(() => {

        return {
            anwesend: anwesenheiten.filter(
                eintrag => eintrag.status === 'ANWESEND'
            ).length,

            entschuldigt: anwesenheiten.filter(
                eintrag => eintrag.status === 'ENTSCHULDIGT'
            ).length,

            fehlend: anwesenheiten.filter(
                eintrag => eintrag.status === 'FEHLT'
            ).length
        };

    }, [anwesenheiten]);


    /* =====================================================
       LOADING
       ===================================================== */

    if (loading) {

        return (
            <div className="kurs-details-message">
                Angebot wird geladen...
            </div>
        );
    }

    if (!angebot) {

        return (
            <div className="kurs-details-message kurs-details-error">
                {error || 'Angebot nicht gefunden.'}
            </div>
        );
    }


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="kurs-details-page angebot-details-page">

            <button
                type="button"
                className="angebot-back-button"
                onClick={() => navigate('/angebote')}
            >
                <span aria-hidden="true">←</span>
                Zurück zu den Angeboten
            </button>

            <header className="page-header">

                <div className="page-header-content">

                    <h1>{angebot.name}</h1>

                    <p>
                        {angebot.wochentag || '–'}

                        {angebot.beginn
                            ? ` · ${angebot.beginn}`
                            : ''}

                        {angebot.angebotsleitung
                            ? ` · ${angebot.angebotsleitung}`
                            : ''}
                    </p>

                </div>

                <span className="kurs-details-count">
                    {students.length} Schüler
                </span>

            </header>

            {error && (
                <div className="kurs-details-error-box">
                    {error}
                </div>
            )}

            {message && (
                <div className="kurs-jahrgang-message angebot-message">
                    {message}
                </div>
            )}

            {/* =================================================
                ANGEBOTSINFORMATIONEN
               ================================================= */}

            <section className="kurs-details-info angebot-info">

                <div>
                    <span>Angebotsart</span>
                    <strong>{angebot.angebotsart || '–'}</strong>
                </div>

                <div>
                    <span>Wochentag</span>
                    <strong>{angebot.wochentag || '–'}</strong>
                </div>

                <div>
                    <span>Beginn</span>
                    <strong>{angebot.beginn || '–'}</strong>
                </div>

                <div>
                    <span>Ende</span>
                    <strong>{angebot.ende || '–'}</strong>
                </div>

                <div>
                    <span>Angebotsleitung</span>
                    <strong>{angebot.angebotsleitung || '–'}</strong>
                </div>

            </section>

            {/* =================================================
                STATISTIK
               ================================================= */}

            <section className="angebot-statistik">

                <div>
                    <span>Anwesend</span>
                    <strong>{statistik.anwesend}</strong>
                </div>

                <div>
                    <span>Entschuldigt</span>
                    <strong>{statistik.entschuldigt}</strong>
                </div>

                <div>
                    <span>Fehlend</span>
                    <strong>{statistik.fehlend}</strong>
                </div>

            </section>

            {/* =================================================
                JAHRGANG HINZUFÜGEN
               ================================================= */}

            {!readOnly && (
            <section className="kurs-jahrgang-section">

                <div className="kurs-jahrgang-header">

                    <div>
                        <h2>Jahrgang zuordnen</h2>

                        <p>
                            Alle Schüler eines Jahrgangs diesem Angebot zuordnen.
                        </p>
                    </div>

                </div>

                <div className="kurs-jahrgang-content">

                    <div className="kurs-jahrgang-field">

                        <label htmlFor="angebot-jahrgang">
                            Jahrgang
                        </label>

                        <select
                            id="angebot-jahrgang"
                            value={selectedJahrgang}
                            onChange={event =>
                                setSelectedJahrgang(event.target.value)
                            }
                        >

                            <option value="">
                                Jahrgang auswählen...
                            </option>

                            {jahrgaenge.map(jahrgang => (
                                <option
                                    key={jahrgang}
                                    value={jahrgang}
                                >
                                    {jahrgang}
                                </option>
                            ))}

                        </select>

                    </div>

                    <button
                        type="button"
                        className="kurs-jahrgang-button"
                        disabled={
                            !selectedJahrgang ||
                            jahrgangLoading
                        }
                        onClick={handleAddJahrgang}
                    >
                        {jahrgangLoading
                            ? 'Wird hinzugefügt...'
                            : 'Jahrgang hinzufügen'}
                    </button>

                </div>

            </section>
            )}

            {/* =================================================
                SCHÜLER HINZUFÜGEN
               ================================================= */}

            {!readOnly && (
            <section className="kurs-add-students-section">

                <button
                    type="button"
                    className="kurs-add-students-toggle"
                    onClick={() =>
                        setAddStudentsOpen(previous => !previous)
                    }
                >

                    <span>Schüler/-innen hinzufügen</span>

                    <span>
                        {addStudentsOpen ? '−' : '+'}
                    </span>

                </button>

                {addStudentsOpen && (

                    <div className="kurs-add-students-content">

                        <div className="kurs-add-students-filter">

                            <div className="kurs-add-students-field">

                                <label htmlFor="angebot-student-search">
                                    Suche
                                </label>

                                <input
                                    id="angebot-student-search"
                                    type="text"
                                    placeholder="Nachname oder Vorname..."
                                    value={addStudentSearch}
                                    onChange={event =>
                                        setAddStudentSearch(event.target.value)
                                    }
                                />

                            </div>

                            <div className="kurs-add-students-field">

                                <label htmlFor="angebot-student-jahrgang">
                                    Jahrgang
                                </label>

                                <select
                                    id="angebot-student-jahrgang"
                                    value={addStudentJahrgang}
                                    onChange={event =>
                                        setAddStudentJahrgang(event.target.value)
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
                                            {jahrgang}
                                        </option>
                                    ))}

                                </select>

                            </div>

                        </div>

                        <div className="kurs-add-students-list-header">

                            <label>

                                <input
                                    type="checkbox"
                                    checked={
                                        availableStudents.length > 0 &&
                                        availableStudents.every(student =>
                                            selectedStudentIds.includes(student.id)
                                        )
                                    }
                                    onChange={handleSelectAllVisible}
                                />

                                Alle sichtbaren auswählen

                            </label>

                            <span>
                                {availableStudents.length} verfügbar
                            </span>

                        </div>

                        <div className="kurs-add-students-list">

                            {availableStudents.length === 0 ? (

                                <div className="kurs-add-students-empty">
                                    Keine passenden Schüler verfügbar.
                                </div>

                            ) : (

                                availableStudents.map(student => (

                                    <label
                                        key={student.id}
                                        className="kurs-add-student-row"
                                    >

                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedStudentIds.includes(student.id)
                                            }
                                            onChange={() =>
                                                handleStudentSelection(student.id)
                                            }
                                        />

                                        <div className="kurs-add-student-name">

                                            <strong>
                                                {student.nachname || '–'},{' '}
                                                {student.vorname || '–'}
                                            </strong>

                                            <span>
                                                Jahrgang {student.jahrgang ?? '–'}
                                                {' · '}
                                                Klasse {student.klasse || '–'}
                                            </span>

                                        </div>

                                    </label>

                                ))

                            )}

                        </div>

                        <div className="kurs-add-students-actions">

                            <span>
                                {selectedStudentIds.length} ausgewählt
                            </span>

                            <button
                                type="button"
                                className="kurs-add-students-button"
                                disabled={
                                    selectedStudentIds.length === 0 ||
                                    addStudentsLoading
                                }
                                onClick={handleAddSelectedStudents}
                            >
                                {addStudentsLoading
                                    ? 'Wird hinzugefügt...'
                                    : 'Ausgewählte Schüler hinzufügen'}
                            </button>

                        </div>

                    </div>

                )}

            </section>
            )}

            {/* =================================================
                ANWESENHEITSDATUM
               ================================================= */}

            <section className="angebot-datum-section">

                <div>

                    <h2>{readOnly ? 'Anwesenheit ansehen' : 'Anwesenheit erfassen'}</h2>

                    <p>
                        {readOnly
                            ? 'Datum auswählen und erfasste Anwesenheit in der Schülerliste ansehen.'
                            : 'Datum auswählen und Anwesenheit direkt in der Schülerliste speichern.'}
                    </p>

                </div>

                <div className="angebot-datum-field">

                    <label htmlFor="angebot-datum">
                        Datum
                    </label>

                    <input
                        id="angebot-datum"
                        type="date"
                        value={selectedDate}
                        onChange={event =>
                            setSelectedDate(event.target.value)
                        }
                    />

                </div>

            </section>

            {/* =================================================
                TEILNEHMERLISTE
               ================================================= */}

            <section className="kurs-details-content">

                <div className="kurs-details-toolbar">

                    <input
                        type="text"
                        placeholder="Schüler suchen..."
                        value={filter}
                        onChange={event =>
                            setFilter(event.target.value)
                        }
                    />

                    <span>
                        {sortedStudents.length} Schüler
                    </span>

                </div>

                <div className="kurs-details-table-scroll">

                    <table className="kurs-details-table">

                        <thead>

                        <tr>

                            {[
                                ['nachname', 'Nachname'],
                                ['vorname', 'Vorname'],
                                ['jahrgang', 'Jahrgang'],
                                ['klasse', 'Klasse'],
                                ['fotoFreigabe', 'Fotofreigabe'],
                                ['anzahlAnwesend', 'Anwesend'],
                                ['anzahlEntschuldigt', 'Entschuldigt'],
                                ['anzahlFehlend', 'Fehlend']
                            ].map(([key, label]) => (

                                <th
                                    key={key}
                                    onClick={() => handleSort(key)}
                                >
                                    {label}
                                    {sortIndicator(key)}
                                </th>

                            ))}

                            <th>Status am {selectedDate}</th>

                            <th>Email 1</th>
                            <th>Telefon 1</th>
                            <th>Mobil 1</th>
                            <th>Email 2</th>
                            <th>Telefon 2</th>
                            <th>Mobil 2</th>

                            {!readOnly && <th>Aktionen</th>}

                        </tr>

                        </thead>

                        <tbody>

                        {sortedStudents.length === 0 ? (

                            <tr>
                                <td
                                    colSpan={readOnly ? 15 : 16}
                                    className="kurs-details-empty"
                                >
                                    Keine Schüler gefunden.
                                </td>
                            </tr>

                        ) : (

                            sortedStudents.map(student => (

                                <tr key={student.id}>

                                    <td
                                        onClick={() => { if (!readOnly) navigate(`/students/${student.id}`); }}
                                    >
                                        {student.nachname || '–'}
                                    </td>

                                    <td
                                        onClick={() => { if (!readOnly) navigate(`/students/${student.id}`); }}
                                    >
                                        {student.vorname || '–'}
                                    </td>

                                    <td>{student.jahrgang ?? '–'}</td>
                                    <td>{student.klasse || '–'}</td>
                                    <td>{student.fotoFreigabe || '–'}</td>

                                    <td>{student.anzahlAnwesend}</td>
                                    <td>{student.anzahlEntschuldigt}</td>
                                    <td>{student.anzahlFehlend}</td>

                                    <td>

                                        <select
                                            className="angebot-status-select"
                                            value={
                                                attendanceByStudent.get(
                                                    Number(student.id)
                                                ) || ''
                                            }
                                            disabled={
                                                readOnly || savingStudentId === student.id
                                            }
                                            onChange={event =>
                                                handleSaveAnwesenheit(
                                                    student.id,
                                                    event.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Nicht erfasst
                                            </option>

                                            {STATUS_OPTIONS.map(option => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}

                                        </select>

                                    </td>

                                    <td>{student.email1 || '–'}</td>
                                    <td>{student.telefon1 || '–'}</td>
                                    <td>{student.mobil1 || '–'}</td>
                                    <td>{student.email2 || '–'}</td>
                                    <td>{student.telefon2 || '–'}</td>
                                    <td>{student.mobil2 || '–'}</td>

                                    {!readOnly && (
                                    <td>
                                        <button
                                            type="button"
                                            className="angebot-remove-button"
                                            disabled={
                                                deletingTeilnahmeId ===
                                                student.teilnahmeId
                                            }
                                            onClick={() =>
                                                handleRemoveStudent(student)
                                            }
                                        >
                                            Entfernen
                                        </button>
                                    </td>
                                    )}

                                </tr>

                            ))

                        )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

export default AngebotDetailsPage;