import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    getAngebote,
    createAngebot,
    updateAngebot,
    deleteAngebot
} from '../services/angebotService';

import './AngebotePage.css';

const EMPTY_ANGEBOT = {
    name: '',
    angebotsart: '',
    angebotsleitung: '',
    wochentag: '',
    beginn: '',
    ende: ''
};

const WOCHENTAGE = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag'
];

const COLUMNS = [
    { key: 'name', label: 'Name Angebot' },
    { key: 'angebotsart', label: 'Angebotsart' },
    { key: 'angebotsleitung', label: 'Angebotsleitung' },
    { key: 'wochentag', label: 'Wochentag' },
    { key: 'beginn', label: 'Beginn' },
    { key: 'ende', label: 'Ende' }
];

function AngebotePage({ readOnly = false, basePath = '/angebote' }) {

    const navigate = useNavigate();

    const [angebote, setAngebote] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [artFilter, setArtFilter] = useState('');
    const [wochentagFilter, setWochentagFilter] = useState('');

    const [sortKey, setSortKey] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {

        let active = true;

        const load = async () => {

            try {
                setLoading(true);

                const data = await getAngebote();

                if (active) {
                    setAngebote(Array.isArray(data) ? data : []);
                }

            } catch (err) {

                console.error('Fehler beim Laden der Angebote:', err);

                if (active) {
                    setError('Die Angebote konnten nicht geladen werden.');
                }

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

    }, []);

    const angebotsarten = useMemo(() => {

        return [...new Set(
            angebote
                .map(angebot => angebot.angebotsart?.trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, 'de'));

    }, [angebote]);

    const filteredAngebote = useMemo(() => {

        const term = search.trim().toLocaleLowerCase('de');

        return angebote.filter(angebot => {

            const matchesSearch =
                !term ||
                [
                    angebot.name,
                    angebot.angebotsart,
                    angebot.angebotsleitung,
                    angebot.wochentag,
                    angebot.beginn,
                    angebot.ende
                ].some(value =>
                    String(value ?? '')
                        .toLocaleLowerCase('de')
                        .includes(term)
                );

            const matchesArt =
                !artFilter ||
                angebot.angebotsart === artFilter;

            const matchesWochentag =
                !wochentagFilter ||
                angebot.wochentag === wochentagFilter;

            return matchesSearch && matchesArt && matchesWochentag;

        });

    }, [angebote, search, artFilter, wochentagFilter]);

    const sortedAngebote = useMemo(() => {

        if (!sortKey) {
            return filteredAngebote;
        }

        const direction = sortDirection === 'asc' ? 1 : -1;

        return [...filteredAngebote].sort((a, b) => {

            return String(a[sortKey] ?? '').localeCompare(
                String(b[sortKey] ?? ''),
                'de',
                { sensitivity: 'base' }
            ) * direction;

        });

    }, [filteredAngebote, sortKey, sortDirection]);

    const handleSort = (key) => {

        if (editingId !== null) {
            return;
        }

        if (sortKey === key) {
            setSortDirection(previous =>
                previous === 'asc' ? 'desc' : 'asc'
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

        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    };

    const handleAdd = () => {
        if (readOnly || editingId !== null) {
            return;
        }

        const id = `new-${Date.now()}`;

        const angebot = {
            ...EMPTY_ANGEBOT,
            id
        };

        setAngebote(previous => [angebot, ...previous]);
        setEditingId(id);
        setEditData(angebot);
        setError('');

        setSearch('');
        setArtFilter('');
        setWochentagFilter('');
        setSortKey(null);
    };

    const handleEditStart = (angebot) => {
        if (readOnly || editingId !== null) {
            return;
        }

        setEditingId(angebot.id);

        setEditData({
            ...EMPTY_ANGEBOT,
            ...angebot
        });

        setError('');
    };

    const handleEditChange = (field, value) => {
        if (readOnly) return;
        setEditData(previous => ({
            ...previous,
            [field]: value
        }));
    };

    const validateAngebot = () => {

        if (!editData.name?.trim()) {
            setError('Bitte geben Sie einen Angebotsnamen ein.');
            return false;
        }

        if (!editData.angebotsart?.trim()) {
            setError('Bitte geben Sie eine Angebotsart ein.');
            return false;
        }

        if (!editData.angebotsleitung?.trim()) {
            setError('Bitte geben Sie eine Angebotsleitung ein.');
            return false;
        }

        if (!editData.wochentag) {
            setError('Bitte wählen Sie einen Wochentag aus.');
            return false;
        }

        if (!editData.beginn) {
            setError('Bitte geben Sie den Beginn ein.');
            return false;
        }

        if (!editData.ende) {
            setError('Bitte geben Sie das Ende ein.');
            return false;
        }

        if (editData.ende <= editData.beginn) {
            setError('Das Ende muss nach dem Beginn liegen.');
            return false;
        }

        return true;
    };

    const createPayload = () => ({
        name: editData.name.trim(),
        angebotsart: editData.angebotsart.trim(),
        angebotsleitung: editData.angebotsleitung.trim(),
        wochentag: editData.wochentag,
        beginn: editData.beginn,
        ende: editData.ende
    });

    const handleSave = async () => {
        if (readOnly) return;
        if (!validateAngebot()) {
            return;
        }

        try {

            setSaving(true);
            setError('');

            const payload = createPayload();

            const saved = typeof editingId === 'number'
                ? await updateAngebot(editingId, payload)
                : await createAngebot(payload);

            setAngebote(previous =>
                previous.map(angebot =>
                    angebot.id === editingId ? saved : angebot
                )
            );

            setEditingId(null);
            setEditData({});

        } catch (err) {

            console.error('Fehler beim Speichern des Angebots:', err);

            setError(
                err.response?.data?.message ||
                'Das Angebot konnte nicht gespeichert werden.'
            );

        } finally {

            setSaving(false);
        }
    };

    const handleCancel = () => {

        if (saving) {
            return;
        }

        if (typeof editingId !== 'number') {

            setAngebote(previous =>
                previous.filter(angebot => angebot.id !== editingId)
            );
        }

        setEditingId(null);
        setEditData({});
        setError('');
    };

    const handleDelete = async (angebot) => {
        if (readOnly || editingId !== null || deletingId !== null) {
            return;
        }

        const confirmed = window.confirm(
            `Möchten Sie das Angebot „${angebot.name}“ wirklich löschen?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setDeletingId(angebot.id);
            setError('');

            await deleteAngebot(angebot.id);

            setAngebote(previous =>
                previous.filter(item => item.id !== angebot.id)
            );

        } catch (err) {

            console.error('Fehler beim Löschen des Angebots:', err);

            setError(
                'Das Angebot konnte nicht gelöscht werden. ' +
                'Möglicherweise sind bereits Schüler oder Anwesenheiten zugeordnet.'
            );

        } finally {

            setDeletingId(null);
        }
    };

    const handleOpen = (angebot) => {
        if (editingId !== null || deletingId !== null) {
            return;
        }
        if (typeof angebot.id === 'number') {
            navigate(`${basePath}/${angebot.id}`);
        }
    };

    const resetFilters = () => {

        setSearch('');
        setArtFilter('');
        setWochentagFilter('');
    };

    const hasActiveFilters =
        Boolean(search || artFilter || wochentagFilter);

    const renderCell = (angebot, field) => {
        const isEditing = !readOnly && editingId === angebot.id;

        if (!isEditing) {

            if (field === 'name') {

                return (
                    <div className="angebot-name">
                        <span className="angebot-name-icon">A</span>

                        <div className="angebot-name-content">
                            <strong>{angebot.name || '–'}</strong>
                            <small>
                                {angebot.wochentag || 'Kein Tag'}
                                {angebot.beginn ? ` · ${angebot.beginn}` : ''}
                                {angebot.ende ? ` – ${angebot.ende}` : ''}
                            </small>
                        </div>
                    </div>
                );
            }

            if (field === 'angebotsart') {

                return angebot.angebotsart
                    ? <span className="angebot-badge">{angebot.angebotsart}</span>
                    : '–';
            }

            return angebot[field] || '–';
        }

        if (field === 'wochentag') {

            return (
                <select
                    className="angebot-edit-input"
                    value={editData.wochentag ?? ''}
                    onClick={event => event.stopPropagation()}
                    onChange={event =>
                        handleEditChange('wochentag', event.target.value)
                    }
                >
                    <option value="">Bitte wählen</option>

                    {WOCHENTAGE.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>
            );
        }

        return (
            <input
                className="angebot-edit-input"
                type={field === 'beginn' || field === 'ende' ? 'time' : 'text'}
                value={editData[field] ?? ''}
                onClick={event => event.stopPropagation()}
                onChange={event =>
                    handleEditChange(field, event.target.value)
                }
            />
        );
    };

    return (
        <div className="angebote-page">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>{readOnly ? 'Infos Angebote' : 'Angebote'}</h1>
                    <p>
                        {readOnly
                            ? 'Übersicht der vorhandenen Vormittagsangebote'
                            : 'Vormittagsangebote, Angebotsarten und Angebotsleitungen verwalten'}
                    </p>
                </div>
                {!readOnly && (
                    <button
                        type="button"
                        className="angebote-add-button"
                        onClick={handleAdd}
                        disabled={editingId !== null}
                    >
                        <span>+</span>
                        Neues Angebot
                    </button>
                )}
            </header>

            <section className="angebote-stats">

                <div className="angebote-stat-card">
                    <span>Alle Angebote</span>
                    <strong>{angebote.length}</strong>
                </div>

                <div className="angebote-stat-card">
                    <span>Angebotsarten</span>
                    <strong>{angebotsarten.length}</strong>
                </div>

                <div className="angebote-stat-card">
                    <span>Wochentage</span>
                    <strong>
                        {new Set(
                            angebote.map(angebot => angebot.wochentag)
                                .filter(Boolean)
                        ).size}
                    </strong>
                </div>

            </section>

            {error && (
                <div className="angebote-error" role="alert">
                    {error}
                </div>
            )}

            <section className="angebote-filter-section">

                <div className="angebote-filter-header">

                    <div>
                        <h2>Filter</h2>
                        <p>
                            Angebote nach Name, Angebotsart,
                            Angebotsleitung oder Wochentag filtern
                        </p>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="angebote-reset-button"
                            onClick={resetFilters}
                        >
                            Filter zurücksetzen
                        </button>
                    )}

                </div>

                <div className="angebote-filter-grid">

                    <div className="angebote-filter-field">
                        <label htmlFor="angebot-suche">
                            Allgemeine Suche
                        </label>
                        <input
                            id="angebot-suche"
                            type="text"
                            value={search}
                            placeholder="Angebot, Angebotsleitung..."
                            onChange={event => setSearch(event.target.value)}
                        />
                    </div>

                    <div className="angebote-filter-field">
                        <label htmlFor="angebotsart-filter">
                            Angebotsart
                        </label>
                        <select
                            id="angebotsart-filter"
                            value={artFilter}
                            onChange={event => setArtFilter(event.target.value)}
                        >
                            <option value="">Alle Angebotsarten</option>

                            {angebotsarten.map(art => (
                                <option key={art} value={art}>
                                    {art}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="angebote-filter-field">
                        <label htmlFor="angebot-wochentag-filter">
                            Wochentag
                        </label>
                        <select
                            id="angebot-wochentag-filter"
                            value={wochentagFilter}
                            onChange={event =>
                                setWochentagFilter(event.target.value)
                            }
                        >
                            <option value="">Alle Wochentage</option>

                            {WOCHENTAGE.map(tag => (
                                <option key={tag} value={tag}>
                                    {tag}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>

            </section>

            <section className="angebote-content">

                <div className="angebote-toolbar">
                    <span className="angebote-result-count">
                        {sortedAngebote.length}{' '}
                        {sortedAngebote.length === 1 ? 'Angebot' : 'Angebote'}
                    </span>
                </div>

                <div className="angebote-table-scroll">

                    <table className="angebote-table">

                        <thead>
                        <tr>
                            {COLUMNS.map(column => (
                                <th
                                    key={column.key}
                                    className="angebote-sortable-header"
                                    onClick={() => handleSort(column.key)}
                                >
                                    {column.label}
                                    {renderSortIndicator(column.key)}
                                </th>
                            ))}
                            {!readOnly && (
                                <th className="angebote-actions-header">
                                    Aktionen
                                </th>
                            )}
                        </tr>
                        </thead>

                        <tbody>

                        {loading ? (
                            <tr>
                                <td colSpan={readOnly ? 6 : 7} className="angebote-empty-row">
                                    Angebote werden geladen...
                                </td>
                            </tr>
                        ) : sortedAngebote.length === 0 ? (
                            <tr>
                                <td colSpan={readOnly ? 6 : 7} className="angebote-empty-row">
                                    Keine Angebote gefunden.
                                </td>
                            </tr>
                        ) : (
                            sortedAngebote.map(angebot => (
                                <tr
                                    key={angebot.id}
                                    className={
                                        editingId === angebot.id
                                            ? 'angebot-row-editing'
                                            : 'angebot-row-clickable'
                                    }
                                    onClick={() => handleOpen(angebot)}
                                >
                                    {COLUMNS.map(column => (
                                        <td key={column.key}>
                                            {renderCell(angebot, column.key)}
                                        </td>
                                    ))}
                                    {!readOnly && (
                                        <td
                                            className="angebote-action-cell"
                                            onClick={event => event.stopPropagation()}
                                        >
                                            {editingId === angebot.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="angebote-save-button"
                                                        onClick={handleSave}
                                                        disabled={saving}
                                                    >
                                                        {saving
                                                            ? 'Speichern...'
                                                            : 'Speichern'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="angebote-cancel-button"
                                                        onClick={handleCancel}
                                                        disabled={saving}
                                                    >
                                                        Abbrechen
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="angebote-edit-button"
                                                        onClick={() =>
                                                            handleEditStart(angebot)
                                                        }
                                                        disabled={
                                                            editingId !== null ||
                                                            deletingId !== null
                                                        }
                                                    >
                                                        Bearbeiten
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="angebote-delete-button"
                                                        onClick={() =>
                                                            handleDelete(angebot)
                                                        }
                                                        disabled={
                                                            editingId !== null ||
                                                            deletingId !== null
                                                        }
                                                    >
                                                        {deletingId === angebot.id
                                                            ? 'Löschen...'
                                                            : 'Löschen'}
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

export default AngebotePage;