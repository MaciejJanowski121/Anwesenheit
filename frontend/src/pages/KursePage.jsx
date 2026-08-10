import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    getKurse,
    createKurs,
    updateKurs,
    deleteKurs
} from '../services/kursService';

import './KursePage.css';

const emptyKurs = {
    name: '',
    kursleitung: '',
    wochentag: '',
    uhrzeit: '',
    buchungsart: '',
    kursgebuehr: ''
};

const WOCHENTAGE = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag'
];

const BUCHUNGSARTEN = [
    'Kurz',
    'OGS',
    'OGSH',
    'OGSF',
    'M',
    'P',
    'Zuschussfrei'
];

function KursePage() {
    const navigate = useNavigate();

    const [kurse, setKurse] = useState([]);

    const [filter, setFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [kursleitungFilter, setKursleitungFilter] = useState('');
    const [wochentagFilter, setWochentagFilter] = useState('');
    const [buchungsartFilter, setBuchungsartFilter] = useState('');

    const [sortKey, setSortKey] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    useEffect(() => {
        loadKurse();
    }, []);

    const loadKurse = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await getKurse();

            setKurse(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                'Fehler beim Laden der Kurse:',
                error
            );

            setError(
                'Die Kurse konnten nicht geladen werden.'
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredKurse = useMemo(() => {
        const generalTerm =
            filter.trim().toLowerCase();

        const nameTerm =
            nameFilter.trim().toLowerCase();

        const kursleitungTerm =
            kursleitungFilter.trim().toLowerCase();

        return kurse.filter((kurs) => {
            const matchesGeneral =
                !generalTerm ||
                [
                    kurs.name,
                    kurs.kursleitung,
                    kurs.wochentag,
                    kurs.uhrzeit,
                    kurs.buchungsart,
                    kurs.kursgebuehr
                ].some((value) =>
                    String(value ?? '')
                        .toLowerCase()
                        .includes(generalTerm)
                );

            const matchesName =
                !nameTerm ||
                String(kurs.name ?? '')
                    .toLowerCase()
                    .includes(nameTerm);

            const matchesKursleitung =
                !kursleitungTerm ||
                String(kurs.kursleitung ?? '')
                    .toLowerCase()
                    .includes(kursleitungTerm);

            const matchesWochentag =
                !wochentagFilter ||
                String(kurs.wochentag ?? '') ===
                String(wochentagFilter);

            const matchesBuchungsart =
                !buchungsartFilter ||
                String(kurs.buchungsart ?? '') ===
                String(buchungsartFilter);

            return (
                matchesGeneral &&
                matchesName &&
                matchesKursleitung &&
                matchesWochentag &&
                matchesBuchungsart
            );
        });
    }, [
        kurse,
        filter,
        nameFilter,
        kursleitungFilter,
        wochentagFilter,
        buchungsartFilter
    ]);

    const sortedKurse = useMemo(() => {
        return [...filteredKurse].sort((a, b) => {
            if (!sortKey) {
                return 0;
            }

            const valA = a[sortKey];
            const valB = b[sortKey];

            if (sortKey === 'kursgebuehr') {
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
        filteredKurse,
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

    const renderSortIndicator = (key) => {
        if (sortKey !== key) {
            return null;
        }

        return sortDirection === 'asc'
            ? ' ▲'
            : ' ▼';
    };

    const kursartenCount = useMemo(() => {
        return new Set(
            kurse
                .map((kurs) => kurs.buchungsart)
                .filter(Boolean)
        ).size;
    }, [kurse]);

    const kostenpflichtigeKurse = useMemo(() => {
        return kurse.filter((kurs) => {
            return (
                kurs.kursgebuehr !== null &&
                kurs.kursgebuehr !== undefined &&
                kurs.kursgebuehr !== ''
            );
        }).length;
    }, [kurse]);

    const handleKursOpen = (kurs) => {
        if (editingId !== null) {
            return;
        }

        if (typeof kurs.id !== 'number') {
            return;
        }

        navigate(`/kurse/${kurs.id}`);
    };

    const handleAdd = () => {
        if (editingId !== null) {
            return;
        }

        const tempId =
            `new-${Date.now()}`;

        const newKurs = {
            ...emptyKurs,
            id: tempId
        };

        setKurse((previous) => [
            newKurs,
            ...previous
        ]);

        setEditingId(tempId);
        setEditData(newKurs);
        setError('');
    };

    const handleEditStart = (kurs) => {
        if (editingId !== null) {
            return;
        }

        setEditingId(kurs.id);

        setEditData({
            ...kurs,
            kursgebuehr:
                kurs.kursgebuehr ?? ''
        });

        setError('');
    };

    const handleEditChange = (
        field,
        value
    ) => {
        setEditData((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    const createPayload = () => {
        return {
            name:
                editData.name?.trim() || '',

            kursleitung:
                editData.kursleitung?.trim() || '',

            wochentag:
                editData.wochentag || '',

            uhrzeit:
                editData.uhrzeit || '',

            buchungsart:
                editData.buchungsart || '',

            kursgebuehr:
                editData.kursgebuehr === '' ||
                editData.kursgebuehr === null ||
                editData.kursgebuehr === undefined
                    ? null
                    : Number(
                        editData.kursgebuehr
                    )
        };
    };

    const validateKurs = () => {
        if (!editData.name?.trim()) {
            setError(
                'Bitte geben Sie einen Kursnamen ein.'
            );

            return false;
        }

        if (!editData.kursleitung?.trim()) {
            setError(
                'Bitte geben Sie eine Kursleitung ein.'
            );

            return false;
        }

        if (!editData.wochentag) {
            setError(
                'Bitte wählen Sie einen Wochentag aus.'
            );

            return false;
        }

        if (!editData.buchungsart) {
            setError(
                'Bitte wählen Sie eine Buchungsart aus.'
            );

            return false;
        }

        if (
            editData.kursgebuehr !== '' &&
            Number(
                editData.kursgebuehr
            ) < 0
        ) {
            setError(
                'Die Kursgebühr darf nicht negativ sein.'
            );

            return false;
        }

        return true;
    };

    const handleEditSave = async () => {
        if (!validateKurs()) {
            return;
        }

        try {
            setSaving(true);
            setError('');

            const payload =
                createPayload();

            let savedKurs;

            if (
                typeof editingId === 'number'
            ) {
                savedKurs =
                    await updateKurs(
                        editingId,
                        payload
                    );
            } else {
                savedKurs =
                    await createKurs(
                        payload
                    );
            }

            setKurse((previous) =>
                previous.map((kurs) =>
                    kurs.id === editingId
                        ? savedKurs
                        : kurs
                )
            );

            setEditingId(null);
            setEditData({});
        } catch (error) {
            console.error(
                'Fehler beim Speichern des Kurses:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Der Kurs konnte nicht gespeichert werden.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEditCancel = () => {
        if (
            typeof editingId !== 'number'
        ) {
            setKurse((previous) =>
                previous.filter(
                    (kurs) =>
                        kurs.id !== editingId
                )
            );
        }

        setEditingId(null);
        setEditData({});
        setError('');
    };

    const handleDelete = async (kurs) => {
        const confirmed =
            window.confirm(
                `Möchten Sie den Kurs „${kurs.name}“ wirklich löschen?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setError('');

            if (
                typeof kurs.id === 'number'
            ) {
                await deleteKurs(
                    kurs.id
                );
            }

            setKurse((previous) =>
                previous.filter(
                    (item) =>
                        item.id !== kurs.id
                )
            );

            if (
                editingId === kurs.id
            ) {
                setEditingId(null);
                setEditData({});
            }
        } catch (error) {
            console.error(
                'Fehler beim Löschen des Kurses:',
                error
            );

            setError(
                error.response?.data?.message ||
                'Der Kurs konnte nicht gelöscht werden.'
            );
        }
    };

    const resetFilters = () => {
        setFilter('');
        setNameFilter('');
        setKursleitungFilter('');
        setWochentagFilter('');
        setBuchungsartFilter('');
    };

    const hasActiveFilters =
        filter ||
        nameFilter ||
        kursleitungFilter ||
        wochentagFilter ||
        buchungsartFilter;

    const formatKursgebuehr = (
        value
    ) => {
        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return '–';
        }

        return new Intl.NumberFormat(
            'de-DE',
            {
                style: 'currency',
                currency: 'EUR'
            }
        ).format(Number(value));
    };

    const getBadgeClass = (
        buchungsart
    ) => {
        const normalized =
            String(
                buchungsart || ''
            )
                .toLowerCase()
                .replace(/\s+/g, '-');

        return `kurs-badge kurs-badge-${normalized}`;
    };

    const renderCell = (
        kurs,
        field
    ) => {
        const isEditing =
            editingId === kurs.id;

        if (!isEditing) {
            if (
                field === 'kursgebuehr'
            ) {
                return (
                    <span className="kurs-fee">
                        {formatKursgebuehr(
                            kurs.kursgebuehr
                        )}
                    </span>
                );
            }

            if (
                field === 'buchungsart'
            ) {
                return kurs.buchungsart ? (
                    <span
                        className={getBadgeClass(
                            kurs.buchungsart
                        )}
                    >
                        {kurs.buchungsart}
                    </span>
                ) : (
                    '–'
                );
            }

            if (field === 'name') {
                return (
                    <div className="kurs-name">
                        <span className="kurs-name-icon">
                            K
                        </span>

                        <div className="kurs-name-content">
                            <strong>
                                {kurs.name || '–'}
                            </strong>

                            <small>
                                {kurs.wochentag ||
                                    'Kein Tag'}

                                {kurs.uhrzeit
                                    ? ` · ${kurs.uhrzeit}`
                                    : ''}
                            </small>
                        </div>
                    </div>
                );
            }

            return (
                kurs[field] || '–'
            );
        }

        if (
            field === 'wochentag'
        ) {
            return (
                <select
                    className="kurs-edit-input"
                    value={
                        editData[field] ??
                        ''
                    }
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                    onChange={(event) =>
                        handleEditChange(
                            field,
                            event.target.value
                        )
                    }
                >
                    <option value="">
                        Bitte wählen
                    </option>

                    {WOCHENTAGE.map(
                        (tag) => (
                            <option
                                key={tag}
                                value={tag}
                            >
                                {tag}
                            </option>
                        )
                    )}
                </select>
            );
        }

        if (
            field === 'buchungsart'
        ) {
            return (
                <select
                    className="kurs-edit-input"
                    value={
                        editData[field] ??
                        ''
                    }
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                    onChange={(event) =>
                        handleEditChange(
                            field,
                            event.target.value
                        )
                    }
                >
                    <option value="">
                        Bitte wählen
                    </option>

                    {BUCHUNGSARTEN.map(
                        (art) => (
                            <option
                                key={art}
                                value={art}
                            >
                                {art}
                            </option>
                        )
                    )}
                </select>
            );
        }

        return (
            <input
                className="kurs-edit-input"
                type={
                    field === 'kursgebuehr'
                        ? 'number'
                        : field === 'uhrzeit'
                            ? 'time'
                            : 'text'
                }
                min={
                    field === 'kursgebuehr'
                        ? '0'
                        : undefined
                }
                step={
                    field === 'kursgebuehr'
                        ? '0.01'
                        : undefined
                }
                value={
                    editData[field] ?? ''
                }
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

    return (
        <div className="kurse-page">

            <header className="page-header">
                <div className="page-header-content">
                    <h1>Kurse</h1>

                    <p>
                        Kurse, Kursleitungen,
                        Buchungsarten und Gebühren verwalten
                    </p>
                </div>

                <button
                    type="button"
                    className="kurse-add-button"
                    onClick={handleAdd}
                    disabled={
                        editingId !== null
                    }
                >
                    <span>+</span>
                    Neuer Kurs
                </button>
            </header>

            <section className="kurse-stats">
                <div className="kurse-stat-card">
                    <span>
                        Alle Kurse
                    </span>

                    <strong>
                        {kurse.length}
                    </strong>
                </div>

                <div className="kurse-stat-card">
                    <span>
                        Buchungsarten
                    </span>

                    <strong>
                        {kursartenCount}
                    </strong>
                </div>

                <div className="kurse-stat-card">
                    <span>
                        Mit Kursgebühr
                    </span>

                    <strong>
                        {kostenpflichtigeKurse}
                    </strong>
                </div>
            </section>

            {error && (
                <div className="kurse-error">
                    {error}
                </div>
            )}

            <section className="kurse-filter-section">
                <div className="kurse-filter-header">
                    <div>
                        <h2>
                            Filter
                        </h2>

                        <p>
                            Kurse nach Name, Kursleitung,
                            Wochentag oder Buchungsart filtern
                        </p>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="kurse-reset-button"
                            onClick={
                                resetFilters
                            }
                        >
                            Filter zurücksetzen
                        </button>
                    )}
                </div>

                <div className="kurse-filter-grid">
                    <div className="kurse-filter-field kurse-filter-field-wide">
                        <label htmlFor="kurs-allgemeine-suche">
                            Allgemeine Suche
                        </label>

                        <input
                            id="kurs-allgemeine-suche"
                            type="text"
                            value={filter}
                            placeholder="Kurs, Kursleitung, Uhrzeit..."
                            onChange={(event) =>
                                setFilter(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="kurse-filter-field">
                        <label htmlFor="kurs-name-filter">
                            Name
                        </label>

                        <input
                            id="kurs-name-filter"
                            type="text"
                            value={nameFilter}
                            placeholder="Kursname..."
                            onChange={(event) =>
                                setNameFilter(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="kurse-filter-field">
                        <label htmlFor="kursleitung-filter">
                            Kursleitung
                        </label>

                        <input
                            id="kursleitung-filter"
                            type="text"
                            value={
                                kursleitungFilter
                            }
                            placeholder="Kursleitung..."
                            onChange={(event) =>
                                setKursleitungFilter(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="kurse-filter-field">
                        <label htmlFor="wochentag-filter">
                            Wochentag
                        </label>

                        <select
                            id="wochentag-filter"
                            value={
                                wochentagFilter
                            }
                            onChange={(event) =>
                                setWochentagFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Alle Wochentage
                            </option>

                            {WOCHENTAGE.map(
                                (tag) => (
                                    <option
                                        key={tag}
                                        value={tag}
                                    >
                                        {tag}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="kurse-filter-field">
                        <label htmlFor="buchungsart-filter">
                            Buchungsart
                        </label>

                        <select
                            id="buchungsart-filter"
                            value={
                                buchungsartFilter
                            }
                            onChange={(event) =>
                                setBuchungsartFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Alle Buchungsarten
                            </option>

                            {BUCHUNGSARTEN.map(
                                (art) => (
                                    <option
                                        key={art}
                                        value={art}
                                    >
                                        {art}
                                    </option>
                                )
                            )}
                        </select>
                    </div>
                </div>
            </section>

            <section className="kurse-content">

                <div className="kurse-toolbar">
                    <span className="kurse-result-count">
                        {sortedKurse.length}{' '}

                        {sortedKurse.length === 1
                            ? 'Kurs'
                            : 'Kurse'}
                    </span>
                </div>

                <div className="kurse-table-scroll">
                    <table className="kurse-table">
                        <thead>
                        <tr>
                            <th
                                className="kurse-sortable-header"
                                onClick={() =>
                                    handleSort(
                                        'name'
                                    )
                                }
                            >
                                Name
                                {renderSortIndicator(
                                    'name'
                                )}
                            </th>

                            <th
                                className="kurse-sortable-header"
                                onClick={() =>
                                    handleSort(
                                        'kursleitung'
                                    )
                                }
                            >
                                Kursleitung
                                {renderSortIndicator(
                                    'kursleitung'
                                )}
                            </th>

                            <th
                                className="kurse-sortable-header"
                                onClick={() =>
                                    handleSort(
                                        'wochentag'
                                    )
                                }
                            >
                                Wochentag
                                {renderSortIndicator(
                                    'wochentag'
                                )}
                            </th>

                            <th
                                className="kurse-sortable-header"
                                onClick={() =>
                                    handleSort(
                                        'uhrzeit'
                                    )
                                }
                            >
                                Uhrzeit
                                {renderSortIndicator(
                                    'uhrzeit'
                                )}
                            </th>

                            <th
                                className="kurse-sortable-header"
                                onClick={() =>
                                    handleSort(
                                        'buchungsart'
                                    )
                                }
                            >
                                Buchungsart
                                {renderSortIndicator(
                                    'buchungsart'
                                )}
                            </th>

                            <th
                                className="kurse-sortable-header"
                                onClick={() =>
                                    handleSort(
                                        'kursgebuehr'
                                    )
                                }
                            >
                                Kursgebühr
                                {renderSortIndicator(
                                    'kursgebuehr'
                                )}
                            </th>

                            <th className="aktionen-header">
                                Aktionen
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="kurse-empty-row"
                                >
                                    Kurse werden geladen...
                                </td>
                            </tr>
                        ) : sortedKurse.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="kurse-empty-row"
                                >
                                    Keine Kurse gefunden.
                                </td>
                            </tr>
                        ) : (
                            sortedKurse.map(
                                (kurs) => (
                                    <tr
                                        key={kurs.id}
                                        className={
                                            editingId ===
                                            kurs.id
                                                ? 'kurs-row-editing'
                                                : 'kurs-row-clickable'
                                        }
                                        onClick={() =>
                                            handleKursOpen(
                                                kurs
                                            )
                                        }
                                    >
                                        <td>
                                            {renderCell(
                                                kurs,
                                                'name'
                                            )}
                                        </td>

                                        <td>
                                            {renderCell(
                                                kurs,
                                                'kursleitung'
                                            )}
                                        </td>

                                        <td>
                                            {renderCell(
                                                kurs,
                                                'wochentag'
                                            )}
                                        </td>

                                        <td>
                                            {renderCell(
                                                kurs,
                                                'uhrzeit'
                                            )}
                                        </td>

                                        <td>
                                            {renderCell(
                                                kurs,
                                                'buchungsart'
                                            )}
                                        </td>

                                        <td>
                                            {renderCell(
                                                kurs,
                                                'kursgebuehr'
                                            )}
                                        </td>

                                        <td
                                            className="kurse-action-cell"
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                        >
                                            {editingId ===
                                            kurs.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="kurse-save-button"
                                                        onClick={
                                                            handleEditSave
                                                        }
                                                        disabled={
                                                            saving
                                                        }
                                                    >
                                                        {saving
                                                            ? 'Speichern...'
                                                            : 'Speichern'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="kurse-cancel-button"
                                                        onClick={
                                                            handleEditCancel
                                                        }
                                                        disabled={
                                                            saving
                                                        }
                                                    >
                                                        Abbrechen
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="kurse-edit-button"
                                                        onClick={() =>
                                                            handleEditStart(
                                                                kurs
                                                            )
                                                        }
                                                        disabled={
                                                            editingId !==
                                                            null
                                                        }
                                                    >
                                                        Bearbeiten
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="kurse-delete-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                kurs
                                                            )
                                                        }
                                                        disabled={
                                                            editingId !==
                                                            null
                                                        }
                                                    >
                                                        Löschen
                                                    </button>
                                                </>
                                            )}
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

export default KursePage;