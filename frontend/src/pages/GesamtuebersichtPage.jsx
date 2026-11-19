import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import StudentTable from '../components/StudentTable';

import {
    getStudents,
    createStudent,
    updateStudent,
    deleteStudent
} from '../services/studentService';

import {
    getTagesAnwesenheitenByZeitraum
} from '../services/tagesAnwesenheitService';

import './GesamtuebersichtPage.css';


/* =====================================================
   LEERER SCHÜLER
   ===================================================== */

const emptyStudent = {

    vorname: '',
    nachname: '',
    jahrgang: '',
    klasse: '',
    fotoFreigabe: '',

    email1: '',
    telefon1: '',
    mobil1: '',

    email2: '',
    telefon2: '',
    mobil2: '',

    gehtUm1530: false
};


/* =====================================================
   LEERE ANWESENHEITSSTATISTIK
   ===================================================== */

const emptyStatistik = {

    anzahlAnwesend: 0,

    anzahlFehlend: 0,

    anzahlTeilweiseAbwesend: 0,

    anzahlUngeprueft: 0
};


/* =====================================================
   STATISTIK NICHT VERFÜGBAR
   ===================================================== */

const unavailableStatistik = {

    anzahlAnwesend: null,

    anzahlFehlend: null,

    anzahlTeilweiseAbwesend: null,

    anzahlUngeprueft: null
};


/* =====================================================
   STATISTIKFELDER
   ===================================================== */

const STATISTIK_FIELDS = [

    'anzahlAnwesend',

    'anzahlFehlend',

    'anzahlTeilweiseAbwesend',

    'anzahlUngeprueft'
];


/* =====================================================
   HEUTIGES DATUM
   ===================================================== */

function getToday() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        now.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


/* =====================================================
   TAGESANWESENHEITEN AUSWERTEN

   Jeder gespeicherte Tag wird genau einer
   Statuskategorie zugeordnet.
   ===================================================== */

function calculateStatistik(anwesenheiten) {

    const statistikMap = new Map();

    anwesenheiten.forEach((anwesenheit) => {

        const studentId =
            anwesenheit.student?.id ??
            anwesenheit.studentId;

        if (studentId == null) {

            return;
        }

        const key = String(studentId);

        if (!statistikMap.has(key)) {

            statistikMap.set(key, {
                ...emptyStatistik
            });
        }

        const statistik =
            statistikMap.get(key);

        if (anwesenheit.status === 'FEHLT') {

            statistik.anzahlFehlend++;

        } else if (
            anwesenheit.abwesendAb ||
            anwesenheit.abwesendBis
        ) {

            statistik.anzahlTeilweiseAbwesend++;

        } else if (
            anwesenheit.status === 'ANWESEND'
        ) {

            statistik.anzahlAnwesend++;

        } else {

            statistik.anzahlUngeprueft++;
        }
    });

    return statistikMap;
}


/* =====================================================
   SCHÜLERDATEN FÜR BACKEND VORBEREITEN

   Nur tatsächliche Schülerfelder werden übertragen.
   Statistiken bleiben ausschließlich im Frontend.
   ===================================================== */

function createStudentPayload(student) {

    return {

        vorname: student.vorname ?? '',

        nachname: student.nachname ?? '',

        jahrgang:
            student.jahrgang === '' ||
            student.jahrgang == null

                ? null

                : Number(student.jahrgang),

        klasse: student.klasse ?? '',

        fotoFreigabe:
            student.fotoFreigabe ?? '',

        email1: student.email1 ?? '',

        telefon1: student.telefon1 ?? '',

        mobil1: student.mobil1 ?? '',

        email2: student.email2 ?? '',

        telefon2: student.telefon2 ?? '',

        mobil2: student.mobil2 ?? '',

        gehtUm1530:
            student.gehtUm1530 ?? false
    };
}


/* =====================================================
   GESAMTÜBERSICHT PAGE
   ===================================================== */

function GesamtuebersichtPage() {

    const [students, setStudents] =
        useState([]);


    /* =================================================
       FILTER
       ================================================= */

    const [filter, setFilter] =
        useState('');

    const [nachnameFilter, setNachnameFilter] =
        useState('');

    const [vornameFilter, setVornameFilter] =
        useState('');

    const [jahrgangFilter, setJahrgangFilter] =
        useState('');

    const [fotoFilter, setFotoFilter] =
        useState('');


    /* =================================================
       SORTIERUNG
       ================================================= */

    const [sortKey, setSortKey] =
        useState(null);

    const [sortDirection, setSortDirection] =
        useState('asc');


    /* =================================================
       BEARBEITUNG
       ================================================= */

    const [editingId, setEditingId] =
        useState(null);

    const [editData, setEditData] =
        useState({});

    const [saving, setSaving] =
        useState(false);


    /* =================================================
       STATUS
       ================================================= */

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [statistikError, setStatistikError] =
        useState('');


    /* =====================================================
       SCHÜLER UND TAGESANWESENHEITEN LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const loadStudents = async () => {

            try {

                setLoading(true);

                setError('');

                setStatistikError('');


                /* =========================================
                   ZWEI API-ANFRAGEN

                   1. Alle Schüler
                   2. Alle Tagesanwesenheiten bis heute
                   ========================================= */

                const [
                    studentResult,
                    anwesenheitResult
                ] = await Promise.allSettled([

                    getStudents(),

                    getTagesAnwesenheitenByZeitraum(
                        '2000-01-01',
                        getToday()
                    )

                ]);

                if (!active) {

                    return;
                }


                /* =========================================
                   SCHÜLER PRÜFEN
                   ========================================= */

                if (
                    studentResult.status === 'rejected'
                ) {

                    throw studentResult.reason;
                }

                const studentList =
                    Array.isArray(studentResult.value)

                        ? studentResult.value

                        : [];


                /* =========================================
                   ANWESENHEITEN PRÜFEN
                   ========================================= */

                if (
                    anwesenheitResult.status === 'rejected' ||
                    !Array.isArray(anwesenheitResult.value)
                ) {

                    setStatistikError(

                        'Die Anwesenheitsstatistiken konnten nicht geladen werden.'

                    );

                    setStudents(

                        studentList.map((student) => ({

                            ...student,

                            ...unavailableStatistik

                        }))
                    );

                    return;
                }


                /* =========================================
                   STATISTIK BERECHNEN
                   ========================================= */

                const statistikMap =
                    calculateStatistik(
                        anwesenheitResult.value
                    );

                const studentsWithStats =
                    studentList.map((student) => ({

                        ...student,

                        ...(

                            statistikMap.get(
                                String(student.id)
                            ) ?? emptyStatistik

                        )

                    }));

                setStudents(studentsWithStats);

            } catch (error) {

                console.error(
                    'Fehler beim Laden der Schüler:',
                    error
                );

                if (active) {

                    setError(
                        'Die Schülerdaten konnten nicht geladen werden.'
                    );
                }

            } finally {

                if (active) {

                    setLoading(false);
                }
            }
        };

        loadStudents();

        return () => {

            active = false;
        };

    }, []);


    /* =====================================================
       VERFÜGBARE JAHRGÄNGE
       ===================================================== */

    const jahrgaenge = useMemo(() => {

        return [

            ...new Set(

                students

                    .map((student) =>
                        student.jahrgang
                    )

                    .filter((jahrgang) =>

                        jahrgang !== null &&

                        jahrgang !== undefined &&

                        jahrgang !== ''

                    )

            )

        ].sort(
            (a, b) => Number(a) - Number(b)
        );

    }, [students]);


    /* =====================================================
       VERFÜGBARE FOTOFREIGABEN
       ===================================================== */

    const fotoFreigaben = useMemo(() => {

        return [

            ...new Set(

                students

                    .map((student) =>
                        student.fotoFreigabe
                    )

                    .filter((value) =>

                        value !== null &&

                        value !== undefined &&

                        String(value).trim() !== ''

                    )

            )

        ].sort((a, b) =>

            String(a).localeCompare(
                String(b),
                'de'
            )
        );

    }, [students]);


    /* =====================================================
       SCHÜLER FILTERN
       ===================================================== */

    const filtered = useMemo(() => {

        const generalTerm =
            filter.trim().toLowerCase();

        const nachnameTerm =
            nachnameFilter.trim().toLowerCase();

        const vornameTerm =
            vornameFilter.trim().toLowerCase();

        return students.filter((student) => {

            /*
             * Der aktuell bearbeitete Schüler
             * bleibt auch bei aktiven Filtern sichtbar.
             */

            if (student.id === editingId) {

                return true;
            }


            const matchesGeneral =

                !generalTerm ||

                [

                    student.vorname,

                    student.nachname,

                    student.klasse,

                    student.fotoFreigabe,

                    student.email1,

                    student.telefon1,

                    student.mobil1,

                    student.email2,

                    student.telefon2,

                    student.mobil2,

                    student.jahrgang

                ].some((value) =>

                    String(value ?? '')

                        .toLowerCase()

                        .includes(generalTerm)

                );


            const matchesNachname =

                !nachnameTerm ||

                String(student.nachname ?? '')

                    .toLowerCase()

                    .includes(nachnameTerm);


            const matchesVorname =

                !vornameTerm ||

                String(student.vorname ?? '')

                    .toLowerCase()

                    .includes(vornameTerm);


            const matchesJahrgang =

                !jahrgangFilter ||

                String(student.jahrgang ?? '') ===
                String(jahrgangFilter);


            const matchesFoto =

                !fotoFilter ||

                String(student.fotoFreigabe ?? '') ===
                String(fotoFilter);


            return (

                matchesGeneral &&

                matchesNachname &&

                matchesVorname &&

                matchesJahrgang &&

                matchesFoto
            );

        });

    }, [

        students,

        filter,

        nachnameFilter,

        vornameFilter,

        jahrgangFilter,

        fotoFilter,

        editingId

    ]);


    /* =====================================================
       SCHÜLER SORTIEREN
       ===================================================== */

    const sorted = useMemo(() => {

        return [...filtered].sort((a, b) => {

            if (!sortKey) {

                return 0;
            }

            const valA = a[sortKey];

            const valB = b[sortKey];


            /* Fehlende Werte immer zuletzt anzeigen */

            if (valA == null && valB == null) {

                return 0;
            }

            if (valA == null) {

                return 1;
            }

            if (valB == null) {

                return -1;
            }


            /* =========================================
               NUMERISCHE SORTIERUNG
               ========================================= */

            if (

                sortKey === 'jahrgang' ||

                STATISTIK_FIELDS.includes(sortKey)

            ) {

                const numberA =
                    Number(valA) || 0;

                const numberB =
                    Number(valB) || 0;

                return sortDirection === 'asc'

                    ? numberA - numberB

                    : numberB - numberA;
            }


            /* =========================================
               TEXT SORTIEREN
               ========================================= */

            const strA =
                String(valA ?? '').toLowerCase();

            const strB =
                String(valB ?? '').toLowerCase();

            return sortDirection === 'asc'

                ? strA.localeCompare(strB, 'de')

                : strB.localeCompare(strA, 'de');

        });

    }, [

        filtered,

        sortKey,

        sortDirection

    ]);


    /* =====================================================
       SORTIERUNG ÄNDERN
       ===================================================== */

    const handleSort = (key) => {

        if (sortKey === key) {

            setSortDirection((direction) =>

                direction === 'asc'

                    ? 'desc'

                    : 'asc'

            );

        } else {

            setSortKey(key);

            setSortDirection('asc');
        }
    };


    /* =====================================================
       SCHÜLER BEARBEITEN
       ===================================================== */

    const handleEditStart = (student) => {

        if (saving) {

            return;
        }

        if (
            editingId !== null &&
            editingId !== student.id
        ) {

            setError(

                'Bitte speichern oder verwerfen Sie zuerst die aktuelle Bearbeitung.'

            );

            return;
        }

        setError('');

        setEditingId(student.id);

        setEditData({
            ...student
        });
    };


    /* =====================================================
       FELD AKTUALISIEREN
       ===================================================== */

    const handleEditChange = (key, value) => {

        if (saving) {

            return;
        }

        setEditData((previous) => ({

            ...previous,

            [key]: value

        }));
    };


    /* =====================================================
       SCHÜLER SPEICHERN
       ===================================================== */

    const handleEditSave = async () => {

        if (saving || editingId === null) {

            return;
        }

        try {

            setSaving(true);

            setError('');

            const payload =
                createStudentPayload(editData);

            let savedStudent;


            /* =========================================
               BESTEHENDEN SCHÜLER AKTUALISIEREN
               ========================================= */

            if (typeof editingId === 'number') {

                savedStudent =
                    await updateStudent(

                        editingId,

                        payload

                    );

            } else {

                /* =====================================
                   NEUEN SCHÜLER ERSTELLEN
                   ===================================== */

                savedStudent =
                    await createStudent(payload);
            }


            /* =========================================
               STATISTIKEN BEIBEHALTEN

               Die Aktualisierung der Schülerdaten
               verändert keine Anwesenheitsdaten.
               ========================================= */

            setStudents((previous) =>

                previous.map((student) => {

                    if (student.id !== editingId) {

                        return student;
                    }

                    return {

                        ...student,

                        ...savedStudent,

                        anzahlAnwesend:
                        student.anzahlAnwesend,

                        anzahlFehlend:
                        student.anzahlFehlend,

                        anzahlTeilweiseAbwesend:
                        student.anzahlTeilweiseAbwesend,

                        anzahlUngeprueft:
                        student.anzahlUngeprueft
                    };
                })

            );

            setEditingId(null);

            setEditData({});

        } catch (error) {

            console.error(
                'Fehler beim Speichern:',
                error
            );

            setError(
                'Der Schüler konnte nicht gespeichert werden.'
            );

        } finally {

            setSaving(false);
        }
    };


    /* =====================================================
       BEARBEITUNG ABBRECHEN
       ===================================================== */

    const handleEditCancel = () => {

        if (saving) {

            return;
        }

        if (typeof editingId !== 'number') {

            setStudents((previous) =>

                previous.filter(

                    (student) =>
                        student.id !== editingId

                )

            );
        }

        setEditingId(null);

        setEditData({});

        setError('');
    };


    /* =====================================================
       NEUEN SCHÜLER HINZUFÜGEN
       ===================================================== */

    const handleAdd = () => {

        if (
            editingId !== null ||
            saving
        ) {

            return;
        }

        const tempId =
            `new-${Date.now()}`;

        const newStudent = {

            ...emptyStudent,

            ...emptyStatistik,

            id: tempId
        };

        setStudents((previous) => [

            newStudent,

            ...previous

        ]);

        setEditingId(tempId);

        setEditData(newStudent);

        setError('');
    };


    /* =====================================================
       SCHÜLER LÖSCHEN
       ===================================================== */

    const handleDelete = async (id) => {

        if (saving) {

            return;
        }

        const confirmed = window.confirm(

            'Möchten Sie diesen Schüler wirklich löschen?'

        );

        if (!confirmed) {

            return;
        }

        try {

            setSaving(true);

            setError('');

            if (typeof id === 'number') {

                await deleteStudent(id);
            }

            setStudents((previous) =>

                previous.filter(

                    (student) => student.id !== id

                )

            );

            if (editingId === id) {

                setEditingId(null);

                setEditData({});
            }

        } catch (error) {

            console.error(
                'Fehler beim Löschen:',
                error
            );

            setError(
                'Der Schüler konnte nicht gelöscht werden.'
            );

        } finally {

            setSaving(false);
        }
    };


    /* =====================================================
       FILTER ZURÜCKSETZEN
       ===================================================== */

    const resetFilters = () => {

        setFilter('');

        setNachnameFilter('');

        setVornameFilter('');

        setJahrgangFilter('');

        setFotoFilter('');
    };


    const hasActiveFilters = Boolean(

        filter ||

        nachnameFilter ||

        vornameFilter ||

        jahrgangFilter ||

        fotoFilter
    );


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="gesamtuebersicht-page">

            {/* HEADER */}

            <header className="page-header">

                <div className="page-header-content">

                    <h1>

                        Gesamtübersicht

                    </h1>

                    <p>

                        Schülerdaten, Kontaktdaten und
                        Tagesanwesenheitsstatistiken verwalten

                    </p>

                </div>

                <div className="gesamtuebersicht-count">

                    {students.length} Schüler

                </div>

            </header>


            {/* FEHLERMELDUNGEN */}

            {error && (

                <div
                    className="gesamtuebersicht-error"
                    role="alert"
                >

                    {error}

                </div>

            )}


            {statistikError && (

                <div
                    className="gesamtuebersicht-error"
                    role="alert"
                >

                    {statistikError}

                </div>

            )}


            {/* FILTER */}

            <section className="gesamtuebersicht-filter-section">

                <div className="gesamtuebersicht-filter-header">

                    <div>

                        <h2>

                            Filter

                        </h2>

                        <p>

                            Schüler nach Name,
                            Vorname, Jahrgang oder
                            Fotofreigabe filtern

                        </p>

                    </div>

                    {hasActiveFilters && (

                        <button
                            type="button"
                            className="gesamtuebersicht-reset-button"
                            onClick={resetFilters}
                        >

                            Filter zurücksetzen

                        </button>

                    )}

                </div>


                <div className="gesamtuebersicht-filter-grid">

                    {/* ALLGEMEINE SUCHE */}

                    <div className="gesamtuebersicht-filter-field gesamtuebersicht-filter-field-wide">

                        <label htmlFor="allgemeine-suche">

                            Allgemeine Suche

                        </label>

                        <input
                            id="allgemeine-suche"
                            type="text"
                            placeholder="Klasse, E-Mail, Telefon..."
                            value={filter}
                            onChange={(event) =>

                                setFilter(
                                    event.target.value
                                )

                            }
                        />

                    </div>


                    {/* NACHNAME */}

                    <div className="gesamtuebersicht-filter-field">

                        <label htmlFor="nachname-filter">

                            Nachname

                        </label>

                        <input
                            id="nachname-filter"
                            type="text"
                            placeholder="Nachname..."
                            value={nachnameFilter}
                            onChange={(event) =>

                                setNachnameFilter(
                                    event.target.value
                                )

                            }
                        />

                    </div>


                    {/* VORNAME */}

                    <div className="gesamtuebersicht-filter-field">

                        <label htmlFor="vorname-filter">

                            Vorname

                        </label>

                        <input
                            id="vorname-filter"
                            type="text"
                            placeholder="Vorname..."
                            value={vornameFilter}
                            onChange={(event) =>

                                setVornameFilter(
                                    event.target.value
                                )

                            }
                        />

                    </div>


                    {/* JAHRGANG */}

                    <div className="gesamtuebersicht-filter-field">

                        <label htmlFor="jahrgang-filter">

                            Jahrgang

                        </label>

                        <select
                            id="jahrgang-filter"
                            value={jahrgangFilter}
                            onChange={(event) =>

                                setJahrgangFilter(
                                    event.target.value
                                )

                            }
                        >

                            <option value="">

                                Alle Jahrgänge

                            </option>

                            {jahrgaenge.map((jahrgang) => (

                                <option
                                    key={jahrgang}
                                    value={jahrgang}
                                >

                                    {jahrgang}

                                </option>

                            ))}

                        </select>

                    </div>


                    {/* FOTOFREIGABE */}

                    <div className="gesamtuebersicht-filter-field">

                        <label htmlFor="foto-filter">

                            Fotofreigabe

                        </label>

                        <select
                            id="foto-filter"
                            value={fotoFilter}
                            onChange={(event) =>

                                setFotoFilter(
                                    event.target.value
                                )

                            }
                        >

                            <option value="">

                                Alle Freigaben

                            </option>

                            {fotoFreigaben.map((freigabe) => (

                                <option
                                    key={freigabe}
                                    value={freigabe}
                                >

                                    {freigabe}

                                </option>

                            ))}

                        </select>

                    </div>

                </div>

            </section>


            {/* TOOLBAR */}

            <div className="gesamtuebersicht-toolbar">

                <div className="gesamtuebersicht-result-count">

                    {sorted.length} Schüler gefunden

                </div>

                <button
                    type="button"
                    className="gesamtuebersicht-add-button"
                    onClick={handleAdd}
                    disabled={
                        editingId !== null ||
                        saving ||
                        loading
                    }
                >

                    + Neuer Eintrag

                </button>

            </div>


            {/* SCHÜLERTABELLE */}

            {loading ? (

                <div className="gesamtuebersicht-loading">

                    Schülerdaten werden geladen...

                </div>

            ) : (

                <StudentTable

                    students={sorted}

                    sortKey={sortKey}

                    sortDirection={sortDirection}

                    onSort={handleSort}

                    editingId={editingId}

                    editData={editData}

                    onEditStart={handleEditStart}

                    onEditChange={handleEditChange}

                    onEditSave={handleEditSave}

                    onEditCancel={handleEditCancel}

                    onDelete={handleDelete}

                />

            )}

        </div>
    );
}

export default GesamtuebersichtPage;