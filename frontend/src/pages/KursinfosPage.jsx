import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
    getKurse
} from '../services/kursService';

import './KursinfosPage.css';

function KursinfosPage() {

    const navigate = useNavigate();

    const [kurse, setKurse] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filter, setFilter] = useState('');

    /* =====================================================
       KURSE LADEN
       ===================================================== */

    useEffect(() => {

        const loadKurse = async () => {

            try {

                setLoading(true);
                setError('');

                const data =
                    await getKurse();

                setKurse(
                    Array.isArray(data)
                        ? data
                        : []
                );

            } catch (error) {

                console.error(
                    'Kursinfos konnten nicht geladen werden:',
                    error
                );

                setError(
                    'Die Kursinfos konnten nicht geladen werden.'
                );

            } finally {

                setLoading(false);
            }
        };

        loadKurse();

    }, []);

    /* =====================================================
       FILTER
       ===================================================== */

    const filteredKurse =
        useMemo(() => {

            const term =
                filter
                    .trim()
                    .toLowerCase();

            if (!term) {
                return kurse;
            }

            return kurse.filter(
                (kurs) =>
                    [
                        kurs.name,
                        kurs.kursleitung,
                        kurs.wochentag,
                        kurs.uhrzeit,
                        kurs.uhrzeitEnde
                    ].some(
                        (value) =>
                            String(value ?? '')
                                .toLowerCase()
                                .includes(term)
                    )
            );

        }, [
            kurse,
            filter
        ]);

    /* =====================================================
       SORTIERUNG
       ===================================================== */

    const sortedKurse =
        useMemo(() => {

            const wochentagOrder = {
                Montag: 1,
                Dienstag: 2,
                Mittwoch: 3,
                Donnerstag: 4,
                Freitag: 5
            };

            return [
                ...filteredKurse
            ].sort(
                (a, b) => {

                    const tagA =
                        wochentagOrder[
                            a.wochentag
                            ] ?? 99;

                    const tagB =
                        wochentagOrder[
                            b.wochentag
                            ] ?? 99;

                    if (tagA !== tagB) {
                        return tagA - tagB;
                    }

                    const zeitVergleich =
                        String(
                            a.uhrzeit ?? ''
                        ).localeCompare(
                            String(
                                b.uhrzeit ?? ''
                            )
                        );

                    if (zeitVergleich !== 0) {
                        return zeitVergleich;
                    }

                    return String(
                        a.name ?? ''
                    ).localeCompare(
                        String(
                            b.name ?? ''
                        ),
                        'de'
                    );
                }
            );

        }, [
            filteredKurse
        ]);

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="kursinfos-page">

            <header className="page-header">

                <div className="page-header-content">

                    <h1>
                        Kursinfos
                    </h1>

                    <p>
                        Übersicht der Kurse und Kursinformationen
                    </p>

                </div>

            </header>

            {error && (

                <div className="kursinfos-error">
                    {error}
                </div>

            )}

            <section className="kursinfos-content">

                <div className="kursinfos-toolbar">

                    <input
                        type="text"
                        placeholder="Kurs suchen..."
                        value={filter}
                        onChange={
                            (event) =>
                                setFilter(
                                    event.target.value
                                )
                        }
                    />

                    <span>
                        {sortedKurse.length}{' '}
                        {sortedKurse.length === 1
                            ? 'Kurs'
                            : 'Kurse'}
                    </span>

                </div>

                <div className="kursinfos-table-scroll">

                    <table className="kursinfos-table">

                        <thead>

                        <tr>
                            <th>Kurs</th>
                            <th>Kursleitung</th>
                            <th>Wochentag</th>
                            <th>Beginn</th>
                            <th>Ende</th>
                        </tr>

                        </thead>

                        <tbody>

                        {loading ? (

                            <tr>
                                <td
                                    colSpan="5"
                                    className="kursinfos-empty"
                                >
                                    Kurse werden geladen...
                                </td>
                            </tr>

                        ) : sortedKurse.length === 0 ? (

                            <tr>
                                <td
                                    colSpan="5"
                                    className="kursinfos-empty"
                                >
                                    Keine Kurse gefunden.
                                </td>
                            </tr>

                        ) : (

                            sortedKurse.map(
                                (kurs) => (

                                    <tr
                                        key={kurs.id}
                                        className="kursinfos-row"
                                        onClick={() =>
                                            navigate(
                                                `/kursinfos/${kurs.id}`
                                            )
                                        }
                                    >

                                        <td>
                                            <strong>
                                                {kurs.name || '–'}
                                            </strong>
                                        </td>

                                        <td>
                                            {kurs.kursleitung || '–'}
                                        </td>

                                        <td>
                                            {kurs.wochentag || '–'}
                                        </td>

                                        <td>
                                            {kurs.uhrzeit || '–'}
                                        </td>

                                        <td>
                                            {kurs.uhrzeitEnde || '–'}
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

export default KursinfosPage;