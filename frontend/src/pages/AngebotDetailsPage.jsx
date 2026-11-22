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
    getAngebotAnwesenheitStatistik
} from '../services/gruppenAnwesenheitService';

import {
    getTagesAnwesenheitenByDatum
} from '../services/tagesAnwesenheitService';

import {
    getStudents
} from '../services/studentService';

import {
    getToday,
    formatDatum,
    formatTime,
    matchesWochentag
} from '../components/anwesenheit/AnwesenheitUtils';

import './KursDetailsPage.css';
import './AngebotDetailsPage.css';


/* =====================================================
   TABELLENSPALTEN
   ===================================================== */

const STUDENT_COLUMNS = [
    { key: 'nachname', label: 'Nachname' },
    { key: 'vorname', label: 'Vorname' },
    { key: 'jahrgang', label: 'Jahrgang' },
    { key: 'klasse', label: 'Klasse' },
    { key: 'fotoFreigabe', label: 'Fotofreigabe' },
    { key: 'besonderheiten', label: 'Besonderheiten' }
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
   HILFSMETHODEN
   ===================================================== */

const formatValue = value => {

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return '–';
    }

    return value;
};


const timeToMinutes = value => {

    if (typeof value !== 'string') {
        return null;
    }

    const match = value.trim().match(
        /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (!match) {
        return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return hours * 60 + minutes;
};


/* =====================================================
   ANWESENHEITSSTATUS WÄHREND DES ANGEBOTS

   Berücksichtigt beide Abwesenheitsintervalle.
   ===================================================== */

const getAngebotStatus = (anwesenheit, angebot) => {

    const beginn = timeToMinutes(angebot?.beginn);
    const ende = timeToMinutes(angebot?.ende);

    if (
        beginn === null ||
        ende === null ||
        beginn >= ende
    ) {
        return 'ZEITEN_FEHLEN';
    }

    if (!anwesenheit) {
        return 'UNGEPRUEFT';
    }

    if (anwesenheit.status === 'FEHLT') {
        return 'FEHLT';
    }

    const intervalle = [
        {
            ab: anwesenheit.abwesendAb,
            bis: anwesenheit.abwesendBis
        },
        {
            ab: anwesenheit.abwesendAb2,
            bis: anwesenheit.abwesendBis2
        }
    ];

    const ueberschneidungen = [];

    intervalle.forEach(intervall => {

        const ab = timeToMinutes(intervall.ab);
        const bis = timeToMinutes(intervall.bis);

        if (ab === null && bis === null) {
            return;
        }

        const abwesenheitBeginn = ab ?? 0;
        const abwesenheitEnde = bis ?? 1440;

        const start = Math.max(
            beginn,
            abwesenheitBeginn
        );

        const end = Math.min(
            ende,
            abwesenheitEnde
        );

        if (start < end) {
            ueberschneidungen.push([start, end]);
        }
    });

    ueberschneidungen.sort(
        (a, b) => a[0] - b[0]
    );

    let abwesendeMinuten = 0;
    let currentStart = null;
    let currentEnd = null;

    ueberschneidungen.forEach(([start, end]) => {

        if (currentStart === null) {

            currentStart = start;
            currentEnd = end;

            return;
        }

        if (start <= currentEnd) {

            currentEnd = Math.max(
                currentEnd,
                end
            );

        } else {

            abwesendeMinuten +=
                currentEnd - currentStart;

            currentStart = start;
            currentEnd = end;
        }
    });

    if (currentStart !== null) {

        abwesendeMinuten +=
            currentEnd - currentStart;
    }

    const angebotDauer = ende - beginn;

    if (abwesendeMinuten >= angebotDauer) {
        return 'FEHLT';
    }

    if (abwesendeMinuten > 0) {
        return 'TEILWEISE';
    }

    if (anwesenheit.status === 'ANWESEND') {
        return 'ANWESEND';
    }

    return 'UNGEPRUEFT';
};


const STATUS_CONFIG = {

    ANWESEND: {
        label: 'Anwesend',
        className: 'angebot-status-anwesend'
    },

    FEHLT: {
        label: 'Fehlt',
        className: 'angebot-status-fehlend'
    },

    TEILWEISE: {
        label: 'Teilweise abwesend',
        className: 'angebot-status-teilweise'
    },

    UNGEPRUEFT: {
        label: 'Ungeprüft',
        className: 'angebot-status-ungeprueft'
    },

    ZEITEN_FEHLEN: {
        label: 'Zeiten fehlen',
        className: 'angebot-status-ungeprueft'
    }
};


/* =====================================================
   ANGEBOT DETAILS PAGE
   ===================================================== */

function AngebotDetailsPage({ readOnly = false }) {

    const { id } = useParams();
    const navigate = useNavigate();


    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [angebot, setAngebot] = useState(null);

    const [teilnahmen, setTeilnahmen] = useState([]);

    const [allStudents, setAllStudents] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [message, setMessage] = useState('');


    /* =====================================================
       ANWESENHEITSSTATISTIK
       ===================================================== */

    const [statistik, setStatistik] = useState([]);

    const [statistikLoading, setStatistikLoading] =
        useState(true);

    const [statistikError, setStatistikError] =
        useState('');


    /* =====================================================
       TAGESANWESENHEIT
       ===================================================== */

    const [selectedDate, setSelectedDate] =
        useState(getToday);

    const [tagesAnwesenheiten, setTagesAnwesenheiten] =
        useState([]);

    const [attendanceLoading, setAttendanceLoading] =
        useState(true);

    const [attendanceError, setAttendanceError] =
        useState('');

    const [attendanceReload, setAttendanceReload] =
        useState(0);


    /* =====================================================
       FILTER / SORTIERUNG
       ===================================================== */

    const [filter, setFilter] = useState('');

    const [sortKey, setSortKey] =
        useState('nachname');

    const [sortDirection, setSortDirection] =
        useState('asc');


    /* =====================================================
       JAHRGANG
       ===================================================== */

    const [selectedJahrgang, setSelectedJahrgang] =
        useState('');

    const [jahrgangLoading, setJahrgangLoading] =
        useState(false);


    /* =====================================================
       SCHÜLER HINZUFÜGEN
       ===================================================== */

    const [addStudentsOpen, setAddStudentsOpen] =
        useState(false);

    const [addStudentSearch, setAddStudentSearch] =
        useState('');

    // Mehrfachauswahl der Jahrgänge
    const [
        addStudentJahrgaenge,
        setAddStudentJahrgaenge
    ] = useState([]);

    const [selectedStudentIds, setSelectedStudentIds] =
        useState([]);

    const [addStudentsLoading, setAddStudentsLoading] =
        useState(false);


    /* =====================================================
       SCHÜLER ENTFERNEN
       ===================================================== */

    const [deletingTeilnahmeId, setDeletingTeilnahmeId] =
        useState(null);

    const mutationLoading =
        jahrgangLoading ||
        addStudentsLoading ||
        deletingTeilnahmeId !== null;


    /* =====================================================
       STATISTIK LADEN
       ===================================================== */

    const loadStatistik = useCallback(async () => {

        try {

            setStatistikLoading(true);
            setStatistikError('');
            setStatistik([]);

            const data =
                await getAngebotAnwesenheitStatistik(id);

            if (!Array.isArray(data)) {

                throw new Error(
                    'Ungültige Anwesenheitsstatistik.'
                );
            }

            setStatistik(data);

        } catch (err) {

            console.error(
                'Angebotsstatistik konnte nicht geladen werden:',
                err
            );

            const detail =
                err.response?.data?.detail ||
                err.response?.data?.message;

            setStatistikError(
                typeof detail === 'string'
                    ? detail
                    : 'Die Anwesenheitsstatistik konnte nicht geladen werden. Bitte prüfen Sie die Angebotszeiten.'
            );

        } finally {

            setStatistikLoading(false);
        }

    }, [id]);


    /* =====================================================
       GRUNDDATEN LADEN
       ===================================================== */

    const loadData = useCallback(async (
        showLoading = true
    ) => {

        try {

            if (showLoading) {

                setLoading(true);
                setAngebot(null);
                setTeilnahmen([]);
                setStatistik([]);
            }

            setError('');

            const [
                angebotData,
                teilnahmenData,
                studentsData
            ] = await Promise.all([

                getAngebotById(id),

                getTeilnahmenByAngebot(id),

                readOnly
                    ? Promise.resolve([])
                    : getStudents()

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

            await loadStatistik();

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

    }, [
        id,
        readOnly,
        loadStatistik
    ]);


    useEffect(() => {

        setSelectedStudentIds([]);
        setSelectedJahrgang('');
        setAddStudentJahrgaenge([]);
        setMessage('');

        loadData();

    }, [loadData]);


    /* =====================================================
       TAGESANWESENHEIT LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const loadAttendance = async () => {

            setTagesAnwesenheiten([]);
            setAttendanceError('');

            if (!selectedDate) {

                setAttendanceLoading(false);
                return;
            }

            try {

                setAttendanceLoading(true);

                const data =
                    await getTagesAnwesenheitenByDatum(
                        selectedDate
                    );

                if (!active) {
                    return;
                }

                if (!Array.isArray(data)) {

                    throw new Error(
                        'Ungültige Tagesanwesenheiten.'
                    );
                }

                setTagesAnwesenheiten(data);

            } catch (err) {

                if (!active) {
                    return;
                }

                console.error(
                    'Tagesanwesenheit konnte nicht geladen werden:',
                    err
                );

                setAttendanceError(
                    'Die Tagesanwesenheit konnte nicht geladen werden.'
                );

            } finally {

                if (active) {
                    setAttendanceLoading(false);
                }
            }
        };

        loadAttendance();

        return () => {
            active = false;
        };

    }, [
        selectedDate,
        attendanceReload
    ]);


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
       TAGESANWESENHEIT NACH SCHÜLER-ID
       ===================================================== */

    const attendanceByStudent = useMemo(() => {

        const result = new Map();

        tagesAnwesenheiten.forEach(eintrag => {

            if (eintrag.student?.id != null) {

                result.set(
                    String(eintrag.student.id),
                    eintrag
                );
            }
        });

        return result;

    }, [tagesAnwesenheiten]);


    /* =====================================================
       ANGEBOT FINDET AM GEWÄHLTEN TAG STATT
       ===================================================== */

    const angebotFindetStatt = useMemo(() => {

        if (
            !angebot?.wochentag ||
            !selectedDate
        ) {
            return false;
        }

        return matchesWochentag(
            angebot.wochentag,
            selectedDate
        );

    }, [
        angebot,
        selectedDate
    ]);


    /* =====================================================
       TEILNEHMER MIT STATISTIK
       ===================================================== */

    const students = useMemo(() => {

        return teilnahmen

            .filter(teilnahme =>
                teilnahme.student != null
            )

            .map(teilnahme => {

                const student = teilnahme.student;

                const studentStatistik =
                    statistikMap.get(
                        String(student.id)
                    );

                return {

                    ...student,

                    teilnahmeId:
                    teilnahme.id,

                    besonderheiten:
                        teilnahme.besonderheiten ?? '',

                    anzahlAnwesend:
                        studentStatistik?.anzahlAnwesend ?? null,

                    anzahlFehlend:
                        studentStatistik?.anzahlFehlend ?? null,

                    anzahlTeilweiseAbwesend:
                        studentStatistik?.anzahlTeilweiseAbwesend ?? null
                };
            });

    }, [
        teilnahmen,
        statistikMap
    ]);


    /* =====================================================
       GESAMTSTATISTIK
       ===================================================== */

    const gesamtStatistik = useMemo(() => {

        if (
            statistikLoading ||
            statistikError
        ) {

            return {
                anwesend: null,
                fehlend: null,
                teilweise: null
            };
        }

        if (
            students.some(student =>

                student.anzahlAnwesend == null ||

                student.anzahlFehlend == null ||

                student.anzahlTeilweiseAbwesend == null

            )
        ) {

            return {
                anwesend: null,
                fehlend: null,
                teilweise: null
            };
        }

        return students.reduce(

            (result, student) => ({

                anwesend:
                    result.anwesend +
                    Number(student.anzahlAnwesend),

                fehlend:
                    result.fehlend +
                    Number(student.anzahlFehlend),

                teilweise:
                    result.teilweise +
                    Number(student.anzahlTeilweiseAbwesend)

            }),

            {
                anwesend: 0,
                fehlend: 0,
                teilweise: 0
            }
        );

    }, [
        students,
        statistikLoading,
        statistikError
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

        ].sort((a, b) =>
            Number(a) - Number(b)
        );

    }, [allStudents]);


    /* =====================================================
       JAHRGANG ZUORDNEN
       ===================================================== */

    const handleAddJahrgang = async () => {

        if (
            readOnly ||
            mutationLoading ||
            !selectedJahrgang
        ) {
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

            const result =
                await addJahrgangToAngebot(
                    id,
                    selectedJahrgang
                );

            setMessage(
                `${result?.hinzugefuegt ?? 0} Schüler wurden hinzugefügt.`
            );

            setSelectedJahrgang('');
            setSelectedStudentIds([]);

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
       BEREITS ZUGEORDNETE SCHÜLER
       ===================================================== */

    const bookedStudentIds = useMemo(() => {

        return new Set(

            students.map(student =>
                String(student.id)
            )
        );

    }, [students]);


    /* =====================================================
       JAHRGÄNGE MEHRFACHAUSWAHL
       ===================================================== */

    const handleJahrgangSelection = jahrgang => {

        const value = String(jahrgang);

        setAddStudentJahrgaenge(previous =>

            previous.includes(value)

                ? previous.filter(item =>
                    item !== value
                )

                : [...previous, value]
        );
    };


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

                // Mehrere Jahrgänge gleichzeitig filtern
                if (
                    addStudentJahrgaenge.length > 0 &&
                    !addStudentJahrgaenge.includes(
                        String(student.jahrgang)
                    )
                ) {
                    return false;
                }

                if (!search) {
                    return true;
                }

                return [

                    student.nachname,

                    student.vorname,

                    `${student.nachname ?? ''} ${student.vorname ?? ''}`,

                    student.klasse,

                    student.jahrgang

                ].some(value =>

                    String(value ?? '')

                        .toLocaleLowerCase('de')

                        .includes(search)

                );
            })

            .sort((a, b) => {

                const comparison = String(

                    a.nachname ?? ''

                ).localeCompare(

                    String(b.nachname ?? ''),

                    'de'

                );

                if (comparison !== 0) {

                    return comparison;
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

        addStudentJahrgaenge

    ]);


    /* =====================================================
       SCHÜLERAUSWAHL
       ===================================================== */

    const handleStudentSelection = studentId => {

        setSelectedStudentIds(previous =>

            previous.includes(studentId)

                ? previous.filter(id =>
                    id !== studentId
                )

                : [...previous, studentId]

        );
    };


    const handleSelectAllVisible = () => {

        const visibleIds =
            availableStudents.map(
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
       AUSGEWÄHLTE SCHÜLER HINZUFÜGEN
       ===================================================== */

    const handleAddSelectedStudents = async () => {

        if (
            readOnly ||
            mutationLoading ||
            selectedStudentIds.length === 0
        ) {
            return;
        }

        try {

            setAddStudentsLoading(true);
            setError('');
            setMessage('');

            const result =
                await addStudentsToAngebot(
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

        if (
            readOnly ||
            mutationLoading
        ) {
            return;
        }

        const confirmed = window.confirm(

            `Möchten Sie ${student.vorname} ${student.nachname} wirklich aus diesem Angebot entfernen?\n\n` +

            'Die zentrale Tagesanwesenheit des Schülers bleibt erhalten.'

        );

        if (!confirmed) {
            return;
        }

        try {

            setDeletingTeilnahmeId(
                student.teilnahmeId
            );

            setError('');
            setMessage('');

            await deleteAngebotTeilnahme(
                student.teilnahmeId
            );

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
       FILTER
       ===================================================== */

    const filteredStudents = useMemo(() => {

        const search = filter

            .trim()

            .toLocaleLowerCase('de');

        if (!search) {
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

                student.fotoFreigabe,

                student.besonderheiten,

                student.email1,

                student.telefon1,

                student.mobil1,

                student.email2,

                student.telefon2,

                student.mobil2

            ].some(value =>

                String(value ?? '')

                    .toLocaleLowerCase('de')

                    .includes(search)

            )
        );

    }, [
        students,
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

                if (
                    valueA == null &&
                    valueB == null
                ) {
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

            if (
                result === 0 &&
                sortKey === 'nachname'
            ) {

                result = String(

                    a.vorname ?? ''

                ).localeCompare(

                    String(b.vorname ?? ''),

                    'de'

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


    const sortIndicator = key => {

        if (sortKey !== key) {
            return '';
        }

        return sortDirection === 'asc'

            ? ' ▲'

            : ' ▼';
    };


    /* =====================================================
       SCHÜLER ÖFFNEN
       ===================================================== */

    const handleStudentOpen = student => {

        navigate(

            readOnly

                ? `/schuelerinfos/${student.id}`

                : `/students/${student.id}`

        );
    };


    /* =====================================================
       STATISTIKZELLE
       ===================================================== */

    const renderStatistikCell = (student, key) => {

        if (statistikLoading) {

            return (
                <span className="angebot-statistik-muted">
                    ...
                </span>
            );
        }

        const value = student[key];

        if (value == null) {

            return (
                <span className="angebot-statistik-muted">
                    –
                </span>
            );
        }

        const className = {

            anzahlAnwesend:
                'angebot-statistik-anwesend',

            anzahlFehlend:
                'angebot-statistik-fehlend',

            anzahlTeilweiseAbwesend:
                'angebot-statistik-teilweise'

        }[key];

        return (

            <span
                className={
                    `angebot-statistik-badge ${className}`
                }
            >

                {value}

            </span>
        );
    };


    /* =====================================================
       TAGESSTATUS DARSTELLEN
       ===================================================== */

    const renderAttendanceStatus = student => {

        if (
            !selectedDate ||
            !angebotFindetStatt
        ) {

            return (
                <span className="angebot-statistik-muted">
                    –
                </span>
            );
        }

        if (attendanceLoading) {

            return (
                <span className="angebot-statistik-muted">
                    ...
                </span>
            );
        }

        if (attendanceError) {

            return (
                <span className="angebot-statistik-muted">
                    –
                </span>
            );
        }

        const anwesenheit =
            attendanceByStudent.get(
                String(student.id)
            );

        const status = getAngebotStatus(
            anwesenheit,
            angebot
        );

        const config = STATUS_CONFIG[status];

        return (

            <span
                className={
                    `angebot-tagesstatus ${config.className}`
                }
            >

                {config.label}

            </span>
        );
    };


    /* =====================================================
       TAGESANWESENHEIT FELD
       ===================================================== */

    const getAttendanceField = (
        student,
        field
    ) => {

        if (

            !angebotFindetStatt ||

            attendanceLoading ||

            attendanceError

        ) {
            return '–';
        }

        const anwesenheit =
            attendanceByStudent.get(
                String(student.id)
            );

        const value = anwesenheit?.[field];

        if (
            field === 'abwesendAb' ||
            field === 'abwesendBis' ||
            field === 'abwesendAb2' ||
            field === 'abwesendBis2'
        ) {

            return value

                ? formatTime(value)

                : '–';
        }

        return formatValue(value);
    };


    /* =====================================================
       TABELLENSPALTEN
       ===================================================== */

    const columnCount =

        STUDENT_COLUMNS.length +

        STATISTIK_COLUMNS.length +

        CONTACT_COLUMNS.length +

        5 +

        (readOnly ? 0 : 1);


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


            {/* =========================================
                ZURÜCK
               ========================================= */}

            <button
                type="button"
                className="angebot-back-button"
                onClick={() =>

                    navigate(

                        readOnly

                            ? '/angebotinfos'

                            : '/angebote'

                    )

                }
            >

                <span aria-hidden="true">←</span>

                Zurück zu den Angeboten

            </button>


            {/* =========================================
                HEADER
               ========================================= */}

            <header className="page-header">

                <div className="page-header-content">

                    <h1>{angebot.name}</h1>

                    <p>

                        {angebot.wochentag || '–'}

                        {angebot.beginn
                            ? ` · ${angebot.beginn}`
                            : ''}

                        {angebot.ende
                            ? ` – ${angebot.ende}`
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


            {/* =========================================
                FEHLER UND ERFOLG
               ========================================= */}

            {error && (

                <div
                    className="kurs-details-error-box"
                    role="alert"
                >

                    {error}

                </div>

            )}


            {message && (

                <div className="kurs-jahrgang-message angebot-message">

                    {message}

                </div>

            )}


            {/* =========================================
                ANGEBOTSINFORMATIONEN
               ========================================= */}

            <section className="kurs-details-info angebot-info">

                <div>

                    <span>Angebotsart</span>

                    <strong>
                        {formatValue(angebot.angebotsart)}
                    </strong>

                </div>

                <div>

                    <span>Wochentag</span>

                    <strong>
                        {formatValue(angebot.wochentag)}
                    </strong>

                </div>

                <div>

                    <span>Beginn</span>

                    <strong>
                        {formatValue(angebot.beginn)}
                    </strong>

                </div>

                <div>

                    <span>Ende</span>

                    <strong>
                        {formatValue(angebot.ende)}
                    </strong>

                </div>

                <div>

                    <span>Angebotsleitung</span>

                    <strong>
                        {formatValue(angebot.angebotsleitung)}
                    </strong>

                </div>

            </section>


            {/* =========================================
                GESAMTSTATISTIK
               ========================================= */}

            <section className="angebot-statistik">

                <div>

                    <span>Anwesend</span>

                    <strong className="angebot-statistik-text-anwesend">

                        {statistikLoading

                            ? '...'

                            : gesamtStatistik.anwesend ?? '–'}

                    </strong>

                </div>

                <div>

                    <span>Fehlend</span>

                    <strong className="angebot-statistik-text-fehlend">

                        {statistikLoading

                            ? '...'

                            : gesamtStatistik.fehlend ?? '–'}

                    </strong>

                </div>

                <div>

                    <span>Teilweise abwesend</span>

                    <strong className="angebot-statistik-text-teilweise">

                        {statistikLoading

                            ? '...'

                            : gesamtStatistik.teilweise ?? '–'}

                    </strong>

                </div>

            </section>


            <div className="angebot-statistik-hinweis">

                Die Statistik zeigt die Summe der erfassten
                Teilnahmen aller aktuell zugeordneten Schüler.
                Berücksichtigt werden der Wochentag sowie
                Beginn und Ende des Angebots.

            </div>


            {statistikError && (

                <div
                    className="angebot-attendance-error"
                    role="alert"
                >

                    {statistikError}

                </div>

            )}


            {/* =========================================
                JAHRGANG HINZUFÜGEN
               ========================================= */}

            {!readOnly && (

                <section className="kurs-jahrgang-section">

                    <div className="kurs-jahrgang-header">

                        <div>

                            <h2>Jahrgang zuordnen</h2>

                            <p>

                                Alle Schüler eines Jahrgangs
                                diesem Angebot zuordnen.

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
                                disabled={mutationLoading}
                                onChange={event =>

                                    setSelectedJahrgang(
                                        event.target.value
                                    )

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
                                mutationLoading
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


            {/* =========================================
                SCHÜLER HINZUFÜGEN
               ========================================= */}

            {!readOnly && (

                <section className="kurs-add-students-section">

                    <button
                        type="button"
                        className="kurs-add-students-toggle"
                        onClick={() =>

                            setAddStudentsOpen(
                                previous => !previous
                            )

                        }
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


                            <div className="kurs-add-students-filter">

                                <div className="kurs-add-students-field">

                                    <label htmlFor="angebot-student-search">

                                        Suche

                                    </label>

                                    <input
                                        id="angebot-student-search"
                                        type="text"
                                        placeholder="Name, Klasse oder Jahrgang..."
                                        value={addStudentSearch}
                                        disabled={mutationLoading}
                                        onChange={event =>

                                            setAddStudentSearch(
                                                event.target.value
                                            )

                                        }
                                    />

                                </div>


                                {/* MEHRFACHAUSWAHL JAHRGÄNGE */}

                                <div className="kurs-add-students-field">

                                    <span className="jahrgang-filter-title">
                                        Jahrgänge filtern
                                    </span>

                                    <div className="jahrgang-multiselect">

                                        {jahrgaenge.map(jahrgang => (

                                            <label
                                                key={jahrgang}
                                                className="jahrgang-checkbox-label"
                                            >

                                                <input
                                                    type="checkbox"
                                                    disabled={mutationLoading}
                                                    checked={
                                                        addStudentJahrgaenge.includes(
                                                            String(jahrgang)
                                                        )
                                                    }
                                                    onChange={() =>
                                                        handleJahrgangSelection(
                                                            jahrgang
                                                        )
                                                    }
                                                />

                                                <span>
                                                    {jahrgang}
                                                </span>

                                            </label>

                                        ))}

                                    </div>

                                    <button
                                        type="button"
                                        className="jahrgang-reset-button"
                                        disabled={
                                            mutationLoading ||
                                            addStudentJahrgaenge.length === 0
                                        }
                                        onClick={() =>
                                            setAddStudentJahrgaenge([])
                                        }
                                    >
                                        Auswahl zurücksetzen
                                    </button>

                                </div>

                            </div>


                            <div className="kurs-add-students-list-header">

                                <label>

                                    <input
                                        type="checkbox"
                                        disabled={mutationLoading}
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
                                                disabled={mutationLoading}
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


                            <div className="kurs-add-students-actions">

                                <span>

                                    {selectedStudentIds.length} ausgewählt

                                </span>

                                <button
                                    type="button"
                                    className="kurs-add-students-button"
                                    disabled={

                                        selectedStudentIds.length === 0 ||

                                        mutationLoading

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


            {/* =========================================
                TAGESANWESENHEIT
               ========================================= */}

            <section className="angebot-datum-section">

                <div>

                    <h2>

                        Anwesenheit ansehen

                    </h2>

                    <p>

                        Die Anwesenheit wird aus der zentralen
                        Tagesanwesenheit übernommen und für
                        die Dauer dieses Angebots ausgewertet.

                    </p>

                </div>


                <div className="angebot-datum-actions">

                    <div className="angebot-datum-field">

                        <label htmlFor="angebot-datum">

                            Datum

                        </label>

                        <input
                            id="angebot-datum"
                            type="date"
                            value={selectedDate}
                            onChange={event =>

                                setSelectedDate(
                                    event.target.value
                                )

                            }
                        />

                    </div>


                    <button
                        type="button"
                        className="angebot-refresh-button"
                        disabled={
                            attendanceLoading ||
                            statistikLoading ||
                            mutationLoading ||
                            !selectedDate
                        }
                        onClick={() => {

                            setAttendanceReload(
                                previous => previous + 1
                            );

                            loadStatistik();
                        }}
                    >

                        Aktualisieren

                    </button>


                    <button
                        type="button"
                        className="angebot-attendance-button"
                        onClick={() =>

                            navigate('/anwesenheit')

                        }
                    >

                        Zur Anwesenheitserfassung

                    </button>

                </div>

            </section>


            {/* =========================================
                HINWEISE
               ========================================= */}

            {!selectedDate && (

                <div className="angebot-attendance-hinweis">

                    Bitte wählen Sie ein Datum aus.

                </div>

            )}


            {selectedDate && !angebotFindetStatt && (

                <div className="angebot-attendance-hinweis">

                    Dieses Angebot findet am gewählten
                    Datum nicht statt.

                    Regulärer Wochentag:{' '}

                    <strong>

                        {angebot.wochentag || '–'}

                    </strong>

                </div>

            )}


            {attendanceError && (

                <div
                    className="angebot-attendance-error"
                    role="alert"
                >

                    {attendanceError}

                </div>

            )}


            {/* =========================================
                TEILNEHMERLISTE
               ========================================= */}

            <section className="kurs-details-content">

                <div className="kurs-details-toolbar">

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


                <div className="kurs-details-table-scroll">

                    <table className="kurs-details-table angebot-student-table">

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


                            {/* STATISTIK */}

                            {STATISTIK_COLUMNS.map(column => (

                                <th
                                    key={column.key}
                                    className="angebot-statistik-column"
                                    onClick={() =>

                                        handleSort(column.key)

                                    }
                                >

                                    {column.label}

                                    {sortIndicator(column.key)}

                                </th>

                            ))}


                            {/* TAGESANWESENHEIT */}

                            <th>

                                Status am{' '}

                                {selectedDate

                                    ? formatDatum(selectedDate)

                                    : '–'}

                            </th>

                            <th>Abwesend ab</th>

                            <th>Abwesend bis</th>

                            <th>Grund Abwesenheit</th>

                            <th>Bemerkung</th>


                            {/* KONTAKTDATEN */}

                            {CONTACT_COLUMNS.map(column => (

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


                            {!readOnly && (

                                <th>Aktionen</th>

                            )}

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

                                <tr key={student.teilnahmeId}>


                                    {/* SCHÜLERDATEN */}

                                    {STUDENT_COLUMNS.map(column => (

                                        <td key={column.key}>

                                            {column.key === 'nachname' ? (

                                                <button
                                                    type="button"
                                                    className="angebot-student-link"
                                                    onClick={() =>

                                                        handleStudentOpen(
                                                            student
                                                        )

                                                    }
                                                >

                                                    {formatValue(
                                                        student.nachname
                                                    )}

                                                </button>

                                            ) : (

                                                formatValue(
                                                    student[column.key]
                                                )

                                            )}

                                        </td>

                                    ))}


                                    {/* STATISTIK */}

                                    {STATISTIK_COLUMNS.map(column => (

                                        <td
                                            key={column.key}
                                            className="angebot-statistik-cell"
                                        >

                                            {renderStatistikCell(

                                                student,

                                                column.key

                                            )}

                                        </td>

                                    ))}


                                    {/* TAGESSTATUS */}

                                    <td>

                                        {renderAttendanceStatus(student)}

                                    </td>


                                    {/* ABWESEND AB */}

                                    <td>

                                        {getAttendanceField(

                                            student,

                                            'abwesendAb'

                                        )}

                                    </td>


                                    {/* ABWESEND BIS */}

                                    <td>

                                        {getAttendanceField(

                                            student,

                                            'abwesendBis'

                                        )}

                                    </td>


                                    {/* GRUND */}

                                    <td className="angebot-attendance-text">

                                        {getAttendanceField(

                                            student,

                                            'grundAbwesenheit'

                                        )}

                                    </td>


                                    {/* BEMERKUNG */}

                                    <td className="angebot-attendance-text">

                                        {getAttendanceField(

                                            student,

                                            'bemerkung'

                                        )}

                                    </td>


                                    {/* KONTAKTDATEN */}

                                    {CONTACT_COLUMNS.map(column => (

                                        <td key={column.key}>

                                            {formatValue(
                                                student[column.key]
                                            )}

                                        </td>

                                    ))}


                                    {/* AKTIONEN */}

                                    {!readOnly && (

                                        <td>

                                            <button
                                                type="button"
                                                className="angebot-remove-button"
                                                disabled={mutationLoading}
                                                onClick={() =>

                                                    handleRemoveStudent(
                                                        student
                                                    )

                                                }
                                            >

                                                {deletingTeilnahmeId ===
                                                student.teilnahmeId

                                                    ? 'Wird entfernt...'

                                                    : 'Entfernen'}

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