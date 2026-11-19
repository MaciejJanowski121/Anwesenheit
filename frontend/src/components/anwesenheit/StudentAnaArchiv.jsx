import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    getAnwesenheitenByStudent
} from '../../services/anwesenheitService';

import {
    formatDatum
} from './AnwesenheitUtils';

import './StudentAnwesenheit.css';
import './StudentAnaArchiv.css';


const STATUS_OPTIONS = [
    {
        value: 'ANWESEND',
        label: 'Anwesend'
    },
    {
        value: 'ENTSCHULDIGT',
        label: 'Entschuldigt'
    },
    {
        value: 'FEHLT',
        label: 'Fehlt'
    }
];


function getStatusLabel(status) {

    return STATUS_OPTIONS.find(
        option => option.value === status
    )?.label || status || 'Unbekannt';
}


function StudentAnaArchiv({ studentId }) {

    const [anwesenheiten, setAnwesenheiten] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [expanded, setExpanded] =
        useState(false);

    const [datumVon, setDatumVon] =
        useState('');

    const [datumBis, setDatumBis] =
        useState('');

    const [statusFilter, setStatusFilter] =
        useState('');

    const [kursFilter, setKursFilter] =
        useState('');


    /* =====================================================
       HISTORISCHE ANA-ANWESENHEITEN LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const loadArchiv = async () => {

            try {

                setLoading(true);
                setError('');
                setAnwesenheiten([]);

                const data =
                    await getAnwesenheitenByStudent(
                        studentId
                    );

                if (active) {

                    setAnwesenheiten(
                        Array.isArray(data)
                            ? data
                            : []
                    );
                }

            } catch (error) {

                console.error(
                    'ANA-Archiv konnte nicht geladen werden:',
                    error
                );

                if (active) {

                    setError(
                        'Das ANA-Anwesenheitsarchiv konnte nicht geladen werden.'
                    );
                }

            } finally {

                if (active) {
                    setLoading(false);
                }
            }
        };

        if (studentId != null) {
            loadArchiv();
        } else {
            setLoading(false);
        }

        return () => {
            active = false;
        };

    }, [studentId]);


    /* =====================================================
       VERFÜGBARE KURSE
       ===================================================== */

    const kurse = useMemo(() => {

        const result = new Map();

        anwesenheiten.forEach(anwesenheit => {

            const kurs = anwesenheit.kurs;

            if (kurs?.id != null) {

                result.set(
                    String(kurs.id),
                    kurs.name || 'Unbekannter Kurs'
                );
            }
        });

        return [...result.entries()]
            .map(([id, name]) => ({
                id,
                name
            }))
            .sort((a, b) =>
                a.name.localeCompare(
                    b.name,
                    'de'
                )
            );

    }, [anwesenheiten]);


    /* =====================================================
       FILTER
       ===================================================== */

    const invalidDateRange = Boolean(
        datumVon &&
        datumBis &&
        datumVon > datumBis
    );

    const hasFilter = Boolean(
        datumVon ||
        datumBis ||
        statusFilter ||
        kursFilter
    );


    const filteredAnwesenheiten = useMemo(() => {

        if (invalidDateRange) {
            return [];
        }

        return [...anwesenheiten]

            .filter(anwesenheit => {

                const datum =
                    String(anwesenheit.datum ?? '');

                return (

                    (!datumVon || datum >= datumVon) &&

                    (!datumBis || datum <= datumBis) &&

                    (
                        !statusFilter ||
                        anwesenheit.status === statusFilter
                    ) &&

                    (
                        !kursFilter ||
                        String(anwesenheit.kurs?.id) ===
                        kursFilter
                    )
                );
            })

            .sort((a, b) => {

                const dateComparison =
                    String(b.datum ?? '')
                        .localeCompare(
                            String(a.datum ?? '')
                        );

                if (dateComparison !== 0) {
                    return dateComparison;
                }

                return String(a.kurs?.name ?? '')
                    .localeCompare(
                        String(b.kurs?.name ?? ''),
                        'de'
                    );
            });

    }, [
        anwesenheiten,
        datumVon,
        datumBis,
        statusFilter,
        kursFilter,
        invalidDateRange
    ]);


    /* =====================================================
       STATISTIK
       ===================================================== */

    const statistik = useMemo(() => {

        return {

            insgesamt:
            filteredAnwesenheiten.length,

            anwesend:
            filteredAnwesenheiten.filter(
                entry =>
                    entry.status === 'ANWESEND'
            ).length,

            entschuldigt:
            filteredAnwesenheiten.filter(
                entry =>
                    entry.status === 'ENTSCHULDIGT'
            ).length,

            fehlend:
            filteredAnwesenheiten.filter(
                entry =>
                    entry.status === 'FEHLT'
            ).length
        };

    }, [filteredAnwesenheiten]);


    const resetFilter = () => {

        setDatumVon('');
        setDatumBis('');
        setStatusFilter('');
        setKursFilter('');
    };


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <section className="student-anwesenheit student-ana-archiv">

            <div className="student-anwesenheit-header">

                <div>

                    <div className="student-ana-archiv-title">

                        <h3>
                            ANA-Anwesenheitsarchiv
                        </h3>

                        <span className="student-ana-archiv-badge">
                            Archiv
                        </span>

                    </div>

                    <p>
                        Historische Anwesenheiten aus der
                        bisherigen ANA-Anwesenheitserfassung
                    </p>

                </div>

                <button
                    type="button"
                    className="student-anwesenheit-reset"
                    aria-expanded={expanded}
                    onClick={() =>
                        setExpanded(previous => !previous)
                    }
                >

                    {expanded
                        ? 'Archiv ausblenden ▲'
                        : 'Archiv anzeigen ▼'}

                </button>

            </div>


            {!expanded && (

                <p className="student-anwesenheit-hint">

                    {loading
                        ? 'Archiv wird geladen...'
                        : error
                            ? error
                            : `${anwesenheiten.length} historische ANA-Einträge vorhanden.`}

                </p>

            )}


            {expanded && (

                <>

                    {loading ? (

                        <p className="student-anwesenheit-empty">
                            Archiv wird geladen...
                        </p>

                    ) : error ? (

                        <div
                            className="student-anwesenheit-error"
                            role="alert"
                        >
                            {error}
                        </div>

                    ) : (

                        <>

                            {/* FILTER */}

                            <div className="student-anwesenheit-filter">

                                <div className="student-anwesenheit-field">

                                    <label htmlFor="ana-archiv-von">
                                        Datum von
                                    </label>

                                    <input
                                        id="ana-archiv-von"
                                        type="date"
                                        value={datumVon}
                                        onChange={event =>
                                            setDatumVon(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>


                                <div className="student-anwesenheit-field">

                                    <label htmlFor="ana-archiv-bis">
                                        Datum bis
                                    </label>

                                    <input
                                        id="ana-archiv-bis"
                                        type="date"
                                        value={datumBis}
                                        onChange={event =>
                                            setDatumBis(
                                                event.target.value
                                            )
                                        }
                                    />

                                </div>


                                <div className="student-anwesenheit-field">

                                    <label htmlFor="ana-archiv-kurs">
                                        ANA-Kurs
                                    </label>

                                    <select
                                        id="ana-archiv-kurs"
                                        value={kursFilter}
                                        onChange={event =>
                                            setKursFilter(
                                                event.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Alle Kurse
                                        </option>

                                        {kurse.map(kurs => (

                                            <option
                                                key={kurs.id}
                                                value={kurs.id}
                                            >
                                                {kurs.name}
                                            </option>

                                        ))}

                                    </select>

                                </div>


                                <div className="student-anwesenheit-field">

                                    <label htmlFor="ana-archiv-status">
                                        Status
                                    </label>

                                    <select
                                        id="ana-archiv-status"
                                        value={statusFilter}
                                        onChange={event =>
                                            setStatusFilter(
                                                event.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Alle Status
                                        </option>

                                        {STATUS_OPTIONS.map(option => (

                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            </div>


                            {hasFilter && (

                                <div className="student-ana-archiv-reset-row">

                                    <button
                                        type="button"
                                        className="student-anwesenheit-reset"
                                        onClick={resetFilter}
                                    >
                                        Filter zurücksetzen
                                    </button>

                                </div>

                            )}


                            {invalidDateRange && (

                                <div
                                    className="student-anwesenheit-error"
                                    role="alert"
                                >
                                    Das Enddatum darf nicht vor
                                    dem Startdatum liegen.
                                </div>

                            )}


                            {/* STATISTIK */}

                            <div className="student-anwesenheit-statistik student-ana-archiv-statistik">

                                <div className="student-anwesenheit-card">

                                    <span>
                                        Erfasste ANA-Einträge
                                    </span>

                                    <strong>
                                        {statistik.insgesamt}
                                    </strong>

                                </div>


                                <div className="student-anwesenheit-card present">

                                    <span>
                                        Anwesend
                                    </span>

                                    <strong>
                                        {statistik.anwesend}
                                    </strong>

                                </div>


                                <div className="student-anwesenheit-card partial">

                                    <span>
                                        Entschuldigt
                                    </span>

                                    <strong>
                                        {statistik.entschuldigt}
                                    </strong>

                                </div>


                                <div className="student-anwesenheit-card absent">

                                    <span>
                                        Fehlt
                                    </span>

                                    <strong>
                                        {statistik.fehlend}
                                    </strong>

                                </div>

                            </div>


                            {/* TABELLE */}

                            <div className="student-anwesenheit-count">

                                <strong>
                                    {filteredAnwesenheiten.length}
                                </strong>

                                {' '}

                                {filteredAnwesenheiten.length === 1
                                    ? 'Eintrag'
                                    : 'Einträge'}

                            </div>


                            {filteredAnwesenheiten.length > 0 ? (

                                <div className="student-anwesenheit-table-scroll">

                                    <table className="student-anwesenheit-table student-ana-archiv-table">

                                        <thead>

                                        <tr>
                                            <th>Datum</th>
                                            <th>ANA-Kurs</th>
                                            <th>Kursleitung</th>
                                            <th>Status</th>
                                            <th>Bemerkung</th>
                                        </tr>

                                        </thead>


                                        <tbody>

                                        {filteredAnwesenheiten.map(
                                            anwesenheit => (

                                                <tr key={anwesenheit.id}>

                                                    <td className="student-anwesenheit-date">

                                                        {formatDatum(
                                                            anwesenheit.datum
                                                        )}

                                                    </td>


                                                    <td>

                                                        {anwesenheit.kurs?.name || '–'}

                                                    </td>


                                                    <td>

                                                        {anwesenheit.kurs?.kursleitung || '–'}

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={
                                                                `student-anwesenheit-status ${
                                                                    String(
                                                                        anwesenheit.status ??
                                                                        'ungeprueft'
                                                                    ).toLowerCase()
                                                                }`
                                                            }
                                                        >

                                                            {getStatusLabel(
                                                                anwesenheit.status
                                                            )}

                                                        </span>

                                                    </td>


                                                    <td className="student-anwesenheit-note">

                                                        {anwesenheit.bemerkung || '–'}

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                        </tbody>

                                    </table>

                                </div>

                            ) : (

                                <p className="student-anwesenheit-empty">

                                    {invalidDateRange

                                        ? 'Bitte überprüfen Sie den Zeitraum.'

                                        : anwesenheiten.length > 0

                                            ? 'Keine Einträge für die aktuelle Filterauswahl gefunden.'

                                            : 'Keine historischen ANA-Anwesenheiten vorhanden.'}

                                </p>

                            )}


                            <p className="student-anwesenheit-hint">

                                Dieses Archiv enthält die historischen
                                Anwesenheiten einzelner ANA-Kurse.

                                Mehrere Einträge pro Schüler und Tag
                                sind möglich.

                                Die Einträge werden nicht in die
                                Statistik der Tagesanwesenheiten
                                übernommen.

                                Das Archiv dient ausschließlich
                                der Einsicht.

                            </p>

                        </>

                    )}

                </>

            )}

        </section>
    );
}

export default StudentAnaArchiv;