import React, {
    useEffect,
    useMemo,
    useState,
    useCallback,
    useRef
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
    getAnaAnwesenheitStatistik
} from '../services/gruppenAnwesenheitService';

import './KursDetailsPage.css';


/* =====================================================
   TABELLENSPALTEN
   ===================================================== */

const STUDENT_COLUMNS = [
    { key: 'nachname', label: 'Nachname' },
    { key: 'vorname', label: 'Vorname' },
    { key: 'jahrgang', label: 'Jahrgang' },
    { key: 'klasse', label: 'Klasse' },
    { key: 'fotoFreigabe', label: 'Fotofreigabe' }
];

const STATISTIK_COLUMNS = [
    { key: 'anzahlAnwesend', label: 'Anwesend' },
    { key: 'anzahlFehlend', label: 'Fehlend' },
    {
        key: 'anzahlTeilweiseAbwesend',
        label: 'Teilweise abwesend'
    }
];

const CONTACT_COLUMNS = [
    { key: 'email1', label: 'Email 1' },
    { key: 'telefon1', label: 'Telefon 1' },
    { key: 'mobil1', label: 'Mobil 1' },
    { key: 'email2', label: 'Email 2' },
    { key: 'telefon2', label: 'Telefon 2' },
    { key: 'mobil2', label: 'Mobil 2' }
];

const NUMERIC_COLUMNS = [
    'jahrgang',
    'anzahlAnwesend',
    'anzahlFehlend',
    'anzahlTeilweiseAbwesend'
];


/* =====================================================
   KURS DETAILS PAGE
   ===================================================== */

function KursDetailsPage() {

    const { id } = useParams();

    const navigate = useNavigate();

    const requestIdRef = useRef(0);


    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [kurs, setKurs] = useState(null);

    const [students, setStudents] = useState([]);

    const [allStudents, setAllStudents] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');


    /* =====================================================
       ANWESENHEITSSTATISTIK
       ===================================================== */

    const [statistikLoading, setStatistikLoading] =
        useState(false);

    const [statistikError, setStatistikError] =
        useState('');


    /* =====================================================
       FILTER UND SORTIERUNG
       ===================================================== */

    const [filter, setFilter] = useState('');

    const [sortKey, setSortKey] =
        useState('nachname');

    const [sortDirection, setSortDirection] =
        useState('asc');


    /* =====================================================
       JAHRGANG HINZUFÜGEN
       ===================================================== */

    const [selectedJahrgang, setSelectedJahrgang] =
        useState('');

    const [jahrgangLoading, setJahrgangLoading] =
        useState(false);

    const [jahrgangMessage, setJahrgangMessage] =
        useState('');


    /* =====================================================
       SCHÜLER HINZUFÜGEN
       ===================================================== */

    const [addStudentsOpen, setAddStudentsOpen] =
        useState(false);

    const [addStudentSearch, setAddStudentSearch] =
        useState('');

    const [addStudentJahrgang, setAddStudentJahrgang] =
        useState('');

    const [selectedStudentIds, setSelectedStudentIds] =
        useState([]);

    const [addStudentsLoading, setAddStudentsLoading] =
        useState(false);

    const [addStudentsMessage, setAddStudentsMessage] =
        useState('');


    /* =====================================================
       DATEN LADEN
       ===================================================== */

    const loadData = useCallback(async () => {

        const requestId = ++requestIdRef.current;

        const isActive = () =>
            requestId === requestIdRef.current;

        try {

            setLoading(true);
            setError('');
            setStatistikError('');
            setStatistikLoading(false);

            const [
                kursData,
                buchungenData,
                studentsData
            ] = await Promise.all([

                getKursById(id),

                getBuchungenByKurs(id),

                getStudents()

            ]);

            if (!isActive()) {
                return;
            }

            setKurs(kursData);

            setAllStudents(
                Array.isArray(studentsData)
                    ? studentsData
                    : []
            );

            const buchungen =
                Array.isArray(buchungenData)
                    ? buchungenData
                    : [];


            /*
             * Teilnehmer unabhängig von der
             * Anwesenheitsstatistik anzeigen.
             */

            const teilnehmer = buchungen

                .filter(buchung =>
                    buchung.student != null
                )

                .map(buchung => ({

                    ...buchung.student,

                    buchungId: buchung.id,

                    anzahlAnwesend: null,

                    anzahlFehlend: null,

                    anzahlTeilweiseAbwesend: null

                }));


            setStudents(teilnehmer);

            setLoading(false);


            /* =============================================
               ANWESENHEITSSTATISTIK LADEN

               Eine Anfrage für alle Teilnehmer.
               ============================================= */

            if (teilnehmer.length === 0) {

                return;
            }

            try {

                setStatistikLoading(true);

                const statistikData =
                    await getAnaAnwesenheitStatistik(id);

                if (!isActive()) {
                    return;
                }

                if (!Array.isArray(statistikData)) {

                    throw new Error(
                        'Ungültige Anwesenheitsstatistik.'
                    );
                }


                /*
                 * Statistik nach Schüler-ID zuordnen.
                 */

                const statistikMap = new Map(

                    statistikData.map(statistik => [

                        String(statistik.studentId),

                        statistik

                    ])
                );


                const studentsWithStats =
                    teilnehmer.map(student => {

                        const statistik =
                            statistikMap.get(
                                String(student.id)
                            );

                        return {

                            ...student,

                            anzahlAnwesend:
                                statistik?.anzahlAnwesend ?? null,

                            anzahlFehlend:
                                statistik?.anzahlFehlend ?? null,

                            anzahlTeilweiseAbwesend:
                                statistik?.anzahlTeilweiseAbwesend ?? null
                        };
                    });


                setStudents(studentsWithStats);

            } catch (statistikError) {

                if (!isActive()) {
                    return;
                }

                console.error(
                    'Anwesenheitsstatistik konnte nicht geladen werden:',
                    statistikError
                );

                const detail =
                    statistikError.response?.data?.detail ||
                    statistikError.response?.data?.message;

                setStatistikError(

                    typeof detail === 'string'

                        ? detail

                        : 'Die Anwesenheitsstatistik konnte nicht geladen werden. Bitte prüfen Sie die hinterlegten Kurszeiten.'
                );

            } finally {

                if (isActive()) {

                    setStatistikLoading(false);
                }
            }

        } catch (error) {

            if (!isActive()) {
                return;
            }

            console.error(
                'Kursübersicht konnte nicht geladen werden:',
                error
            );

            setError(
                'Die Kursübersicht konnte nicht geladen werden.'
            );

        } finally {

            if (isActive()) {

                setLoading(false);
            }
        }

    }, [id]);


    /* =====================================================
       INITIALISIERUNG
       ===================================================== */

    useEffect(() => {

        setKurs(null);
        setStudents([]);
        setAllStudents([]);

        setSelectedStudentIds([]);
        setSelectedJahrgang('');

        setAddStudentsOpen(false);

        setJahrgangMessage('');
        setAddStudentsMessage('');

        loadData();

        return () => {

            requestIdRef.current++;
        };

    }, [loadData]);


    /* =====================================================
       JAHRGÄNGE
       ===================================================== */

    const jahrgaenge = useMemo(() => {

        return [

            ...new Set(

                allStudents

                    .map(student =>
                        student.jahrgang
                    )

                    .filter(jahrgang =>

                        jahrgang !== null &&
                        jahrgang !== undefined &&
                        jahrgang !== ''

                    )
            )

        ].sort(
            (a, b) => Number(a) - Number(b)
        );

    }, [allStudents]);


    /* =====================================================
       JAHRGANG ZUORDNEN
       ===================================================== */

    const handleAddJahrgang = async () => {

        if (
            !selectedJahrgang ||
            jahrgangLoading ||
            addStudentsLoading
        ) {

            return;
        }

        const confirmed = window.confirm(

            `Möchten Sie wirklich alle Schüler des Jahrgangs ${selectedJahrgang} dem Kurs „${kurs.name}“ zuordnen?`

        );

        if (!confirmed) {

            return;
        }

        try {

            setJahrgangLoading(true);

            setJahrgangMessage('');

            setError('');

            const result =
                await addJahrgangToKurs(

                    id,

                    selectedJahrgang

                );

            const hinzugefuegt =
                result?.hinzugefuegt ?? 0;

            if (hinzugefuegt === 0) {

                setJahrgangMessage(

                    `Alle Schüler des Jahrgangs ${selectedJahrgang} sind bereits diesem Kurs zugeordnet.`

                );

            } else {

                setJahrgangMessage(

                    `${hinzugefuegt} Schüler des Jahrgangs ${selectedJahrgang} wurden dem Kurs hinzugefügt.`

                );
            }

            setSelectedJahrgang('');

            setSelectedStudentIds([]);

            await loadData();

        } catch (error) {

            console.error(
                'Jahrgang konnte nicht zugeordnet werden:',
                error
            );

            setJahrgangMessage('');

            setError(
                'Der Jahrgang konnte nicht zugeordnet werden.'
            );

        } finally {

            setJahrgangLoading(false);
        }
    };


    /* =====================================================
       BEREITS EINGEBUCHTE SCHÜLER
       ===================================================== */

    const bookedStudentIds = useMemo(() => {

        return new Set(

            students.map(student =>
                String(student.id)
            )

        );

    }, [students]);


    /* =====================================================
       VERFÜGBARE SCHÜLER
       ===================================================== */

    const availableStudents = useMemo(() => {

        const search = addStudentSearch

            .trim()

            .toLocaleLowerCase('de');

        return allStudents

            .filter(student =>

                !bookedStudentIds.has(
                    String(student.id)
                )

            )

            .filter(student => {

                if (

                    addStudentJahrgang &&

                    String(student.jahrgang) !==
                    String(addStudentJahrgang)

                ) {

                    return false;
                }

                if (!search) {

                    return true;
                }

                const fullName =
                    `${student.nachname || ''} ${student.vorname || ''}`

                        .toLocaleLowerCase('de');

                return (

                    fullName.includes(search) ||

                    String(student.klasse ?? '')

                        .toLocaleLowerCase('de')

                        .includes(search)

                );
            })

            .sort((a, b) => {

                const vergleich = String(

                    a.nachname ?? ''

                ).localeCompare(

                    String(b.nachname ?? ''),

                    'de'

                );

                if (vergleich !== 0) {

                    return vergleich;
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
       SCHÜLER AUSWÄHLEN
       ===================================================== */

    const handleStudentSelection = (studentId) => {

        setSelectedStudentIds(previous =>

            previous.includes(studentId)

                ? previous.filter(
                    id => id !== studentId
                )

                : [
                    ...previous,
                    studentId
                ]

        );
    };


    /* =====================================================
       ALLE SICHTBAREN AUSWÄHLEN
       ===================================================== */

    const handleSelectAllVisible = () => {

        const visibleIds =
            availableStudents.map(student =>
                student.id
            );

        const allSelected =

            visibleIds.length > 0 &&

            visibleIds.every(studentId =>

                selectedStudentIds.includes(
                    studentId
                )

            );

        if (allSelected) {

            setSelectedStudentIds(previous =>

                previous.filter(studentId =>

                    !visibleIds.includes(studentId)

                )
            );

        } else {

            setSelectedStudentIds(previous => [

                ...new Set([

                    ...previous,

                    ...visibleIds

                ])

            ]);
        }
    };


    /* =====================================================
       AUSGEWÄHLTE SCHÜLER HINZUFÜGEN
       ===================================================== */

    const handleAddSelectedStudents = async () => {

        if (

            selectedStudentIds.length === 0 ||

            addStudentsLoading ||

            jahrgangLoading

        ) {

            return;
        }

        try {

            setAddStudentsLoading(true);

            setAddStudentsMessage('');

            setError('');

            const result =
                await addStudentsToKurs(

                    id,

                    selectedStudentIds

                );

            const hinzugefuegt =
                result?.hinzugefuegt ?? 0;

            setAddStudentsMessage(

                `${hinzugefuegt} Schüler wurden dem Kurs hinzugefügt.`

            );

            setSelectedStudentIds([]);

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

            setAddStudentsLoading(false);
        }
    };


    /* =====================================================
       FILTER KURSTEILNEHMER
       ===================================================== */

    const filteredStudents = useMemo(() => {

        const term = filter

            .trim()

            .toLocaleLowerCase('de');

        if (!term) {

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

                    .toLocaleLowerCase('de')

                    .includes(term)

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

            let result;

            if (NUMERIC_COLUMNS.includes(sortKey)) {

                /*
                 * Nicht verfügbare Statistiken
                 * bleiben am Tabellenende.
                 */

                if (valueA == null && valueB == null) {

                    return 0;
                }

                if (valueA == null) {

                    return 1;
                }

                if (valueB == null) {

                    return -1;
                }

                result =
                    Number(valueA) - Number(valueB);

            } else {

                result = String(

                    valueA ?? ''

                ).localeCompare(

                    String(valueB ?? ''),

                    'de',

                    {
                        sensitivity: 'base'
                    }

                );
            }

            return sortDirection === 'asc'

                ? result

                : -result;

        });

    }, [

        filteredStudents,

        sortKey,

        sortDirection

    ]);


    const handleSort = (key) => {

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


    const sortIndicator = (key) => {

        if (sortKey !== key) {

            return '';
        }

        return sortDirection === 'asc'

            ? ' ▲'

            : ' ▼';
    };


    /* =====================================================
       STATISTIKZELLE
       ===================================================== */

    const renderStatistikCell = (student, key) => {

        if (statistikLoading) {

            return (

                <span className="kurs-statistik-loading">

                    ...

                </span>
            );
        }

        const value = student[key];

        if (value == null) {

            return (

                <span className="kurs-statistik-loading">

                    –

                </span>
            );
        }

        const badgeClass = {

            anzahlAnwesend:
                'kurs-statistik-anwesend',

            anzahlFehlend:
                'kurs-statistik-fehlend',

            anzahlTeilweiseAbwesend:
                'kurs-statistik-teilweise'

        }[key];

        return (

            <span
                className={
                    `kurs-statistik-badge ${badgeClass}`
                }
            >

                {value}

            </span>
        );
    };


    /* =====================================================
       15:30
       ===================================================== */

    const zeigt1530 = [

        'OGS',

        'OGSH',

        'OGSF'

    ].includes(

        String(kurs?.buchungsart || '')

            .toUpperCase()

    );


    /* =====================================================
       KURSZEIT
       ===================================================== */

    const kurszeit = kurs?.uhrzeit

        ? kurs.uhrzeitEnde

            ? `${kurs.uhrzeit} – ${kurs.uhrzeitEnde}`

            : kurs.uhrzeit

        : '–';


    /* =====================================================
       TABELLENSPALTEN ANZAHL
       ===================================================== */

    const columnCount =

        STUDENT_COLUMNS.length +

        STATISTIK_COLUMNS.length +

        CONTACT_COLUMNS.length +

        (zeigt1530 ? 1 : 0);


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


    /* =====================================================
       FEHLER
       ===================================================== */

    if (error && !kurs) {

        return (

            <div className="kurs-details-message kurs-details-error">

                {error}

            </div>
        );
    }


    /* =====================================================
       KURS NICHT GEFUNDEN
       ===================================================== */

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


            {/* =========================================
                ZURÜCK
               ========================================= */}

            <button
                type="button"
                className="back-button"
                onClick={() => navigate('/kurse')}
            >

                Zurück zu den Kursen

            </button>


            {/* =========================================
                HEADER
               ========================================= */}

            <header className="page-header">

                <div className="page-header-content">

                    <h1>

                        {kurs.name}

                    </h1>

                    <p>

                        {kurs.wochentag || '–'}

                        {kurs.uhrzeit
                            ? ` · ${kurszeit}`
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


            {/* =========================================
                FEHLER
               ========================================= */}

            {error && (

                <div
                    className="kurs-details-error-box"
                    role="alert"
                >

                    {error}

                </div>

            )}


            {/* =========================================
                KURSINFO
               ========================================= */}

            <section className="kurs-details-info">

                <div>

                    <span>Buchungsart</span>

                    <strong>

                        {kurs.buchungsart || '–'}

                    </strong>

                </div>

                <div>

                    <span>Wochentag</span>

                    <strong>

                        {kurs.wochentag || '–'}

                    </strong>

                </div>

                <div>

                    <span>Uhrzeit</span>

                    <strong>

                        {kurszeit}

                    </strong>

                </div>

                <div>

                    <span>Kursleitung</span>

                    <strong>

                        {kurs.kursleitung || '–'}

                    </strong>

                </div>

            </section>


            {/* =========================================
                JAHRGANG ZUORDNEN
               ========================================= */}

            <section className="kurs-jahrgang-section">

                <div className="kurs-jahrgang-header">

                    <div>

                        <h2>

                            Jahrgang zuordnen

                        </h2>

                        <p>

                            Alle Schüler eines Jahrgangs gleichzeitig
                            diesem Kurs zuordnen.

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
                            value={selectedJahrgang}
                            onChange={event => {

                                setSelectedJahrgang(
                                    event.target.value
                                );

                                setJahrgangMessage('');
                            }}
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
                        onClick={handleAddJahrgang}
                        disabled={

                            !selectedJahrgang ||

                            jahrgangLoading ||

                            addStudentsLoading

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


            {/* =========================================
                SCHÜLER HINZUFÜGEN
               ========================================= */}

            <section className="kurs-add-students-section">

                <button
                    type="button"
                    className="kurs-add-students-toggle"
                    onClick={() => {

                        setAddStudentsOpen(
                            previous => !previous
                        );

                        setAddStudentsMessage('');
                    }}
                >

                    <span>

                        Schüler/-innen hinzufügen

                    </span>

                    <span>

                        {addStudentsOpen ? '−' : '+'}

                    </span>

                </button>


                {addStudentsOpen && (

                    <div className="kurs-add-students-content">


                        {/* FILTER */}

                        <div className="kurs-add-students-filter">

                            <div className="kurs-add-students-field">

                                <label htmlFor="kurs-student-search">

                                    Suche

                                </label>

                                <input
                                    id="kurs-student-search"
                                    type="text"
                                    placeholder="Nachname oder Vorname..."
                                    value={addStudentSearch}
                                    onChange={event =>

                                        setAddStudentSearch(
                                            event.target.value
                                        )

                                    }
                                />

                            </div>


                            <div className="kurs-add-students-field">

                                <label htmlFor="kurs-student-jahrgang">

                                    Jahrgang

                                </label>

                                <select
                                    id="kurs-student-jahrgang"
                                    value={addStudentJahrgang}
                                    onChange={event =>

                                        setAddStudentJahrgang(
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

                                            {jahrgang}

                                        </option>

                                    ))}

                                </select>

                            </div>

                        </div>


                        {/* ALLE SICHTBAREN AUSWÄHLEN */}

                        <div className="kurs-add-students-list-header">

                            <label>

                                <input
                                    type="checkbox"
                                    checked={

                                        availableStudents.length > 0 &&

                                        availableStudents.every(student =>

                                            selectedStudentIds.includes(
                                                student.id
                                            )

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


                        {/* SCHÜLERLISTE */}

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

                                                selectedStudentIds.includes(
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

                                                {student.nachname || '–'},{' '}

                                                {student.vorname || '–'}

                                            </strong>

                                            <span>

                                                Jahrgang{' '}

                                                {student.jahrgang ?? '–'}

                                                {' · '}

                                                Klasse{' '}

                                                {student.klasse || '–'}

                                            </span>

                                        </div>

                                    </label>

                                ))

                            )}

                        </div>


                        {/* HINZUFÜGEN */}

                        <div className="kurs-add-students-actions">

                            <span>

                                {selectedStudentIds.length} ausgewählt

                            </span>

                            <button
                                type="button"
                                className="kurs-add-students-button"
                                disabled={

                                    selectedStudentIds.length === 0 ||

                                    addStudentsLoading ||

                                    jahrgangLoading

                                }
                                onClick={handleAddSelectedStudents}
                            >

                                {addStudentsLoading

                                    ? 'Wird hinzugefügt...'

                                    : 'Ausgewählte Schüler hinzufügen'}

                            </button>

                        </div>


                        {addStudentsMessage && (

                            <div className="kurs-add-students-message">

                                {addStudentsMessage}

                            </div>

                        )}

                    </div>

                )}

            </section>


            {/* =========================================
                KURSTEILNEHMER
               ========================================= */}

            <section className="kurs-details-content">


                {/* TOOLBAR */}

                <div className="kurs-details-toolbar">

                    <input
                        type="text"
                        placeholder="Schüler suchen..."
                        value={filter}
                        onChange={event =>

                            setFilter(
                                event.target.value
                            )

                        }
                    />

                    <span>

                        {sortedStudents.length} Schüler

                    </span>

                </div>


                {/* STATISTIK HINWEIS */}

                <div className="kurs-statistik-hinweis">

                    {statistikLoading

                        ? 'Anwesenheitsstatistiken werden geladen...'

                        : 'Die Anwesenheitsstatistik berücksichtigt ausschließlich erfasste Tage am Wochentag des Kurses sowie dessen Beginn- und Endzeit. Grundlage sind die aktuellen Kursbuchungen.'}

                </div>


                {/* STATISTIK FEHLER */}

                {statistikError && (

                    <div
                        className="kurs-details-error-box"
                        role="alert"
                    >

                        {statistikError}

                    </div>

                )}


                {/* KURSTEILNEHMER TABELLE */}

                <div className="kurs-details-table-scroll">

                    <table className="kurs-details-table">

                        <thead>

                        <tr>

                            {/* SCHÜLERDATEN */}

                            {STUDENT_COLUMNS.map(column => (

                                <th
                                    key={column.key}
                                    onClick={() =>

                                        handleSort(column.key)

                                    }
                                >

                                    {column.label}

                                    {sortIndicator(column.key)}

                                </th>

                            ))}


                            {/* 15:30 */}

                            {zeigt1530 && (

                                <th>

                                    15:30

                                </th>

                            )}


                            {/* ANWESENHEITSSTATISTIK */}

                            {STATISTIK_COLUMNS.map(column => (

                                <th
                                    key={column.key}
                                    className="kurs-statistik-column"
                                    onClick={() =>

                                        handleSort(column.key)

                                    }
                                >

                                    {column.label}

                                    {sortIndicator(column.key)}

                                </th>

                            ))}


                            {/* KONTAKTDATEN */}

                            {CONTACT_COLUMNS.map(column => (

                                <th key={column.key}>

                                    {column.label}

                                </th>

                            ))}

                        </tr>

                        </thead>


                        <tbody>

                        {sortedStudents.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={columnCount}
                                    className="kurs-details-empty"
                                >

                                    Keine Schüler gefunden.

                                </td>

                            </tr>

                        ) : (

                            sortedStudents.map(student => (

                                <tr
                                    key={student.buchungId ?? student.id}
                                    onClick={() =>

                                        navigate(
                                            `/students/${student.id}`
                                        )

                                    }
                                >

                                    {/* SCHÜLERDATEN */}

                                    {STUDENT_COLUMNS.map(column => (

                                        <td key={column.key}>

                                            {student[column.key] ?? '–'}

                                        </td>

                                    ))}


                                    {/* 15:30 */}

                                    {zeigt1530 && (

                                        <td className="kurs-1530-cell">

                                            {student.gehtUm1530

                                                ? '15:30'

                                                : ''}

                                        </td>

                                    )}


                                    {/* ANWESENHEITSSTATISTIK */}

                                    {STATISTIK_COLUMNS.map(column => (

                                        <td
                                            key={column.key}
                                            className="kurs-statistik-cell"
                                        >

                                            {renderStatistikCell(

                                                student,

                                                column.key

                                            )}

                                        </td>

                                    ))}


                                    {/* KONTAKTDATEN */}

                                    {CONTACT_COLUMNS.map(column => (

                                        <td key={column.key}>

                                            {student[column.key] || '–'}

                                        </td>

                                    ))}

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

export default KursDetailsPage;