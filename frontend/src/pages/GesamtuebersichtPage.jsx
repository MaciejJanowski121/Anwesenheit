import React, { useEffect, useMemo, useState } from 'react';
import StudentTable from '../components/StudentTable';

import {
    getStudents,
    createStudent,
    updateStudent,
    deleteStudent
} from '../services/studentService';

import {
    getAnwesenheitStatistikByStudent
} from '../services/anwesenheitService';

import './GesamtuebersichtPage.css';

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
    mobil2: ''
};

function GesamtuebersichtPage() {
    const [students, setStudents] = useState([]);

    // Allgemeine Suche
    const [filter, setFilter] = useState('');

    // Zusätzliche Filter
    const [nachnameFilter, setNachnameFilter] = useState('');
    const [vornameFilter, setVornameFilter] = useState('');
    const [jahrgangFilter, setJahrgangFilter] = useState('');
    const [fotoFilter, setFotoFilter] = useState('');

    const [sortKey, setSortKey] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await getStudents();

            const studentList = Array.isArray(data)
                ? data
                : [];

            const studentsWithStats = await Promise.all(
                studentList.map(async (student) => {
                    try {
                        const statistik =
                            await getAnwesenheitStatistikByStudent(
                                student.id
                            );

                        return {
                            ...student,
                            anzahlAnwesend:
                                statistik.anzahlAnwesend ?? 0,
                            anzahlEntschuldigt:
                                statistik.anzahlEntschuldigt ?? 0,
                            anzahlFehlend:
                                statistik.anzahlFehlend ?? 0
                        };
                    } catch (error) {
                        console.error(
                            `Statistik für Schüler ${student.id} konnte nicht geladen werden:`,
                            error
                        );

                        return {
                            ...student,
                            anzahlAnwesend: 0,
                            anzahlEntschuldigt: 0,
                            anzahlFehlend: 0
                        };
                    }
                })
            );

            setStudents(studentsWithStats);

        } catch (error) {
            console.error(
                'Fehler beim Laden der Schüler:',
                error
            );

            setError(
                'Die Schülerdaten konnten nicht geladen werden.'
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * Verfügbare Jahrgänge automatisch aus den Schülerdaten erzeugen.
     */
    const jahrgaenge = useMemo(() => {
        return [
            ...new Set(
                students
                    .map((student) => student.jahrgang)
                    .filter(
                        (jahrgang) =>
                            jahrgang !== null &&
                            jahrgang !== undefined &&
                            jahrgang !== ''
                    )
            )
        ].sort((a, b) => Number(a) - Number(b));
    }, [students]);

    /*
     * Verfügbare Werte für die Fotofreigabe automatisch
     * aus den vorhandenen Schülerdaten erzeugen.
     */
    const fotoFreigaben = useMemo(() => {
        return [
            ...new Set(
                students
                    .map((student) => student.fotoFreigabe)
                    .filter(
                        (value) =>
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

    const filtered = useMemo(() => {
        return students.filter((student) => {
            const generalTerm =
                filter.trim().toLowerCase();

            const nachnameTerm =
                nachnameFilter.trim().toLowerCase();

            const vornameTerm =
                vornameFilter.trim().toLowerCase();

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
                String(
                    student.nachname ?? ''
                )
                    .toLowerCase()
                    .includes(nachnameTerm);

            const matchesVorname =
                !vornameTerm ||
                String(
                    student.vorname ?? ''
                )
                    .toLowerCase()
                    .includes(vornameTerm);

            const matchesJahrgang =
                !jahrgangFilter ||
                String(student.jahrgang ?? '') ===
                String(jahrgangFilter);

            const matchesFoto =
                !fotoFilter ||
                String(
                    student.fotoFreigabe ?? ''
                ) === String(fotoFilter);

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
        fotoFilter
    ]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            if (!sortKey) {
                return 0;
            }

            const valA = a[sortKey];
            const valB = b[sortKey];

            /*
             * Zahlen sortieren:
             * Jahrgang sowie spätere Anwesenheitszähler.
             */
            if (
                typeof valA === 'number' &&
                typeof valB === 'number'
            ) {
                return sortDirection === 'asc'
                    ? valA - valB
                    : valB - valA;
            }

            /*
             * null / undefined bei den Anwesenheitszahlen
             * als 0 behandeln.
             */
            if (
                [
                    'anzahlAnwesend',
                    'anzahlEntschuldigt',
                    'anzahlFehlend'
                ].includes(sortKey)
            ) {
                const numberA =
                    Number(valA) || 0;

                const numberB =
                    Number(valB) || 0;

                return sortDirection === 'asc'
                    ? numberA - numberB
                    : numberB - numberA;
            }

            const strA =
                String(valA ?? '')
                    .toLowerCase();

            const strB =
                String(valB ?? '')
                    .toLowerCase();

            return sortDirection === 'asc'
                ? strA.localeCompare(strB, 'de')
                : strB.localeCompare(strA, 'de');
        });
    }, [
        filtered,
        sortKey,
        sortDirection
    ]);

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

    const handleEditStart = (student) => {
        setEditingId(student.id);
        setEditData({ ...student });
    };

    const handleEditChange = (key, value) => {
        setEditData((previous) => ({
            ...previous,
            [key]: value
        }));
    };

    const handleEditSave = async () => {
        try {
            let savedStudent;

            if (typeof editingId === 'number') {
                savedStudent =
                    await updateStudent(
                        editingId,
                        editData
                    );
            } else {
                savedStudent =
                    await createStudent(
                        editData
                    );
            }

            setStudents((previous) =>
                previous.map((student) =>
                    student.id === editingId
                        ? savedStudent
                        : student
                )
            );

            setEditingId(null);
            setEditData({});
            setError('');
        } catch (error) {
            console.error(
                'Fehler beim Speichern:',
                error
            );

            setError(
                'Der Schüler konnte nicht gespeichert werden.'
            );
        }
    };

    const handleEditCancel = () => {
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
    };

    const handleAdd = () => {
        if (editingId !== null) {
            return;
        }

        const tempId =
            `new-${Date.now()}`;

        const newStudent = {
            ...emptyStudent,
            id: tempId,

            // Statistiken für neuen Datensatz
            anzahlAnwesend: 0,
            anzahlEntschuldigt: 0,
            anzahlFehlend: 0
        };

        setStudents((previous) => [
            newStudent,
            ...previous
        ]);

        setEditingId(tempId);
        setEditData(newStudent);
    };

    const handleDelete = async (id) => {
        const confirmed =
            window.confirm(
                'Möchten Sie diesen Schüler wirklich löschen?'
            );

        if (!confirmed) {
            return;
        }

        try {
            if (typeof id === 'number') {
                await deleteStudent(id);
            }

            setStudents((previous) =>
                previous.filter(
                    (student) =>
                        student.id !== id
                )
            );

            if (editingId === id) {
                setEditingId(null);
                setEditData({});
            }

            setError('');
        } catch (error) {
            console.error(
                'Fehler beim Löschen:',
                error
            );

            setError(
                'Der Schüler konnte nicht gelöscht werden.'
            );
        }
    };

    const resetFilters = () => {
        setFilter('');
        setNachnameFilter('');
        setVornameFilter('');
        setJahrgangFilter('');
        setFotoFilter('');
    };

    const hasActiveFilters =
        filter ||
        nachnameFilter ||
        vornameFilter ||
        jahrgangFilter ||
        fotoFilter;

    return (
        <div className="gesamtuebersicht-page">

            <header className="page-header">
                <div className="page-header-content">
                    <h1>
                        Gesamtübersicht
                    </h1>

                    <p>
                        Schülerdaten, Kontaktdaten und
                        Anwesenheitsstatistiken verwalten
                    </p>
                </div>

                <div className="gesamtuebersicht-count">
                    {students.length} Schüler
                </div>
            </header>

            {error && (
                <div className="gesamtuebersicht-error">
                    {error}
                </div>
            )}

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

                            {jahrgaenge.map(
                                (jahrgang) => (
                                    <option
                                        key={jahrgang}
                                        value={jahrgang}
                                    >
                                        {jahrgang}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

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

                            {fotoFreigaben.map(
                                (freigabe) => (
                                    <option
                                        key={freigabe}
                                        value={freigabe}
                                    >
                                        {freigabe}
                                    </option>
                                )
                            )}
                        </select>
                    </div>
                </div>
            </section>

            <div className="gesamtuebersicht-toolbar">
                <div className="gesamtuebersicht-result-count">
                    {sorted.length}{' '}
                    {sorted.length === 1
                        ? 'Schüler gefunden'
                        : 'Schüler gefunden'}
                </div>

                <button
                    type="button"
                    className="gesamtuebersicht-add-button"
                    onClick={handleAdd}
                    disabled={editingId !== null}
                >
                    + Neuer Eintrag
                </button>
            </div>

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