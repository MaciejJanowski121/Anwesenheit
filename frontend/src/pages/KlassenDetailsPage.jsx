import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    useNavigate,
    useParams
} from 'react-router-dom';

import KlassenAnwesenheitszeiten
    from '../components/KlassenAnwesenheitszeiten';

import {
    getKlasse,
    getKlassenSchueler,
    addStudentsToKlasse,
    removeStudentFromKlasse
} from '../services/klasseService';

import {
    getStudents
} from '../services/studentService';

import {
    getTagesAnwesenheitStatistik
} from '../services/tagesAnwesenheitService';

import './KlassenDetailsPage.css';


/* =====================================================
   TABELLENSPALTEN
   ===================================================== */

const STUDENT_COLUMNS = [
    { key: 'nachname', label: 'Name' },
    { key: 'vorname', label: 'Vorname' },
    { key: 'jahrgang', label: 'Jahrgang' },
    { key: 'anwesenheit', label: 'Anwesend' },
    { key: 'fehlend', label: 'Fehlend' },
    { key: 'teilweiseAbwesend', label: 'Teilweise abwesend' },
    { key: 'fotoFreigabe', label: 'Fotofreigabe' },
    { key: 'email1', label: 'Email 1' },
    { key: 'telefon1', label: 'Telefon 1' },
    { key: 'mobil1', label: 'Mobil 1' },
    { key: 'email2', label: 'Email 2' },
    { key: 'telefon2', label: 'Telefon 2' },
    { key: 'mobil2', label: 'Mobil 2' }
];

const NUMERIC_COLUMNS = [
    'jahrgang',
    'anwesenheit',
    'fehlend',
    'teilweiseAbwesend'
];

const STATISTIK_COLUMNS = [
    'anwesenheit',
    'fehlend',
    'teilweiseAbwesend'
];


/* =====================================================
   KLASSEN DETAILS PAGE
   ===================================================== */

function KlassenDetailsPage({ isAdmin = false }) {

    const { id } = useParams();
    const navigate = useNavigate();


    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [klasse, setKlasse] = useState(null);

    const [students, setStudents] = useState([]);

    const [allStudents, setAllStudents] = useState([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    const [message, setMessage] = useState('');


    /* =====================================================
       ANWESENHEITSSTATISTIK
       ===================================================== */

    const [
        anwesenheitStatistiken,
        setAnwesenheitStatistiken
    ] = useState({});

    const [
        statistikLoading,
        setStatistikLoading
    ] = useState(false);

    const [
        statistikError,
        setStatistikError
    ] = useState('');


    /* =====================================================
       FILTER UND SORTIERUNG
       ===================================================== */

    const [filter, setFilter] = useState('');

    const [sortKey, setSortKey] =
        useState('nachname');

    const [sortDirection, setSortDirection] =
        useState('asc');


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


    /* =====================================================
       DATEN LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const load = async () => {

            try {

                setLoading(true);
                setError('');
                setMessage('');

                setKlasse(null);
                setStudents([]);
                setAllStudents([]);
                setAnwesenheitStatistiken({});
                setStatistikError('');

                setSelectedStudentIds([]);
                setAddStudentsOpen(false);

                const requests = [

                    getKlasse(id),

                    getKlassenSchueler(id)

                ];

                if (isAdmin) {

                    requests.push(
                        getStudents()
                    );
                }

                const [
                    klasseData,
                    schuelerData,
                    alleSchuelerData
                ] = await Promise.all(requests);

                if (!active) {

                    return;
                }

                setKlasse(klasseData);

                setStudents(
                    Array.isArray(schuelerData)
                        ? schuelerData
                        : []
                );

                setAllStudents(
                    Array.isArray(alleSchuelerData)
                        ? alleSchuelerData
                        : []
                );

            } catch (err) {

                if (!active) {

                    return;
                }

                console.error(
                    'Klasse konnte nicht geladen werden:',
                    err
                );

                setError(
                    'Die Klasse konnte nicht geladen werden.'
                );

            } finally {

                if (active) {

                    setLoading(false);
                }
            }
        };

        load();

        return () => {

            active = false;
        };

    }, [id, isAdmin]);


    /* =====================================================
       ANWESENHEITSSTATISTIKEN LADEN

       Für jeden Schüler wird die Statistik aus der
       zentralen Tagesanwesenheit geladen.
       ===================================================== */

    useEffect(() => {

        let active = true;

        const loadStatistiken = async () => {

            if (students.length === 0) {

                setAnwesenheitStatistiken({});
                setStatistikLoading(false);
                setStatistikError('');

                return;
            }

            try {

                setStatistikLoading(true);
                setStatistikError('');
                setAnwesenheitStatistiken({});

                const results = await Promise.allSettled(

                    students.map(async student => {

                        const statistik =
                            await getTagesAnwesenheitStatistik(
                                student.id
                            );

                        return {

                            studentId: student.id,

                            anwesenheit:
                                statistik.anzahlAnwesend ?? 0,

                            fehlend:
                                statistik.anzahlFehlend ?? 0,

                            teilweiseAbwesend:
                                statistik.anzahlTeilweiseAbwesend ?? 0
                        };
                    })

                );

                if (!active) {

                    return;
                }

                const statistiken = {};

                let failedCount = 0;

                results.forEach(result => {

                    if (result.status === 'fulfilled') {

                        const statistik = result.value;

                        statistiken[statistik.studentId] = {

                            anwesenheit:
                            statistik.anwesenheit,

                            fehlend:
                            statistik.fehlend,

                            teilweiseAbwesend:
                            statistik.teilweiseAbwesend
                        };

                    } else {

                        failedCount++;

                        console.error(
                            'Anwesenheitsstatistik konnte nicht geladen werden:',
                            result.reason
                        );
                    }
                });

                setAnwesenheitStatistiken(
                    statistiken
                );

                if (failedCount > 0) {

                    setStatistikError(
                        `Für ${failedCount} Schüler konnten die Anwesenheitsstatistiken nicht geladen werden.`
                    );
                }

            } catch (err) {

                if (!active) {

                    return;
                }

                console.error(
                    'Fehler beim Laden der Anwesenheitsstatistiken:',
                    err
                );

                setStatistikError(
                    'Anwesenheitsstatistiken konnten nicht geladen werden.'
                );

            } finally {

                if (active) {

                    setStatistikLoading(false);
                }
            }
        };

        loadStatistiken();

        return () => {

            active = false;
        };

    }, [students]);


    /* =====================================================
       DATEN AKTUALISIEREN
       ===================================================== */

    const refreshStudents = async () => {

        const requests = [

            getKlassenSchueler(id)

        ];

        if (isAdmin) {

            requests.push(
                getStudents()
            );
        }

        const [
            schuelerData,
            alleSchuelerData
        ] = await Promise.all(requests);

        setStudents(
            Array.isArray(schuelerData)
                ? schuelerData
                : []
        );

        if (isAdmin) {

            setAllStudents(
                Array.isArray(alleSchuelerData)
                    ? alleSchuelerData
                    : []
            );
        }
    };


    /* =====================================================
       SCHÜLER MIT ANWESENHEITSSTATISTIKEN
       ===================================================== */

    const studentsWithStatistiken = useMemo(() => {

        return students.map(student => {

            const statistik =
                anwesenheitStatistiken[student.id];

            return {

                ...student,

                anwesenheit:
                    statistik?.anwesenheit ?? null,

                fehlend:
                    statistik?.fehlend ?? null,

                teilweiseAbwesend:
                    statistik?.teilweiseAbwesend ?? null
            };
        });

    }, [
        students,
        anwesenheitStatistiken
    ]);


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

                    .filter(value =>

                        value !== null &&
                        value !== undefined &&
                        value !== ''

                    )
            )

        ].sort(
            (a, b) =>
                Number(a) - Number(b)
        );

    }, [allStudents]);


    /* =====================================================
       VERFÜGBARE SCHÜLER
       ===================================================== */

    const assignedStudentIds = useMemo(() => {

        return new Set(

            students.map(
                student => student.id
            )

        );

    }, [students]);


    const availableStudents = useMemo(() => {

        const term = addStudentSearch
            .trim()
            .toLocaleLowerCase('de');

        return allStudents

            .filter(student =>

                !assignedStudentIds.has(
                    student.id
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

                if (!term) {

                    return true;
                }

                return [

                    student.nachname,
                    student.vorname,
                    student.klasse,
                    student.jahrgang

                ].some(value =>

                    String(value ?? '')
                        .toLocaleLowerCase('de')
                        .includes(term)

                );
            })

            .sort((a, b) => {

                const result = String(
                    a.nachname ?? ''
                ).localeCompare(
                    String(b.nachname ?? ''),
                    'de'
                );

                return result !== 0

                    ? result

                    : String(
                        a.vorname ?? ''
                    ).localeCompare(
                        String(b.vorname ?? ''),
                        'de'
                    );
            });

    }, [

        allStudents,
        assignedStudentIds,
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


    const handleSelectAllVisible = () => {

        const visibleIds = availableStudents.map(

            student => student.id

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

                    !visibleIds.includes(
                        studentId
                    )
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
       SCHÜLER HINZUFÜGEN
       ===================================================== */

    const handleAddSelectedStudents = async () => {

        if (

            !isAdmin ||
            saving ||
            selectedStudentIds.length === 0

        ) {

            return;
        }

        const selectedStudents = allStudents.filter(

            student =>

                selectedStudentIds.includes(
                    student.id
                )

        );

        const studentsWithOtherClass =
            selectedStudents.filter(

                student =>

                    student.klasse &&

                    student.klasse !== klasse?.name

            );

        if (studentsWithOtherClass.length > 0) {

            const confirmed = window.confirm(

                `${studentsWithOtherClass.length} ausgewählte Schüler sind bereits einer anderen Klasse zugeordnet.\n\n` +

                `Diese Schüler werden in die Klasse „${klasse.name}“ verschoben.\n\n` +

                'Möchten Sie fortfahren?'
            );

            if (!confirmed) {

                return;
            }
        }

        try {

            setSaving(true);
            setError('');
            setMessage('');

            const result = await addStudentsToKlasse(

                id,

                selectedStudentIds

            );

            await refreshStudents();

            setSelectedStudentIds([]);

            setMessage(

                `${result?.hinzugefuegt ?? 0} Schüler wurden der Klasse zugeordnet.`

            );

        } catch (err) {

            console.error(
                'Schüler konnten nicht zugeordnet werden:',
                err
            );

            setError(

                err.message ||

                'Die Schüler konnten nicht zugeordnet werden.'

            );

        } finally {

            setSaving(false);
        }
    };


    /* =====================================================
       SCHÜLER ENTFERNEN
       ===================================================== */

    const handleRemoveStudent = async (student) => {

        if (!isAdmin || saving) {

            return;
        }

        const confirmed = window.confirm(

            `Möchten Sie ${student.vorname} ${student.nachname} wirklich aus der Klasse „${klasse.name}“ entfernen?\n\n` +

            'Der Schülerdatensatz bleibt erhalten.'

        );

        if (!confirmed) {

            return;
        }

        try {

            setSaving(true);
            setError('');
            setMessage('');

            await removeStudentFromKlasse(

                id,

                student.id

            );

            await refreshStudents();

            setMessage(

                'Der Schüler wurde aus der Klasse entfernt.'

            );

        } catch (err) {

            console.error(
                'Schüler konnte nicht entfernt werden:',
                err
            );

            setError(

                err.message ||

                'Der Schüler konnte nicht entfernt werden.'

            );

        } finally {

            setSaving(false);
        }
    };


    /* =====================================================
       FILTER
       ===================================================== */

    const filteredStudents = useMemo(() => {

        const term = filter
            .trim()
            .toLocaleLowerCase('de');

        if (!term) {

            return studentsWithStatistiken;
        }

        return studentsWithStatistiken.filter(student =>

            [

                student.nachname,
                student.vorname,
                student.jahrgang,
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

    }, [

        studentsWithStatistiken,

        filter

    ]);


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
                 * Fehlende Statistiken bleiben unabhängig
                 * von der Sortierrichtung am Tabellenende.
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

                    Number(valueA) -

                    Number(valueB);

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


    /* =====================================================
       SORTIERUNG ÄNDERN
       ===================================================== */

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
       TABELLENZELLE RENDERN
       ===================================================== */

    const renderStudentCell = (student, columnKey) => {

        if (STATISTIK_COLUMNS.includes(columnKey)) {

            if (statistikLoading) {

                return (

                    <span className="klassen-statistik-loading">

                        ...

                    </span>
                );
            }

            const value = student[columnKey];

            if (value == null) {

                return (

                    <span className="klassen-statistik-loading">

                        –

                    </span>
                );
            }

            const badgeClass = {

                anwesenheit:
                    'klassen-statistik-anwesend',

                fehlend:
                    'klassen-statistik-fehlend',

                teilweiseAbwesend:
                    'klassen-statistik-teilweise'

            }[columnKey];

            return (

                <span
                    className={
                        `klassen-statistik-badge ${badgeClass}`
                    }
                >

                    {value}

                </span>
            );
        }

        return student[columnKey] ?? '–';
    };


    /* =====================================================
       SCHÜLER ÖFFNEN
       ===================================================== */

    const handleStudentOpen = (student) => {

        if (isAdmin) {

            navigate(
                `/students/${student.id}`
            );

        } else {

            navigate(
                `/schuelerinfos/${student.id}`
            );
        }
    };


    /* =====================================================
       LADEN
       ===================================================== */

    if (loading) {

        return (

            <div className="klassen-details-message">

                Klasse wird geladen...

            </div>
        );
    }


    /* =====================================================
       KLASSE NICHT GEFUNDEN
       ===================================================== */

    if (!klasse) {

        return (

            <div className="klassen-details-message klassen-details-error">

                {error || 'Klasse nicht gefunden.'}

            </div>
        );
    }


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="klassen-details-page">


            {/* =========================================
                ZURÜCK
               ========================================= */}

            <button
                type="button"
                className="klassen-back-button"
                onClick={() => navigate('/klassen')}
            >

                <span aria-hidden="true">

                    ←

                </span>

                Zurück zu den Klassen

            </button>


            {/* =========================================
                HEADER
               ========================================= */}

            <header className="page-header">

                <div className="page-header-content">

                    <h1>

                        {klasse.name}

                    </h1>

                    <p>

                        Klassenübersicht und Schülerverwaltung

                    </p>

                </div>

                <span className="klassen-details-count">

                    {students.length} Schüler

                </span>

            </header>


            {/* =========================================
                FEHLER
               ========================================= */}

            {error && (

                <div
                    className="klassen-details-error-box"
                    role="alert"
                >

                    {error}

                </div>

            )}


            {/* =========================================
                ERFOLG
               ========================================= */}

            {message && (

                <div className="klassen-details-success-box">

                    {message}

                </div>

            )}


            {/* =========================================
                INFORMATIONEN
               ========================================= */}

            <section className="klassen-details-info">

                <div>

                    <span>Klasse</span>

                    <strong>

                        {klasse.name || '–'}

                    </strong>

                </div>

                <div>

                    <span>Klassenpäd. 1</span>

                    <strong>

                        {klasse.klassenpaedagoge1 || '–'}

                    </strong>

                </div>

                <div>

                    <span>Klassenpäd. 2</span>

                    <strong>

                        {klasse.klassenpaedagoge2 || '–'}

                    </strong>

                </div>

                <div>

                    <span>Schüler</span>

                    <strong>

                        {students.length}

                    </strong>

                </div>

            </section>


            {/* =========================================
                ANWESENHEITSZEITEN
               ========================================= */}

            <KlassenAnwesenheitszeiten

                klasseId={id}

                isAdmin={isAdmin}

            />


            {/* =========================================
                SCHÜLER HINZUFÜGEN
               ========================================= */}

            {isAdmin && (

                <section className="klassen-add-students-section">

                    <button
                        type="button"
                        className="klassen-add-students-toggle"
                        onClick={() => {

                            setAddStudentsOpen(
                                previous => !previous
                            );

                            setMessage('');
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

                        <div className="klassen-add-students-content">


                            {/* FILTER */}

                            <div className="klassen-add-students-filter">

                                <div className="klassen-add-students-field">

                                    <label htmlFor="klasse-student-search">

                                        Suche

                                    </label>

                                    <input
                                        id="klasse-student-search"
                                        type="text"
                                        placeholder="Name, Klasse oder Jahrgang..."
                                        value={addStudentSearch}
                                        onChange={event =>

                                            setAddStudentSearch(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>


                                <div className="klassen-add-students-field">

                                    <label htmlFor="klasse-student-jahrgang">

                                        Jahrgang

                                    </label>

                                    <select
                                        id="klasse-student-jahrgang"
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


                            {/* ALLE AUSWÄHLEN */}

                            <div className="klassen-add-students-list-header">

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


                            {/* VERFÜGBARE SCHÜLER */}

                            <div className="klassen-add-students-list">

                                {availableStudents.length === 0 ? (

                                    <div className="klassen-add-students-empty">

                                        Keine passenden Schüler verfügbar.

                                    </div>

                                ) : (

                                    availableStudents.map(student => (

                                        <label
                                            key={student.id}
                                            className="klassen-add-student-row"
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

                                            <div className="klassen-add-student-name">

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

                            <div className="klassen-add-students-actions">

                                <span>

                                    {selectedStudentIds.length} ausgewählt

                                </span>

                                <button
                                    type="button"
                                    className="klassen-add-students-button"
                                    disabled={

                                        saving ||

                                        selectedStudentIds.length === 0

                                    }
                                    onClick={handleAddSelectedStudents}
                                >

                                    {saving

                                        ? 'Wird hinzugefügt...'

                                        : 'Ausgewählte Schüler hinzufügen'}

                                </button>

                            </div>

                        </div>

                    )}

                </section>

            )}


            {/* =========================================
                SCHÜLERLISTE
               ========================================= */}

            <section className="klassen-details-content">


                {/* =====================================
                    TOOLBAR
                   ===================================== */}

                <div className="klassen-details-toolbar">

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


                {/* =====================================
                    STATISTIK HINWEIS
                   ===================================== */}

                <div className="klassen-statistik-hinweis">

                    {statistikLoading

                        ? 'Anwesenheitsstatistiken werden geladen...'

                        : 'Anwesenheitsstatistik: Anzahl der erfassten Tage im gesamten gespeicherten Zeitraum. Teilweise abwesende Tage können auch unter „Anwesend“ gezählt werden.'}

                </div>


                {/* =====================================
                    STATISTIK FEHLER
                   ===================================== */}

                {statistikError && (

                    <div
                        className="klassen-details-error-box"
                        role="alert"
                    >

                        {statistikError}

                    </div>

                )}


                {/* =====================================
                    SCHÜLERTABELLE
                   ===================================== */}

                <div className="klassen-details-table-scroll">

                    <table className="klassen-details-table">


                        <thead>

                        <tr>

                            {STUDENT_COLUMNS.map(column => (

                                <th
                                    key={column.key}
                                    onClick={() =>

                                        handleSort(
                                            column.key
                                        )
                                    }
                                    className={

                                        STATISTIK_COLUMNS.includes(
                                            column.key
                                        )

                                            ? 'klassen-statistik-column'

                                            : ''
                                    }
                                >

                                    {column.label}

                                    {sortIndicator(column.key)}

                                </th>

                            ))}

                            {isAdmin && (

                                <th className="klassen-not-sortable">

                                    Aktionen

                                </th>

                            )}

                        </tr>

                        </thead>


                        <tbody>

                        {sortedStudents.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={

                                        STUDENT_COLUMNS.length +

                                        (isAdmin ? 1 : 0)

                                    }
                                    className="klassen-details-empty"
                                >

                                    Keine Schüler gefunden.

                                </td>

                            </tr>

                        ) : (

                            sortedStudents.map(student => (

                                <tr
                                    key={student.id}
                                    onClick={() =>

                                        handleStudentOpen(
                                            student
                                        )
                                    }
                                >

                                    {STUDENT_COLUMNS.map(column => (

                                        <td
                                            key={column.key}
                                            className={

                                                STATISTIK_COLUMNS.includes(
                                                    column.key
                                                )

                                                    ? 'klassen-statistik-cell'

                                                    : ''
                                            }
                                        >

                                            {renderStudentCell(

                                                student,

                                                column.key

                                            )}

                                        </td>

                                    ))}


                                    {/* SCHÜLER ENTFERNEN */}

                                    {isAdmin && (

                                        <td
                                            className="klassen-remove-cell"
                                            onClick={event =>

                                                event.stopPropagation()

                                            }
                                        >

                                            <button
                                                type="button"
                                                className="klassen-remove-button"
                                                disabled={saving}
                                                onClick={() =>

                                                    handleRemoveStudent(
                                                        student
                                                    )
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

export default KlassenDetailsPage;