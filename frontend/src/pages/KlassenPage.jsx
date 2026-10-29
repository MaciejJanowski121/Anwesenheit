import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
    getKlassen,
    createKlasse,
    updateKlasse,
    deleteKlasse
} from '../services/klasseService';

import './KlassenPage.css';

const emptyKlasse = {
    name: '',
    klassenpaedagoge1: '',
    klassenpaedagoge2: ''
};

const COLUMNS = [
    {
        key: 'name',
        label: 'Klasse'
    },
    {
        key: 'klassenpaedagoge1',
        label: 'Klassenpäd. 1'
    },
    {
        key: 'klassenpaedagoge2',
        label: 'Klassenpäd. 2'
    }
];

function KlassenPage({ isAdmin = false }) {

    const navigate = useNavigate();

    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [klassen, setKlassen] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    /* =====================================================
       FILTER
       ===================================================== */

    const [filter, setFilter] = useState('');

    const [nameFilter, setNameFilter] = useState('');

    const [
        paedagoge1Filter,
        setPaedagoge1Filter
    ] = useState('');

    const [
        paedagoge2Filter,
        setPaedagoge2Filter
    ] = useState('');

    /* =====================================================
       SORTIERUNG
       ===================================================== */

    const [sortKey, setSortKey] = useState('name');

    const [
        sortDirection,
        setSortDirection
    ] = useState('asc');

    /* =====================================================
       BEARBEITUNG
       ===================================================== */

    const [editingId, setEditingId] = useState(null);

    const [editData, setEditData] = useState({});

    /* =====================================================
       INITIALISIERUNG
       ===================================================== */

    useEffect(() => {
        loadKlassen();
    }, []);

    /* =====================================================
       KLASSEN LADEN
       ===================================================== */

    const loadKlassen = async () => {

        try {

            setLoading(true);
            setError('');

            const data = await getKlassen();

            setKlassen(
                Array.isArray(data) ? data : []
            );

        } catch (err) {

            console.error(
                'Fehler beim Laden der Klassen:',
                err
            );

            setError(
                err.message ||
                'Die Klassen konnten nicht geladen werden.'
            );

        } finally {

            setLoading(false);
        }
    };

    /* =====================================================
       FILTER
       ===================================================== */

    const filteredKlassen = useMemo(() => {

        const normalize = (value) =>
            String(value ?? '')
                .trim()
                .toLocaleLowerCase('de');

        const generalTerm = normalize(filter);
        const nameTerm = normalize(nameFilter);

        const paedagoge1Term =
            normalize(paedagoge1Filter);

        const paedagoge2Term =
            normalize(paedagoge2Filter);

        return klassen.filter((klasse) => {

            const matchesGeneral =
                !generalTerm ||
                [
                    klasse.name,
                    klasse.klassenpaedagoge1,
                    klasse.klassenpaedagoge2
                ].some((value) =>
                    normalize(value).includes(generalTerm)
                );

            const matchesName =
                !nameTerm ||
                normalize(klasse.name).includes(nameTerm);

            const matchesPaedagoge1 =
                !paedagoge1Term ||
                normalize(
                    klasse.klassenpaedagoge1
                ).includes(paedagoge1Term);

            const matchesPaedagoge2 =
                !paedagoge2Term ||
                normalize(
                    klasse.klassenpaedagoge2
                ).includes(paedagoge2Term);

            return (
                matchesGeneral &&
                matchesName &&
                matchesPaedagoge1 &&
                matchesPaedagoge2
            );
        });

    }, [
        klassen,
        filter,
        nameFilter,
        paedagoge1Filter,
        paedagoge2Filter
    ]);

    /* =====================================================
       SORTIERUNG
       ===================================================== */

    const sortedKlassen = useMemo(() => {

        return [...filteredKlassen].sort((a, b) => {

            const valueA = String(
                a[sortKey] ?? ''
            );

            const valueB = String(
                b[sortKey] ?? ''
            );

            const result = valueA.localeCompare(
                valueB,
                'de',
                {
                    numeric: true,
                    sensitivity: 'base'
                }
            );

            return sortDirection === 'asc'
                ? result
                : -result;
        });

    }, [
        filteredKlassen,
        sortKey,
        sortDirection
    ]);

    const handleSort = (key) => {

        if (sortKey === key) {

            setSortDirection((previous) =>
                previous === 'asc'
                    ? 'desc'
                    : 'asc'
            );

        } else {

            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const renderSortIndicator = (key) => {

        if (sortKey !== key) {
            return null;
        }

        return sortDirection === 'asc'
            ? ' ▲'
            : ' ▼';
    };

    /* =====================================================
       STATISTIK
       ===================================================== */

    const klassenMitPaedagogen = useMemo(() => {

        return klassen.filter((klasse) =>
            Boolean(
                klasse.klassenpaedagoge1?.trim() ||
                klasse.klassenpaedagoge2?.trim()
            )
        ).length;

    }, [klassen]);

    const anzahlPaedagogen = useMemo(() => {

        const paedagogen = new Set();

        klassen.forEach((klasse) => {

            [
                klasse.klassenpaedagoge1,
                klasse.klassenpaedagoge2
            ].forEach((name) => {

                if (name?.trim()) {
                    paedagogen.add(
                        name.trim().toLocaleLowerCase('de')
                    );
                }
            });
        });

        return paedagogen.size;

    }, [klassen]);

    /* =====================================================
       KLASSE ÖFFNEN
       ===================================================== */

    const handleKlasseOpen = (klasse) => {

        if (editingId !== null) {
            return;
        }

        if (typeof klasse.id !== 'number') {
            return;
        }

        navigate(`/klassen/${klasse.id}`);
    };

    /* =====================================================
       KLASSE HINZUFÜGEN
       ===================================================== */

    const handleAdd = () => {

        if (!isAdmin || editingId !== null) {
            return;
        }

        const tempId = `new-${Date.now()}`;

        const neueKlasse = {
            ...emptyKlasse,
            id: tempId
        };

        setKlassen((previous) => [
            neueKlasse,
            ...previous
        ]);

        setEditingId(tempId);
        setEditData(neueKlasse);
        setError('');
    };

    /* =====================================================
       BEARBEITUNG STARTEN
       ===================================================== */

    const handleEditStart = (klasse) => {

        if (!isAdmin || editingId !== null) {
            return;
        }

        setEditingId(klasse.id);

        setEditData({
            ...klasse,
            name: klasse.name ?? '',
            klassenpaedagoge1:
                klasse.klassenpaedagoge1 ?? '',
            klassenpaedagoge2:
                klasse.klassenpaedagoge2 ?? ''
        });

        setError('');
    };

    /* =====================================================
       FELD ÄNDERN
       ===================================================== */

    const handleEditChange = (field, value) => {

        setEditData((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    /* =====================================================
       VALIDIERUNG
       ===================================================== */

    const validateKlasse = () => {

        const name = editData.name?.trim();

        if (!name) {

            setError(
                'Bitte geben Sie einen Klassennamen ein.'
            );

            return false;
        }

        const duplicate = klassen.some((klasse) =>
            klasse.id !== editingId &&
            klasse.name?.trim().toLocaleLowerCase('de') ===
            name.toLocaleLowerCase('de')
        );

        if (duplicate) {

            setError(
                'Eine Klasse mit diesem Namen existiert bereits.'
            );

            return false;
        }

        return true;
    };

    /* =====================================================
       KLASSE SPEICHERN
       ===================================================== */

    const handleEditSave = async () => {

        if (!isAdmin || saving || !validateKlasse()) {
            return;
        }

        try {

            setSaving(true);
            setError('');

            const payload = {
                name: editData.name.trim(),
                klassenpaedagoge1:
                    editData.klassenpaedagoge1?.trim() || null,
                klassenpaedagoge2:
                    editData.klassenpaedagoge2?.trim() || null
            };

            let savedKlasse;

            if (typeof editingId === 'number') {

                savedKlasse = await updateKlasse(
                    editingId,
                    payload
                );

            } else {

                savedKlasse = await createKlasse(
                    payload
                );
            }

            setKlassen((previous) =>
                previous.map((klasse) =>
                    klasse.id === editingId
                        ? savedKlasse
                        : klasse
                )
            );

            setEditingId(null);
            setEditData({});

        } catch (err) {

            console.error(
                'Fehler beim Speichern der Klasse:',
                err
            );

            setError(
                err.message ||
                'Die Klasse konnte nicht gespeichert werden.'
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

            setKlassen((previous) =>
                previous.filter((klasse) =>
                    klasse.id !== editingId
                )
            );
        }

        setEditingId(null);
        setEditData({});
        setError('');
    };

    /* =====================================================
       KLASSE LÖSCHEN
       ===================================================== */

    const handleDelete = async (klasse) => {

        if (!isAdmin || editingId !== null) {
            return;
        }

        const confirmed = window.confirm(
            `Möchten Sie die Klasse „${klasse.name}“ wirklich löschen?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError('');

            await deleteKlasse(klasse.id);

            setKlassen((previous) =>
                previous.filter((item) =>
                    item.id !== klasse.id
                )
            );

        } catch (err) {

            console.error(
                'Fehler beim Löschen der Klasse:',
                err
            );

            setError(
                err.message ||
                'Die Klasse konnte nicht gelöscht werden.'
            );
        }
    };

    /* =====================================================
       FILTER ZURÜCKSETZEN
       ===================================================== */

    const resetFilters = () => {

        setFilter('');
        setNameFilter('');
        setPaedagoge1Filter('');
        setPaedagoge2Filter('');
    };

    const hasActiveFilters = Boolean(
        filter ||
        nameFilter ||
        paedagoge1Filter ||
        paedagoge2Filter
    );

    /* =====================================================
       TABELLENZELLE
       ===================================================== */

    const renderCell = (klasse, field) => {

        const isEditing = editingId === klasse.id;

        if (!isEditing) {

            if (field === 'name') {

                return (
                    <div className="klasse-name">

                        <span className="klasse-name-icon">
                            K
                        </span>

                        <div className="klasse-name-content">

                            <strong>
                                {klasse.name || '–'}
                            </strong>

                        </div>

                    </div>
                );
            }

            return klasse[field] || '–';
        }

        return (
            <input
                className="klasse-edit-input"
                type="text"
                value={editData[field] ?? ''}
                onClick={(event) =>
                    event.stopPropagation()
                }
                onChange={(event) =>
                    handleEditChange(
                        field,
                        event.target.value
                    )
                }
            />
        );
    };

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="klassen-page">

            {/* HEADER */}

            <header className="page-header">

                <div className="page-header-content">

                    <h1>Klassen</h1>

                    <p>
                        Klassen und Klassenpädagogen verwalten
                    </p>

                </div>

                {isAdmin && (

                    <button
                        type="button"
                        className="klassen-add-button"
                        onClick={handleAdd}
                        disabled={editingId !== null}
                    >
                        <span>+</span>
                        Neue Klasse
                    </button>

                )}

            </header>

            {/* STATISTIK */}

            <section className="klassen-stats">

                <div className="klassen-stat-card">
                    <span>Alle Klassen</span>
                    <strong>{klassen.length}</strong>
                </div>

                <div className="klassen-stat-card">
                    <span>Mit Klassenpädagogen</span>
                    <strong>{klassenMitPaedagogen}</strong>
                </div>

                <div className="klassen-stat-card">
                    <span>Klassenpädagogen</span>
                    <strong>{anzahlPaedagogen}</strong>
                </div>

            </section>

            {/* FEHLER */}

            {error && (
                <div className="klassen-error" role="alert">
                    {error}
                </div>
            )}

            {/* FILTER */}

            <section className="klassen-filter-section">

                <div className="klassen-filter-header">

                    <div>

                        <h2>Filter</h2>

                        <p>
                            Klassen nach Name und Klassenpädagogen filtern
                        </p>

                    </div>

                    {hasActiveFilters && (

                        <button
                            type="button"
                            className="klassen-reset-button"
                            onClick={resetFilters}
                        >
                            Filter zurücksetzen
                        </button>

                    )}

                </div>

                <div className="klassen-filter-grid">

                    <div className="klassen-filter-field klassen-filter-field-wide">

                        <label htmlFor="klasse-allgemeine-suche">
                            Allgemeine Suche
                        </label>

                        <input
                            id="klasse-allgemeine-suche"
                            type="text"
                            value={filter}
                            placeholder="Klasse, Klassenpädagoge..."
                            onChange={(event) =>
                                setFilter(event.target.value)
                            }
                        />

                    </div>

                    <div className="klassen-filter-field">

                        <label htmlFor="klasse-name-filter">
                            Klasse
                        </label>

                        <input
                            id="klasse-name-filter"
                            type="text"
                            value={nameFilter}
                            placeholder="Klassenname..."
                            onChange={(event) =>
                                setNameFilter(event.target.value)
                            }
                        />

                    </div>

                    <div className="klassen-filter-field">

                        <label htmlFor="klasse-paedagoge1-filter">
                            Klassenpäd. 1
                        </label>

                        <input
                            id="klasse-paedagoge1-filter"
                            type="text"
                            value={paedagoge1Filter}
                            placeholder="Name..."
                            onChange={(event) =>
                                setPaedagoge1Filter(event.target.value)
                            }
                        />

                    </div>

                    <div className="klassen-filter-field">

                        <label htmlFor="klasse-paedagoge2-filter">
                            Klassenpäd. 2
                        </label>

                        <input
                            id="klasse-paedagoge2-filter"
                            type="text"
                            value={paedagoge2Filter}
                            placeholder="Name..."
                            onChange={(event) =>
                                setPaedagoge2Filter(event.target.value)
                            }
                        />

                    </div>

                </div>

            </section>

            {/* KLASSENLISTE */}

            <section className="klassen-content">

                <div className="klassen-toolbar">

                    <span className="klassen-result-count">
                        {sortedKlassen.length}{' '}
                        {sortedKlassen.length === 1
                            ? 'Klasse'
                            : 'Klassen'}
                    </span>

                </div>

                <div className="klassen-table-scroll">

                    <table className="klassen-table">

                        <thead>
                        <tr>

                            {COLUMNS.map((column) => (

                                <th
                                    key={column.key}
                                    className="klassen-sortable-header"
                                    onClick={() =>
                                        handleSort(column.key)
                                    }
                                >
                                    {column.label}
                                    {renderSortIndicator(column.key)}
                                </th>

                            ))}

                            {isAdmin && (
                                <th className="klassen-actions-header">
                                    Aktionen
                                </th>
                            )}

                        </tr>
                        </thead>

                        <tbody>

                        {loading ? (

                            <tr>
                                <td
                                    colSpan={isAdmin ? 4 : 3}
                                    className="klassen-empty-row"
                                >
                                    Klassen werden geladen...
                                </td>
                            </tr>

                        ) : sortedKlassen.length === 0 ? (

                            <tr>
                                <td
                                    colSpan={isAdmin ? 4 : 3}
                                    className="klassen-empty-row"
                                >
                                    Keine Klassen gefunden.
                                </td>
                            </tr>

                        ) : (

                            sortedKlassen.map((klasse) => (

                                <tr
                                    key={klasse.id}
                                    className={
                                        editingId === klasse.id
                                            ? 'klasse-row-editing'
                                            : 'klasse-row-clickable'
                                    }
                                    onClick={() =>
                                        handleKlasseOpen(klasse)
                                    }
                                >

                                    {COLUMNS.map((column) => (

                                        <td key={column.key}>
                                            {renderCell(
                                                klasse,
                                                column.key
                                            )}
                                        </td>

                                    ))}

                                    {isAdmin && (

                                        <td
                                            className="klassen-action-cell"
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                        >

                                            {editingId === klasse.id ? (

                                                <>
                                                    <button
                                                        type="button"
                                                        className="klassen-save-button"
                                                        onClick={handleEditSave}
                                                        disabled={saving}
                                                    >
                                                        {saving
                                                            ? 'Speichern...'
                                                            : 'Speichern'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="klassen-cancel-button"
                                                        onClick={handleEditCancel}
                                                        disabled={saving}
                                                    >
                                                        Abbrechen
                                                    </button>
                                                </>

                                            ) : (

                                                <>
                                                    <button
                                                        type="button"
                                                        className="klassen-edit-button"
                                                        onClick={() =>
                                                            handleEditStart(klasse)
                                                        }
                                                        disabled={editingId !== null}
                                                    >
                                                        Bearbeiten
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="klassen-delete-button"
                                                        onClick={() =>
                                                            handleDelete(klasse)
                                                        }
                                                        disabled={editingId !== null}
                                                    >
                                                        Löschen
                                                    </button>
                                                </>

                                            )}

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

export default KlassenPage;