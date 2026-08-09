import React, { useEffect, useMemo, useState } from 'react';

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
    const [kurse, setKurse] = useState([]);
    const [filter, setFilter] = useState('');

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
        const term = filter
            .trim()
            .toLowerCase();

        if (!term) {
            return kurse;
        }

        return kurse.filter((kurs) => {
            return [
                kurs.name,
                kurs.kursleitung,
                kurs.wochentag,
                kurs.uhrzeit,
                kurs.buchungsart,
                kurs.kursgebuehr
            ].some((value) =>
                String(value ?? '')
                    .toLowerCase()
                    .includes(term)
            );
        });
    }, [kurse, filter]);

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

    const handleAdd = () => {
        if (editingId !== null) {
            return;
        }

        const tempId = `new-${Date.now()}`;

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
            kursgebuehr: kurs.kursgebuehr ?? ''
        });

        setError('');
    };

    const handleEditChange = (field, value) => {
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
                    : Number(editData.kursgebuehr)
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
            Number(editData.kursgebuehr) < 0
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

            const payload = createPayload();

            let savedKurs;

            if (typeof editingId === 'number') {
                savedKurs = await updateKurs(
                    editingId,
                    payload
                );
            } else {
                savedKurs = await createKurs(
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
        if (typeof editingId !== 'number') {
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
        const confirmed = window.confirm(
            `Möchten Sie den Kurs „${kurs.name}“ wirklich löschen?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError('');

            if (typeof kurs.id === 'number') {
                await deleteKurs(kurs.id);
            }

            setKurse((previous) =>
                previous.filter(
                    (item) =>
                        item.id !== kurs.id
                )
            );

            if (editingId === kurs.id) {
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

    const formatKursgebuehr = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return '–';
        }

        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(Number(value));
    };

    const getBadgeClass = (buchungsart) => {
        const normalized = String(
            buchungsart || ''
        )
            .toLowerCase()
            .replace(/\s+/g, '-');

        return `kurs-badge kurs-badge-${normalized}`;
    };

    const renderCell = (kurs, field) => {
        const isEditing =
            editingId === kurs.id;

        if (!isEditing) {
            if (field === 'kursgebuehr') {
                return (
                    <span className="kurs-fee">
                        {formatKursgebuehr(
                            kurs.kursgebuehr
                        )}
                    </span>
                );
            }

            if (field === 'buchungsart') {
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
                                {kurs.wochentag || 'Kein Tag'}

                                {kurs.uhrzeit
                                    ? ` · ${kurs.uhrzeit}`
                                    : ''}
                            </small>
                        </div>
                    </div>
                );
            }

            return kurs[field] || '–';
        }

        if (field === 'wochentag') {
            return (
                <select
                    className="kurs-edit-input"
                    value={editData[field] ?? ''}
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

                    {WOCHENTAGE.map((tag) => (
                        <option
                            key={tag}
                            value={tag}
                        >
                            {tag}
                        </option>
                    ))}
                </select>
            );
        }

        if (field === 'buchungsart') {
            return (
                <select
                    className="kurs-edit-input"
                    value={editData[field] ?? ''}
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

                    {BUCHUNGSARTEN.map((art) => (
                        <option
                            key={art}
                            value={art}
                        >
                            {art}
                        </option>
                    ))}
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
                value={editData[field] ?? ''}
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
                    disabled={editingId !== null}
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

            <section className="kurse-content">

                <div className="kurse-toolbar">
                    <div className="kurse-search">
                        <span className="kurse-search-icon">
                            ⌕
                        </span>

                        <input
                            className="kurse-filter-input"
                            type="text"
                            placeholder="Nach Kurs, Kursleitung oder Buchungsart suchen..."
                            value={filter}
                            onChange={(event) =>
                                setFilter(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <span className="kurse-result-count">
                        {filteredKurse.length}{' '}

                        {filteredKurse.length === 1
                            ? 'Kurs'
                            : 'Kurse'}
                    </span>
                </div>

                <div className="kurse-table-scroll">
                    <table className="kurse-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Kursleitung</th>
                            <th>Wochentag</th>
                            <th>Uhrzeit</th>
                            <th>Buchungsart</th>
                            <th>Kursgebühr</th>

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
                        ) : filteredKurse.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="kurse-empty-row"
                                >
                                    Keine Kurse gefunden.
                                </td>
                            </tr>
                        ) : (
                            filteredKurse.map((kurs) => (
                                <tr
                                    key={kurs.id}
                                    className={
                                        editingId === kurs.id
                                            ? 'kurs-row-editing'
                                            : ''
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

                                    <td className="kurse-action-cell">
                                        {editingId === kurs.id ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="kurse-save-button"
                                                    onClick={handleEditSave}
                                                    disabled={saving}
                                                >
                                                    {saving
                                                        ? 'Speichern...'
                                                        : 'Speichern'}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="kurse-cancel-button"
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
                                                    className="kurse-edit-button"
                                                    onClick={() =>
                                                        handleEditStart(
                                                            kurs
                                                        )
                                                    }
                                                    disabled={
                                                        editingId !== null
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
                                                        editingId !== null
                                                    }
                                                    aria-label={`${kurs.name} löschen`}
                                                >
                                                    Löschen
                                                </button>
                                            </>
                                        )}
                                    </td>
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

export default KursePage;