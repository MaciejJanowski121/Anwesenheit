import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    useNavigate,
    useParams
} from 'react-router-dom';

import {
    getKursById
} from '../services/kursService';

import {
    getBuchungenByKurs,
    addJahrgangToKurs,
    addStudentsToKurs
} from '../services/buchungService';

import {
    getStudents
} from '../services/studentService';

import {
    getAnwesenheitStatistikByStudent
} from '../services/anwesenheitService';

import './KursDetailsPage.css';

function KursDetailsPage() {

    const { id } =
        useParams();

    const navigate =
        useNavigate();

    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [kurs, setKurs] =
        useState(null);

    const [students, setStudents] =
        useState([]);

    const [allStudents, setAllStudents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    /* =====================================================
       KURSLISTE
       ===================================================== */

    const [filter, setFilter] =
        useState('');

    const [sortKey, setSortKey] =
        useState('nachname');

    const [
        sortDirection,
        setSortDirection
    ] = useState('asc');

    /* =====================================================
       JAHRGANG HINZUFÜGEN
       ===================================================== */

    const [
        selectedJahrgang,
        setSelectedJahrgang
    ] = useState('');

    const [
        jahrgangLoading,
        setJahrgangLoading
    ] = useState(false);

    const [
        jahrgangMessage,
        setJahrgangMessage
    ] = useState('');

    /* =====================================================
       SCHÜLER HINZUFÜGEN
       ===================================================== */

    const [
        addStudentsOpen,
        setAddStudentsOpen
    ] = useState(false);

    const [
        addStudentSearch,
        setAddStudentSearch
    ] = useState('');

    const [
        addStudentJahrgang,
        setAddStudentJahrgang
    ] = useState('');

    const [
        selectedStudentIds,
        setSelectedStudentIds
    ] = useState([]);

    const [
        addStudentsLoading,
        setAddStudentsLoading
    ] = useState(false);

    const [
        addStudentsMessage,
        setAddStudentsMessage
    ] = useState('');

    /* =====================================================
       INITIALISIERUNG
       ===================================================== */

    useEffect(() => {
        loadData();
    }, [id]);

    /* =====================================================
       DATEN LADEN
       ===================================================== */

    const loadData = async () => {

        try {

            setLoading(true);
            setError('');

            const [
                kursData,
                buchungenData,
                studentsData
            ] =
                await Promise.all([
                    getKursById(id),
                    getBuchungenByKurs(id),
                    getStudents()
                ]);

            setKurs(
                kursData
            );

            setAllStudents(
                Array.isArray(
                    studentsData
                )
                    ? studentsData
                    : []
            );

            const buchungen =
                Array.isArray(
                    buchungenData
                )
                    ? buchungenData
                    : [];

            const studentsWithStats =
                await Promise.all(

                    buchungen.map(
                        async (
                            buchung
                        ) => {

                            const student =
                                buchung.student;

                            if (!student) {
                                return null;
                            }

                            try {

                                const statistik =
                                    await getAnwesenheitStatistikByStudent(
                                        student.id
                                    );

                                return {

                                    ...student,

                                    buchungId:
                                    buchung.id,

                                    anzahlAnwesend:
                                        statistik
                                            .anzahlAnwesend ??
                                        0,

                                    anzahlEntschuldigt:
                                        statistik
                                            .anzahlEntschuldigt ??
                                        0,

                                    anzahlFehlend:
                                        statistik
                                            .anzahlFehlend ??
                                        0
                                };

                            } catch (error) {

                                console.error(
                                    `Statistik für Schüler ${student.id} konnte nicht geladen werden.`,
                                    error
                                );

                                return {

                                    ...student,

                                    buchungId:
                                    buchung.id,

                                    anzahlAnwesend: 0,
                                    anzahlEntschuldigt: 0,
                                    anzahlFehlend: 0
                                };
                            }
                        }
                    )
                );

            setStudents(
                studentsWithStats
                    .filter(Boolean)
            );

        } catch (error) {

            console.error(
                'Kursübersicht konnte nicht geladen werden:',
                error
            );

            setError(
                'Die Kursübersicht konnte nicht geladen werden.'
            );

        } finally {

            setLoading(false);
        }
    };

    /* =====================================================
       JAHRGÄNGE
       ===================================================== */

    const jahrgaenge =
        useMemo(() => {

            return [
                ...new Set(
                    allStudents
                        .map(
                            (student) =>
                                student.jahrgang
                        )
                        .filter(
                            (jahrgang) =>
                                jahrgang !== null &&
                                jahrgang !== undefined &&
                                jahrgang !== ''
                        )
                )
            ].sort(
                (a, b) =>
                    Number(a) -
                    Number(b)
            );

        }, [
            allStudents
        ]);

    /* =====================================================
       JAHRGANG ZUORDNEN
       ===================================================== */

    const handleAddJahrgang =
        async () => {

            if (
                !selectedJahrgang
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Möchten Sie wirklich alle Schüler des Jahrgangs ${selectedJahrgang} dem Kurs „${kurs.name}“ zuordnen?`
                );

            if (!confirmed) {
                return;
            }

            try {

                setJahrgangLoading(
                    true
                );

                setJahrgangMessage(
                    ''
                );

                setError('');

                const result =
                    await addJahrgangToKurs(
                        id,
                        selectedJahrgang
                    );

                const hinzugefuegt =
                    result
                        ?.hinzugefuegt ??
                    0;

                if (
                    hinzugefuegt === 0
                ) {

                    setJahrgangMessage(
                        `Alle Schüler des Jahrgangs ${selectedJahrgang} sind bereits diesem Kurs zugeordnet.`
                    );

                } else {

                    setJahrgangMessage(
                        `${hinzugefuegt} Schüler des Jahrgangs ${selectedJahrgang} wurden dem Kurs hinzugefügt.`
                    );
                }

                setSelectedJahrgang(
                    ''
                );

                await loadData();

            } catch (error) {

                console.error(
                    'Jahrgang konnte nicht zugeordnet werden:',
                    error
                );

                setJahrgangMessage(
                    ''
                );

                setError(
                    'Der Jahrgang konnte nicht zugeordnet werden.'
                );

            } finally {

                setJahrgangLoading(
                    false
                );
            }
        };

    /* =====================================================
       BEREITS EINGEBUCHTE SCHÜLER
       ===================================================== */

    const bookedStudentIds =
        useMemo(() => {

            return new Set(
                students.map(
                    (student) =>
                        student.id
                )
            );

        }, [
            students
        ]);

    /* =====================================================
       VERFÜGBARE SCHÜLER
       ===================================================== */

    const availableStudents =
        useMemo(() => {

            const search =
                addStudentSearch
                    .trim()
                    .toLowerCase();

            return allStudents
                .filter(
                    (student) =>
                        !bookedStudentIds
                            .has(
                                student.id
                            )
                )
                .filter(
                    (student) => {

                        if (
                            addStudentJahrgang &&
                            String(
                                student.jahrgang
                            ) !==
                            String(
                                addStudentJahrgang
                            )
                        ) {
                            return false;
                        }

                        if (!search) {
                            return true;
                        }

                        const fullName =
                            `${student.nachname || ''} ${student.vorname || ''}`
                                .toLowerCase();

                        return (
                            fullName
                                .includes(
                                    search
                                ) ||
                            String(
                                student.klasse ??
                                ''
                            )
                                .toLowerCase()
                                .includes(
                                    search
                                )
                        );
                    }
                )
                .sort(
                    (a, b) => {

                        const nachnameA =
                            String(
                                a.nachname ??
                                ''
                            );

                        const nachnameB =
                            String(
                                b.nachname ??
                                ''
                            );

                        const vergleich =
                            nachnameA
                                .localeCompare(
                                    nachnameB,
                                    'de'
                                );

                        if (
                            vergleich !== 0
                        ) {
                            return vergleich;
                        }

                        return String(
                            a.vorname ??
                            ''
                        ).localeCompare(
                            String(
                                b.vorname ??
                                ''
                            ),
                            'de'
                        );
                    }
                );

        }, [
            allStudents,
            bookedStudentIds,
            addStudentSearch,
            addStudentJahrgang
        ]);

    /* =====================================================
       CHECKBOX
       ===================================================== */

    const handleStudentSelection =
        (
            studentId
        ) => {

            setSelectedStudentIds(
                (
                    previous
                ) => {

                    if (
                        previous.includes(
                            studentId
                        )
                    ) {

                        return previous
                            .filter(
                                (id) =>
                                    id !==
                                    studentId
                            );
                    }

                    return [
                        ...previous,
                        studentId
                    ];
                }
            );
        };

    /* =====================================================
       ALLE SICHTBAREN AUSWÄHLEN
       ===================================================== */

    const handleSelectAllVisible =
        () => {

            const visibleIds =
                availableStudents.map(
                    (student) =>
                        student.id
                );

            const allSelected =
                visibleIds.length > 0 &&
                visibleIds.every(
                    (studentId) =>
                        selectedStudentIds
                            .includes(
                                studentId
                            )
                );

            if (allSelected) {

                setSelectedStudentIds(
                    (
                        previous
                    ) =>
                        previous.filter(
                            (studentId) =>
                                !visibleIds
                                    .includes(
                                        studentId
                                    )
                        )
                );

            } else {

                setSelectedStudentIds(
                    (
                        previous
                    ) => [
                        ...new Set([
                            ...previous,
                            ...visibleIds
                        ])
                    ]
                );
            }
        };

    /* =====================================================
       AUSGEWÄHLTE SCHÜLER HINZUFÜGEN
       ===================================================== */

    const handleAddSelectedStudents =
        async () => {

            if (
                selectedStudentIds
                    .length === 0
            ) {
                return;
            }

            try {

                setAddStudentsLoading(
                    true
                );

                setAddStudentsMessage(
                    ''
                );

                setError('');

                const result =
                    await addStudentsToKurs(
                        id,
                        selectedStudentIds
                    );

                const hinzugefuegt =
                    result
                        ?.hinzugefuegt ??
                    0;

                setAddStudentsMessage(
                    `${hinzugefuegt} Schüler wurden dem Kurs hinzugefügt.`
                );

                setSelectedStudentIds(
                    []
                );

                await loadData();

            } catch (error) {

                console.error(
                    'Schüler konnten nicht hinzugefügt werden:',
                    error
                );

                setError(
                    'Die ausgewählten Schüler konnten nicht hinzugefügt werden.'
                );

            } finally {

                setAddStudentsLoading(
                    false
                );
            }
        };

    /* =====================================================
       FILTER KURSTEILNEHMER
       ===================================================== */

    const filteredStudents =
        useMemo(() => {

            const term =
                filter
                    .trim()
                    .toLowerCase();

            if (!term) {
                return students;
            }

            return students.filter(
                (student) =>
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
                    ].some(
                        (value) =>
                            String(
                                value ??
                                ''
                            )
                                .toLowerCase()
                                .includes(
                                    term
                                )
                    )
            );

        }, [
            students,
            filter
        ]);

    /* =====================================================
       SORTIERUNG
       ===================================================== */

    const sortedStudents =
        useMemo(() => {

            return [
                ...filteredStudents
            ].sort(
                (a, b) => {

                    const valA =
                        a[sortKey];

                    const valB =
                        b[sortKey];

                    if (
                        [
                            'jahrgang',
                            'anzahlAnwesend',
                            'anzahlEntschuldigt',
                            'anzahlFehlend'
                        ].includes(
                            sortKey
                        )
                    ) {

                        const numberA =
                            Number(
                                valA
                            ) || 0;

                        const numberB =
                            Number(
                                valB
                            ) || 0;

                        return sortDirection ===
                        'asc'
                            ? numberA -
                            numberB
                            : numberB -
                            numberA;
                    }

                    const stringA =
                        String(
                            valA ??
                            ''
                        )
                            .toLowerCase();

                    const stringB =
                        String(
                            valB ??
                            ''
                        )
                            .toLowerCase();

                    return sortDirection ===
                    'asc'
                        ? stringA
                            .localeCompare(
                                stringB,
                                'de'
                            )
                        : stringB
                            .localeCompare(
                                stringA,
                                'de'
                            );
                }
            );

        }, [
            filteredStudents,
            sortKey,
            sortDirection
        ]);

    const handleSort =
        (key) => {

            if (
                sortKey === key
            ) {

                setSortDirection(
                    (
                        previous
                    ) =>
                        previous ===
                        'asc'
                            ? 'desc'
                            : 'asc'
                );

                return;
            }

            setSortKey(
                key
            );

            setSortDirection(
                'asc'
            );
        };

    const sortIndicator =
        (key) => {

            if (
                sortKey !== key
            ) {
                return '';
            }

            return sortDirection ===
            'asc'
                ? ' ▲'
                : ' ▼';
        };

    /* =====================================================
       15:30
       ===================================================== */

    const zeigt1530 =
        [
            'OGS',
            'OGSH',
            'OGSF'
        ].includes(
            String(
                kurs?.buchungsart ||
                ''
            ).toUpperCase()
        );

    /* =====================================================
       LOADING
       ===================================================== */

    if (loading) {

        return (
            <div className="kurs-details-message">
                Kurs wird geladen...
            </div>
        );
    }

    if (
        error &&
        !kurs
    ) {

        return (
            <div className="kurs-details-message kurs-details-error">
                {error}
            </div>
        );
    }

    if (!kurs) {

        return (
            <div className="kurs-details-message kurs-details-error">
                Kurs nicht gefunden.
            </div>
        );
    }

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="kurs-details-page">

            <button
                type="button"
                className="back-button"
                onClick={() =>
                    navigate(
                        '/kurse'
                    )
                }
            >
                Zurück zu den Kursen
            </button>

            <header className="page-header">

                <div className="page-header-content">

                    <h1>
                        {kurs.name}
                    </h1>

                    <p>

                        {kurs.wochentag ||
                            '–'}

                        {kurs.uhrzeit
                            ? ` · ${kurs.uhrzeit}`
                            : ''}

                        {kurs.kursleitung
                            ? ` · ${kurs.kursleitung}`
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

            {/* =================================================
                KURSINFO
               ================================================= */}

            <section className="kurs-details-info">

                <div>
                    <span>
                        Buchungsart
                    </span>

                    <strong>
                        {kurs.buchungsart ||
                            '–'}
                    </strong>
                </div>

                <div>
                    <span>
                        Wochentag
                    </span>

                    <strong>
                        {kurs.wochentag ||
                            '–'}
                    </strong>
                </div>

                <div>
                    <span>
                        Uhrzeit
                    </span>

                    <strong>
                        {kurs.uhrzeit ||
                            '–'}
                    </strong>
                </div>

                <div>
                    <span>
                        Kursleitung
                    </span>

                    <strong>
                        {kurs.kursleitung ||
                            '–'}
                    </strong>
                </div>

            </section>

            {/* =================================================
                JAHRGANG
               ================================================= */}

            <section className="kurs-jahrgang-section">

                <div className="kurs-jahrgang-header">

                    <div>

                        <h2>
                            Jahrgang zuordnen
                        </h2>

                        <p>
                            Alle Schüler eines Jahrgangs gleichzeitig diesem Kurs zuordnen.
                        </p>

                    </div>

                </div>

                <div className="kurs-jahrgang-content">

                    <div className="kurs-jahrgang-field">

                        <label htmlFor="jahrgang-select">
                            Jahrgang
                        </label>

                        <select
                            id="jahrgang-select"
                            value={
                                selectedJahrgang
                            }
                            onChange={(
                                event
                            ) => {

                                setSelectedJahrgang(
                                    event
                                        .target
                                        .value
                                );

                                setJahrgangMessage(
                                    ''
                                );
                            }}
                        >

                            <option value="">
                                Jahrgang auswählen...
                            </option>

                            {jahrgaenge.map(
                                (
                                    jahrgang
                                ) => (

                                    <option
                                        key={
                                            jahrgang
                                        }
                                        value={
                                            jahrgang
                                        }
                                    >
                                        {
                                            jahrgang
                                        }
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                    <button
                        type="button"
                        className="kurs-jahrgang-button"
                        onClick={
                            handleAddJahrgang
                        }
                        disabled={
                            !selectedJahrgang ||
                            jahrgangLoading
                        }
                    >

                        {jahrgangLoading
                            ? 'Wird hinzugefügt...'
                            : 'Jahrgang hinzufügen'}

                    </button>

                </div>

                {jahrgangMessage && (

                    <div className="kurs-jahrgang-message">
                        {jahrgangMessage}
                    </div>

                )}

            </section>

            {/* =================================================
                SCHÜLER HINZUFÜGEN
               ================================================= */}

            <section className="kurs-add-students-section">

                <button
                    type="button"
                    className="kurs-add-students-toggle"
                    onClick={() => {

                        setAddStudentsOpen(
                            (
                                previous
                            ) =>
                                !previous
                        );

                        setAddStudentsMessage(
                            ''
                        );
                    }}
                >

                    <span>
                        Schüler/-innen hinzufügen
                    </span>

                    <span>
                        {addStudentsOpen
                            ? '−'
                            : '+'}
                    </span>

                </button>

                {addStudentsOpen && (

                    <div className="kurs-add-students-content">

                        <div className="kurs-add-students-filter">

                            <div className="kurs-add-students-field">

                                <label>
                                    Suche
                                </label>

                                <input
                                    type="text"
                                    placeholder="Nachname oder Vorname..."
                                    value={
                                        addStudentSearch
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setAddStudentSearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />

                            </div>

                            <div className="kurs-add-students-field">

                                <label>
                                    Jahrgang
                                </label>

                                <select
                                    value={
                                        addStudentJahrgang
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setAddStudentJahrgang(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                >

                                    <option value="">
                                        Alle Jahrgänge
                                    </option>

                                    {jahrgaenge.map(
                                        (
                                            jahrgang
                                        ) => (

                                            <option
                                                key={
                                                    jahrgang
                                                }
                                                value={
                                                    jahrgang
                                                }
                                            >
                                                {
                                                    jahrgang
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                        </div>

                        <div className="kurs-add-students-list-header">

                            <label>

                                <input
                                    type="checkbox"
                                    checked={
                                        availableStudents
                                            .length >
                                        0 &&
                                        availableStudents
                                            .every(
                                                (
                                                    student
                                                ) =>
                                                    selectedStudentIds
                                                        .includes(
                                                            student.id
                                                        )
                                            )
                                    }
                                    onChange={
                                        handleSelectAllVisible
                                    }
                                />

                                Alle sichtbaren auswählen

                            </label>

                            <span>
                                {
                                    availableStudents
                                        .length
                                } verfügbar
                            </span>

                        </div>

                        <div className="kurs-add-students-list">

                            {availableStudents
                                .length ===
                            0 ? (

                                <div className="kurs-add-students-empty">

                                    Keine passenden Schüler verfügbar.

                                </div>

                            ) : (

                                availableStudents
                                    .map(
                                        (
                                            student
                                        ) => (

                                            <label
                                                key={
                                                    student.id
                                                }
                                                className="kurs-add-student-row"
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        selectedStudentIds
                                                            .includes(
                                                                student.id
                                                            )
                                                    }
                                                    onChange={() =>
                                                        handleStudentSelection(
                                                            student.id
                                                        )
                                                    }
                                                />

                                                <div className="kurs-add-student-name">

                                                    <strong>
                                                        {
                                                            student.nachname ||
                                                            '–'
                                                        },{' '}
                                                        {
                                                            student.vorname ||
                                                            '–'
                                                        }
                                                    </strong>

                                                    <span>

                                                        Jahrgang{' '}
                                                        {
                                                            student.jahrgang ??
                                                            '–'
                                                        }

                                                        {' · '}

                                                        Klasse{' '}
                                                        {
                                                            student.klasse ||
                                                            '–'
                                                        }

                                                    </span>

                                                </div>

                                            </label>

                                        )
                                    )

                            )}

                        </div>

                        <div className="kurs-add-students-actions">

                            <span>

                                {
                                    selectedStudentIds
                                        .length
                                } ausgewählt

                            </span>

                            <button
                                type="button"
                                className="kurs-add-students-button"
                                disabled={
                                    selectedStudentIds
                                        .length ===
                                    0 ||
                                    addStudentsLoading
                                }
                                onClick={
                                    handleAddSelectedStudents
                                }
                            >

                                {addStudentsLoading
                                    ? 'Wird hinzugefügt...'
                                    : 'Ausgewählte Schüler hinzufügen'}

                            </button>

                        </div>

                        {addStudentsMessage && (

                            <div className="kurs-add-students-message">
                                {
                                    addStudentsMessage
                                }
                            </div>

                        )}

                    </div>

                )}

            </section>

            {/* =================================================
                KURSTEILNEHMER
               ================================================= */}

            <section className="kurs-details-content">

                <div className="kurs-details-toolbar">

                    <input
                        type="text"
                        placeholder="Schüler suchen..."
                        value={
                            filter
                        }
                        onChange={(
                            event
                        ) =>
                            setFilter(
                                event
                                    .target
                                    .value
                            )
                        }
                    />

                    <span>
                        {
                            sortedStudents
                                .length
                        } Schüler
                    </span>

                </div>

                <div className="kurs-details-table-scroll">

                    <table className="kurs-details-table">

                        <thead>

                        <tr>

                            <th
                                onClick={() =>
                                    handleSort(
                                        'nachname'
                                    )
                                }
                            >
                                Nachname
                                {sortIndicator(
                                    'nachname'
                                )}
                            </th>

                            <th
                                onClick={() =>
                                    handleSort(
                                        'vorname'
                                    )
                                }
                            >
                                Vorname
                                {sortIndicator(
                                    'vorname'
                                )}
                            </th>

                            <th
                                onClick={() =>
                                    handleSort(
                                        'jahrgang'
                                    )
                                }
                            >
                                Jahrgang
                                {sortIndicator(
                                    'jahrgang'
                                )}
                            </th>

                            <th
                                onClick={() =>
                                    handleSort(
                                        'klasse'
                                    )
                                }
                            >
                                Klasse
                                {sortIndicator(
                                    'klasse'
                                )}
                            </th>

                            <th
                                onClick={() =>
                                    handleSort(
                                        'fotoFreigabe'
                                    )
                                }
                            >
                                Fotofreigabe
                                {sortIndicator(
                                    'fotoFreigabe'
                                )}
                            </th>

                            {zeigt1530 && (
                                <th>
                                    15:30
                                </th>
                            )}

                            <th
                                onClick={() =>
                                    handleSort(
                                        'anzahlAnwesend'
                                    )
                                }
                            >
                                Anwesend
                                {sortIndicator(
                                    'anzahlAnwesend'
                                )}
                            </th>

                            <th
                                onClick={() =>
                                    handleSort(
                                        'anzahlEntschuldigt'
                                    )
                                }
                            >
                                Entschuldigt
                                {sortIndicator(
                                    'anzahlEntschuldigt'
                                )}
                            </th>

                            <th
                                onClick={() =>
                                    handleSort(
                                        'anzahlFehlend'
                                    )
                                }
                            >
                                Fehlend
                                {sortIndicator(
                                    'anzahlFehlend'
                                )}
                            </th>

                            <th>Email 1</th>
                            <th>Telefon 1</th>
                            <th>Mobil 1</th>
                            <th>Email 2</th>
                            <th>Telefon 2</th>
                            <th>Mobil 2</th>

                        </tr>

                        </thead>

                        <tbody>

                        {sortedStudents.length ===
                        0 ? (

                            <tr>

                                <td
                                    colSpan={
                                        zeigt1530
                                            ? 15
                                            : 14
                                    }
                                    className="kurs-details-empty"
                                >

                                    Keine Schüler gefunden.

                                </td>

                            </tr>

                        ) : (

                            sortedStudents.map(
                                (
                                    student
                                ) => (

                                    <tr
                                        key={
                                            student.id
                                        }
                                        onClick={() =>
                                            navigate(
                                                `/students/${student.id}`
                                            )
                                        }
                                    >

                                        <td>
                                            {
                                                student.nachname ||
                                                '–'
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.vorname ||
                                                '–'
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.jahrgang ??
                                                '–'
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.klasse ||
                                                '–'
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.fotoFreigabe ||
                                                '–'
                                            }
                                        </td>

                                        {zeigt1530 && (

                                            <td className="kurs-1530-cell">

                                                {student.gehtUm1530
                                                    ? '15:30'
                                                    : ''}

                                            </td>

                                        )}

                                        <td>
                                            {
                                                student.anzahlAnwesend
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.anzahlEntschuldigt
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.anzahlFehlend
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.email1 ||
                                                '–'
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.telefon1 ||
                                                '–'
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.mobil1 ||
                                                '–'
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.email2 ||
                                                '–'
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.telefon2 ||
                                                '–'
                                            }
                                        </td>

                                        <td>
                                            {
                                                student.mobil2 ||
                                                '–'
                                            }
                                        </td>

                                    </tr>

                                )
                            )

                        )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

export default KursDetailsPage;