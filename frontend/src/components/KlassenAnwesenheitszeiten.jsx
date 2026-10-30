import React, { useEffect, useState } from 'react';

import {
    getKlassenJahrgaenge,
    getKlassenAnwesenheitszeiten,
    saveKlassenAnwesenheitszeiten
} from '../services/klassenAnwesenheitszeitenService';

import './KlassenAnwesenheitszeiten.css';

const WOCHENTAGE = [
    { key: 'MONDAY', label: 'Mo' },
    { key: 'TUESDAY', label: 'Di' },
    { key: 'WEDNESDAY', label: 'Mi' },
    { key: 'THURSDAY', label: 'Do' },
    { key: 'FRIDAY', label: 'Fr' }
];

const emptyZeiten = () =>
    WOCHENTAGE.map(tag => ({
        wochentag: tag.key,
        beginn: '',
        ende: ''
    }));

function KlassenAnwesenheitszeiten({ klasseId, isAdmin = false }) {

    const [jahrgaenge, setJahrgaenge] = useState([]);
    const [jahrgang, setJahrgang] = useState('');
    const [zeiten, setZeiten] = useState(emptyZeiten());

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let active = true;

        const loadJahrgaenge = async () => {
            try {
                setLoading(true);
                setError('');
                setMessage('');
                setJahrgang('');
                setZeiten(emptyZeiten());

                const data = await getKlassenJahrgaenge(klasseId);

                if (!active) return;

                const values = Array.isArray(data) ? data : [];
                setJahrgaenge(values);
                setJahrgang(values.length > 0 ? String(values[0]) : '');
            } catch (err) {
                if (active) {
                    setError(err.message || 'Jahrgänge konnten nicht geladen werden.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadJahrgaenge();

        return () => {
            active = false;
        };
    }, [klasseId]);

    useEffect(() => {
        if (!jahrgang) return;

        let active = true;

        const loadZeiten = async () => {
            try {
                setLoading(true);
                setError('');
                setMessage('');

                const data = await getKlassenAnwesenheitszeiten(
                    klasseId,
                    jahrgang
                );

                if (!active) return;

                const saved = Array.isArray(data) ? data : [];

                setZeiten(
                    WOCHENTAGE.map(tag => {
                        const item = saved.find(
                            zeit => zeit.wochentag === tag.key
                        );

                        return {
                            wochentag: tag.key,
                            beginn: item?.beginn?.slice(0, 5) || '',
                            ende: item?.ende?.slice(0, 5) || ''
                        };
                    })
                );
            } catch (err) {
                if (active) {
                    setError(err.message || 'Anwesenheitszeiten konnten nicht geladen werden.');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadZeiten();

        return () => {
            active = false;
        };
    }, [klasseId, jahrgang]);

    const updateZeit = (wochentag, field, value) => {
        setZeiten(previous =>
            previous.map(zeit =>
                zeit.wochentag === wochentag
                    ? { ...zeit, [field]: value }
                    : zeit
            )
        );

        setMessage('');
    };

    const handleSave = async () => {
        if (!isAdmin || saving || !jahrgang) return;

        for (const zeit of zeiten) {
            if (
                zeit.beginn &&
                zeit.ende &&
                zeit.beginn >= zeit.ende
            ) {
                setError(
                    'Die Beginnzeit muss vor der Endzeit liegen.'
                );
                return;
            }
        }

        try {
            setSaving(true);
            setError('');
            setMessage('');

            const payload = zeiten.map(zeit => ({
                wochentag: zeit.wochentag,
                beginn: zeit.beginn || null,
                ende: zeit.ende || null
            }));

            const result = await saveKlassenAnwesenheitszeiten(
                klasseId,
                Number(jahrgang),
                payload
            );

            const saved = Array.isArray(result) ? result : [];

            setZeiten(
                WOCHENTAGE.map(tag => {
                    const item = saved.find(
                        zeit => zeit.wochentag === tag.key
                    );

                    return {
                        wochentag: tag.key,
                        beginn: item?.beginn?.slice(0, 5) || '',
                        ende: item?.ende?.slice(0, 5) || ''
                    };
                })
            );

            setMessage('Anwesenheitszeiten wurden gespeichert.');
        } catch (err) {
            setError(err.message || 'Speichern fehlgeschlagen.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="klassen-zeiten-section">

            <div className="klassen-zeiten-header">
                <div>
                    <h2>Anwesenheitszeiten</h2>
                    <p>
                        Individuelle Zeiten pro Jahrgang und Wochentag
                    </p>
                </div>

                <div className="klassen-zeiten-jahrgang">
                    <label htmlFor="klassen-zeiten-jahrgang">
                        Jahrgang
                    </label>

                    <select
                        id="klassen-zeiten-jahrgang"
                        value={jahrgang}
                        onChange={event => setJahrgang(event.target.value)}
                        disabled={loading || saving || jahrgaenge.length === 0}
                    >
                        {jahrgaenge.length === 0 && (
                            <option value="">Keine Jahrgänge</option>
                        )}

                        {jahrgaenge.map(value => (
                            <option key={value} value={value}>
                                Jahrgang {value}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="klassen-zeiten-error" role="alert">
                    {error}
                </div>
            )}

            {message && (
                <div className="klassen-zeiten-success">
                    {message}
                </div>
            )}

            {jahrgaenge.length === 0 && !loading ? (
                <p className="klassen-zeiten-empty">
                    Dieser Klasse sind noch keine Jahrgänge zugeordnet.
                </p>
            ) : (
                <>
                    <div className="klassen-zeiten-table-scroll">
                        <table className="klassen-zeiten-table">
                            <thead>
                            <tr>
                                <th></th>
                                {WOCHENTAGE.map(tag => (
                                    <th key={tag.key}>{tag.label}</th>
                                ))}
                            </tr>
                            </thead>

                            <tbody>
                            {['beginn', 'ende'].map(field => (
                                <tr key={field}>
                                    <th>
                                        {field === 'beginn' ? 'Beginn' : 'Ende'}
                                    </th>

                                    {WOCHENTAGE.map(tag => {
                                        const zeit = zeiten.find(
                                            item => item.wochentag === tag.key
                                        );

                                        return (
                                            <td key={tag.key}>
                                                {isAdmin ? (
                                                    <input
                                                        type="time"
                                                        value={zeit?.[field] || ''}
                                                        disabled={loading || saving}
                                                        onChange={event =>
                                                            updateZeit(
                                                                tag.key,
                                                                field,
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <span>
                                                        {zeit?.[field] || '–'}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {isAdmin && (
                        <div className="klassen-zeiten-actions">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={loading || saving || !jahrgang}
                            >
                                {saving ? 'Wird gespeichert...' : 'Speichern'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

export default KlassenAnwesenheitszeiten;