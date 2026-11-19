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
    getBuchungenByKurs
} from '../services/buchungService';

import {
    getAnaAnwesenheitStatistik
} from '../services/gruppenAnwesenheitService';

import './KursinfoDetailsPage.css';


/* =====================================================
   TABELLENSPALTEN
   ===================================================== */

const STUDENT_COLUMNS = [
    { key: 'nachname', label: 'Nachname' },
    { key: 'vorname', label: 'Vorname' },
    { key: 'jahrgang', label: 'Jahrgang' },
    { key: 'klasse', label: 'Klasse' },
    { key: 'besonderheiten', label: 'Besonderheiten' }
];

const STATISTIK_COLUMNS = [
    {
        key: 'anzahlAnwesend',
        label: 'Anwesend'
    },
    {
        key: 'anzahlFehlend',
        label: 'Fehlend'
    },
    {
        key: 'anzahlTeilweiseAbwesend',
        label: 'Teilweise abwesend'
    }
];

const NUMERIC_COLUMNS = [
    'jahrgang',
    'anzahlAnwesend',
    'anzahlFehlend',
    'anzahlTeilweiseAbwesend'
];


/* =====================================================
   KURSINFO DETAILS PAGE
   ===================================================== */

function KursinfoDetailsPage() {

    const { id } = useParams();

    const navigate = useNavigate();


    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [kurs, setKurs] = useState(null);

    const [buchungen, setBuchungen] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');


    /* =====================================================
       ANWESENHEITSSTATISTIK
       ===================================================== */

    const [statistik, setStatistik] = useState([]);

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
       DATEN LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const loadData = async () => {

            try {

                setLoading(true);
                setError('');

                setKurs(null);
                setBuchungen([]);

                setStatistik([]);
                setStatistikError('');
                setStatistikLoading(false);


                /* =========================================
                   KURS UND BUCHUNGEN LADEN
                   ========================================= */

                const [
                    kursData,
                    buchungenData
                ] = await Promise.all([

                    getKursById(id),

                    getBuchungenByKurs(id)

                ]);

                if (!active) {
                    return;
                }

                const buchungenListe =
                    Array.isArray(buchungenData)
                        ? buchungenData
                        : [];

                setKurs(kursData);

                setBuchungen(buchungenListe);

                setLoading(false);


                /* =========================================
                   ANWESENHEITSSTATISTIK LADEN

                   Eine Anfrage für alle Kursteilnehmer.
                   ========================================= */

                if (buchungenListe.length === 0) {

                    return;
                }

                try {

                    setStatistikLoading(true);

                    const statistikData =
                        await getAnaAnwesenheitStatistik(id);

                    if (!active) {

                        return;
                    }

                    if (!Array.isArray(statistikData)) {

                        throw new Error(
                            'Ungültige Anwesenheitsstatistik.'
                        );
                    }

                    setStatistik(statistikData);

                } catch (err) {

                    if (!active) {

                        return;
                    }

                    console.error(
                        'Anwesenheitsstatistik konnte nicht geladen werden:',
                        err
                    );

                    const detail =
                        err.response?.data?.detail ||
                        err.response?.data?.message;

                    setStatistikError(

                        typeof detail === 'string'

                            ? detail

                            : 'Die Anwesenheitsstatistik konnte nicht geladen werden. Bitte prüfen Sie die hinterlegten Kurszeiten.'

                    );

                } finally {

                    if (active) {

                        setStatistikLoading(false);
                    }
                }

            } catch (err) {

                if (!active) {

                    return;
                }

                console.error(
                    'Kursinfo konnte nicht geladen werden:',
                    err
                );

                setError(
                    'Die Kursinformationen konnten nicht geladen werden.'
                );

            } finally {

                if (active) {

                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {

            active = false;
        };

    }, [id]);


    /* =====================================================
       STATISTIK NACH SCHÜLER-ID
       ===================================================== */

    const statistikMap = useMemo(() => {

        return new Map(

            statistik.map(eintrag => [

                String(eintrag.studentId),

                eintrag

            ])
        );

    }, [statistik]);


    /* =====================================================
       BUCHUNGEN UND STATISTIK ZUSAMMENFÜHREN
       ===================================================== */

    const students = useMemo(() => {

        return buchungen

            .filter(buchung =>
                buchung.student != null
            )

            .map(buchung => {

                const student =
                    buchung.student;

                const studentStatistik =
                    statistikMap.get(
                        String(student.id)
                    );

                return {

                    ...student,

                    buchungId:
                    buchung.id,

                    besonderheiten:
                        buchung.besonderheiten ?? '',

                    anzahlAnwesend:
                        studentStatistik?.anzahlAnwesend ?? null,

                    anzahlFehlend:
                        studentStatistik?.anzahlFehlend ?? null,

                    anzahlTeilweiseAbwesend:
                        studentStatistik?.anzahlTeilweiseAbwesend ?? null
                };
            });

    }, [
        buchungen,
        statistikMap
    ]);


    /* =====================================================
       SCHÜLER FILTERN
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

                `${student.nachname ?? ''} ${student.vorname ?? ''}`,

                `${student.vorname ?? ''} ${student.nachname ?? ''}`,

                student.jahrgang,

                student.klasse,

                student.besonderheiten

            ].some(value =>

                String(value ?? '')

                    .toLocaleLowerCase('de')

                    .includes(term)

            )
        );

    }, [
        students,
        filter
    ]);


    /* =====================================================
       SCHÜLER SORTIEREN
       ===================================================== */

    const sortedStudents = useMemo(() => {

        return [...filteredStudents].sort((a, b) => {

            const valueA = a[sortKey];

            const valueB = b[sortKey];

            let result;


            /* NUMERISCHE SORTIERUNG */

            if (NUMERIC_COLUMNS.includes(sortKey)) {

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

                /* TEXTSORTIERUNG */

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


            /*
             * Bei gleichem Nachnamen zusätzlich
             * nach Vornamen sortieren.
             */

            if (
                result === 0 &&
                sortKey === 'nachname'
            ) {

                result = String(

                    a.vorname ?? ''

                ).localeCompare(

                    String(b.vorname ?? ''),

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
       STATISTIKZELLE
       ===================================================== */

    const renderStatistikCell = (student, key) => {

        if (statistikLoading) {

            return (

                <span className="kursinfo-statistik-loading">

                    ...

                </span>
            );
        }

        const value = student[key];

        if (value == null) {

            return (

                <span className="kursinfo-statistik-loading">

                    –

                </span>
            );
        }

        const badgeClass = {

            anzahlAnwesend:
                'kursinfo-statistik-anwesend',

            anzahlFehlend:
                'kursinfo-statistik-fehlend',

            anzahlTeilweiseAbwesend:
                'kursinfo-statistik-teilweise'

        }[key];

        return (

            <span
                className={
                    `kursinfo-statistik-badge ${badgeClass}`
                }
            >

                {value}

            </span>
        );
    };


    /* =====================================================
       WERTE FORMATIEREN
       ===================================================== */

    const formatValue = (value) => {

        if (

            value === null ||

            value === undefined ||

            value === ''

        ) {

            return '–';
        }

        return value;
    };


    /* =====================================================
       SCHÜLER ÖFFNEN
       ===================================================== */

    const handleStudentOpen = (student) => {

        navigate(
            `/schuelerinfos/${student.id}`
        );
    };


    /* =====================================================
       TABELLENSPALTEN ANZAHL
       ===================================================== */

    const columnCount =

        STUDENT_COLUMNS.length +

        STATISTIK_COLUMNS.length;


    /* =====================================================
       LOADING
       ===================================================== */

    if (loading) {

        return (

            <div className="kursinfo-details-message">

                Kurs wird geladen...

            </div>
        );
    }


    /* =====================================================
       FEHLER
       ===================================================== */

    if (error) {

        return (

            <div className="kursinfo-details-message kursinfo-details-error">

                {error}

            </div>
        );
    }


    /* =====================================================
       KURS NICHT GEFUNDEN
       ===================================================== */

    if (!kurs) {

        return (

            <div className="kursinfo-details-message">

                Kurs nicht gefunden.

            </div>
        );
    }


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="kursinfo-details-page">


            {/* =========================================
                ZURÜCK
               ========================================= */}

            <button
                type="button"
                className="back-button"
                onClick={() =>
                    navigate('/kursinfos')
                }
            >

                Zurück zu den Kursinfos

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

                        Kursinformationen

                    </p>

                </div>

                <span className="kursinfo-details-count">

                    {students.length} Schüler

                </span>

            </header>


            {/* =========================================
                KURSINFORMATIONEN
               ========================================= */}

            <section className="kursinfo-details-info">

                <div>

                    <span>Kurs</span>

                    <strong>

                        {formatValue(kurs.name)}

                    </strong>

                </div>

                <div>

                    <span>Kursleitung</span>

                    <strong>

                        {formatValue(kurs.kursleitung)}

                    </strong>

                </div>

                <div>

                    <span>Wochentag</span>

                    <strong>

                        {formatValue(kurs.wochentag)}

                    </strong>

                </div>

                <div>

                    <span>Beginn</span>

                    <strong>

                        {formatValue(kurs.uhrzeit)}

                    </strong>

                </div>

                <div>

                    <span>Ende</span>

                    <strong>

                        {formatValue(kurs.uhrzeitEnde)}

                    </strong>

                </div>

                <div>

                    <span>Buchungsart</span>

                    <strong>

                        {formatValue(kurs.buchungsart)}

                    </strong>

                </div>

            </section>


            {/* =========================================
                KURSTEILNEHMER
               ========================================= */}

            <section className="kursinfo-students">


                {/* HEADER */}

                <div className="kursinfo-students-header">

                    <div>

                        <h2>

                            Kursteilnehmer

                        </h2>

                        <p>

                            Zugeordnete Schüler dieses Kurses

                        </p>

                    </div>

                </div>


                {/* =====================================
                    SUCHE
                   ===================================== */}

                <div className="kursinfo-students-toolbar">

                    <input
                        type="text"
                        placeholder="Schüler suchen..."
                        aria-label="Schüler suchen"
                        value={filter}
                        onChange={event =>

                            setFilter(
                                event.target.value
                            )

                        }
                    />

                    <span>

                        {sortedStudents.length} von{' '}

                        {students.length} Schülern

                    </span>

                </div>


                {/* =====================================
                    STATISTIK HINWEIS
                   ===================================== */}

                <div className="kursinfo-statistik-hinweis">

                    {statistikLoading

                        ? 'Anwesenheitsstatistiken werden geladen...'

                        : 'Die Anwesenheitsstatistik berücksichtigt ausschließlich erfasste Tage am Wochentag des Kurses sowie dessen Beginn- und Endzeit. Grundlage sind die aktuellen Kursbuchungen.'}

                </div>


                {/* =====================================
                    STATISTIK FEHLER
                   ===================================== */}

                {statistikError && (

                    <div
                        className="kursinfo-statistik-error"
                        role="alert"
                    >

                        {statistikError}

                    </div>

                )}


                {/* =====================================
                    KURSTEILNEHMER TABELLE
                   ===================================== */}

                <div className="kursinfo-table-scroll">

                    <table className="kursinfo-student-table">

                        <thead>

                        <tr>

                            {/* SCHÜLERDATEN */}

                            {STUDENT_COLUMNS.map(column => (

                                <th
                                    key={column.key}
                                    className="kursinfo-sortable-column"
                                    onClick={() =>

                                        handleSort(column.key)

                                    }
                                >

                                    {column.label}

                                    {sortIndicator(column.key)}

                                </th>

                            ))}


                            {/* ANWESENHEITSSTATISTIK */}

                            {STATISTIK_COLUMNS.map(column => (

                                <th
                                    key={column.key}
                                    className="kursinfo-statistik-column"
                                    onClick={() =>

                                        handleSort(column.key)

                                    }
                                >

                                    {column.label}

                                    {sortIndicator(column.key)}

                                </th>

                            ))}

                        </tr>

                        </thead>


                        <tbody>

                        {sortedStudents.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={columnCount}
                                    className="kursinfo-empty"
                                >

                                    {students.length === 0

                                        ? 'Keine Schüler zugeordnet.'

                                        : 'Keine passenden Schüler gefunden.'}

                                </td>

                            </tr>

                        ) : (

                            sortedStudents.map(student => (

                                <tr
                                    key={
                                        student.buchungId ??
                                        student.id
                                    }
                                    className="kursinfo-student-row"
                                    onClick={() =>

                                        handleStudentOpen(student)

                                    }
                                >

                                    {/* SCHÜLERDATEN */}

                                    {STUDENT_COLUMNS.map(column => (

                                        <td key={column.key}>

                                            {column.key === 'nachname' ? (

                                                <button
                                                    type="button"
                                                    className="kursinfo-student-link"
                                                    onClick={event => {

                                                        event.stopPropagation();

                                                        handleStudentOpen(student);
                                                    }}
                                                >

                                                    {formatValue(student.nachname)}

                                                </button>

                                            ) : (

                                                formatValue(
                                                    student[column.key]
                                                )

                                            )}

                                        </td>

                                    ))}


                                    {/* ANWESENHEITSSTATISTIK */}

                                    {STATISTIK_COLUMNS.map(column => (

                                        <td
                                            key={column.key}
                                            className="kursinfo-statistik-cell"
                                        >

                                            {renderStatistikCell(

                                                student,

                                                column.key

                                            )}

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

export default KursinfoDetailsPage;