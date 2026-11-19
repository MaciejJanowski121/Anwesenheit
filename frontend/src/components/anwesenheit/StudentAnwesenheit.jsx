import React, {
    useMemo,
    useState
} from 'react';

import {
    formatDatum,
    formatTime
} from './AnwesenheitUtils';

import './StudentAnwesenheit.css';


/* =====================================================
   STATUS
   ===================================================== */

const STATUS_OPTIONS = [

    {
        value: 'ANWESEND',
        label: 'Anwesend'
    },

    {
        value: 'FEHLT',
        label: 'Fehlt'
    },

    {
        value: 'TEILWEISE',
        label: 'Teilweise abwesend'
    },

    {
        value: 'UNGEPRUEFT',
        label: 'Ungeprüft'
    }

];


/* =====================================================
   STATUS ERMITTELN
   ===================================================== */

function getAttendanceStatus(anwesenheit) {

    if (anwesenheit.status === 'FEHLT') {

        return 'FEHLT';
    }

    if (
        anwesenheit.abwesendAb ||
        anwesenheit.abwesendBis
    ) {

        return 'TEILWEISE';
    }

    if (anwesenheit.status === 'ANWESEND') {

        return 'ANWESEND';
    }

    return 'UNGEPRUEFT';
}


/* =====================================================
   STATUS LABEL
   ===================================================== */

function getStatusLabel(status) {

    return STATUS_OPTIONS.find(

        option => option.value === status

    )?.label || 'Ungeprüft';
}


/* =====================================================
   STUDENT ANWESENHEIT
   ===================================================== */

function StudentAnwesenheit({

                                anwesenheiten = []

                            }) {

    /* =====================================================
       FILTER
       ===================================================== */

    const [datumVon, setDatumVon] =
        useState('');

    const [datumBis, setDatumBis] =
        useState('');

    const [statusFilter, setStatusFilter] =
        useState('');


    /* =====================================================
       FILTER AKTIV
       ===================================================== */

    const hasFilter = Boolean(

        datumVon ||

        datumBis ||

        statusFilter
    );


    /* =====================================================
       DATUM VALIDIEREN
       ===================================================== */

    const invalidDateRange = Boolean(

        datumVon &&

        datumBis &&

        datumVon > datumBis
    );


    /* =====================================================
       ANWESENHEITEN FILTERN
       ===================================================== */

    const filteredAnwesenheiten = useMemo(() => {

        if (invalidDateRange) {

            return [];
        }

        return [...anwesenheiten]

            .filter(anwesenheit => {

                const datum =
                    String(anwesenheit.datum ?? '');

                const status =
                    getAttendanceStatus(anwesenheit);

                const matchesVon =

                    !datumVon ||

                    datum >= datumVon;

                const matchesBis =

                    !datumBis ||

                    datum <= datumBis;

                const matchesStatus =

                    !statusFilter ||

                    status === statusFilter;

                return (

                    matchesVon &&

                    matchesBis &&

                    matchesStatus
                );
            })

            .sort((a, b) =>

                String(b.datum ?? '')

                    .localeCompare(

                        String(a.datum ?? '')
                    )
            );

    }, [

        anwesenheiten,

        datumVon,

        datumBis,

        statusFilter,

        invalidDateRange

    ]);


    /* =====================================================
       STATISTIK
       ===================================================== */

    const statistik = useMemo(() => {

        const result = {

            insgesamt: 0,

            anwesend: 0,

            fehlend: 0,

            teilweise: 0,

            ungeprueft: 0

        };

        filteredAnwesenheiten.forEach(anwesenheit => {

            result.insgesamt++;

            const status =
                getAttendanceStatus(anwesenheit);

            switch (status) {

                case 'ANWESEND':

                    result.anwesend++;

                    break;

                case 'FEHLT':

                    result.fehlend++;

                    break;

                case 'TEILWEISE':

                    result.teilweise++;

                    break;

                default:

                    result.ungeprueft++;
            }
        });

        return result;

    }, [filteredAnwesenheiten]);


    /* =====================================================
       FILTER ZURÜCKSETZEN
       ===================================================== */

    const resetFilter = () => {

        setDatumVon('');

        setDatumBis('');

        setStatusFilter('');
    };


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <section className="student-anwesenheit">

            {/* HEADER */}

            <div className="student-anwesenheit-header">

                <div>

                    <h3>

                        Anwesenheit

                    </h3>

                    <p>

                        Übersicht der gespeicherten
                        Tagesanwesenheiten

                    </p>

                </div>

                {hasFilter && (

                    <button
                        type="button"
                        className="student-anwesenheit-reset"
                        onClick={resetFilter}
                    >

                        Filter zurücksetzen

                    </button>

                )}

            </div>


            {/* FILTER */}

            <div className="student-anwesenheit-filter">

                <div className="student-anwesenheit-field">

                    <label htmlFor="student-anwesenheit-von">

                        Datum von

                    </label>

                    <input
                        id="student-anwesenheit-von"
                        type="date"
                        value={datumVon}
                        onChange={event =>

                            setDatumVon(event.target.value)

                        }
                    />

                </div>


                <div className="student-anwesenheit-field">

                    <label htmlFor="student-anwesenheit-bis">

                        Datum bis

                    </label>

                    <input
                        id="student-anwesenheit-bis"
                        type="date"
                        value={datumBis}
                        onChange={event =>

                            setDatumBis(event.target.value)

                        }
                    />

                </div>


                <div className="student-anwesenheit-field">

                    <label htmlFor="student-anwesenheit-status">

                        Status

                    </label>

                    <select
                        id="student-anwesenheit-status"
                        value={statusFilter}
                        onChange={event =>

                            setStatusFilter(event.target.value)

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


            {/* FEHLER */}

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

            <div className="student-anwesenheit-statistik">

                <div className="student-anwesenheit-card">

                    <span>

                        Erfasste Tage

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


                <div className="student-anwesenheit-card absent">

                    <span>

                        Fehlt

                    </span>

                    <strong>

                        {statistik.fehlend}

                    </strong>

                </div>


                <div className="student-anwesenheit-card partial">

                    <span>

                        Teilweise abwesend

                    </span>

                    <strong>

                        {statistik.teilweise}

                    </strong>

                </div>


                <div className="student-anwesenheit-card unchecked">

                    <span>

                        Ungeprüft

                    </span>

                    <strong>

                        {statistik.ungeprueft}

                    </strong>

                </div>

            </div>


            {/* ANZAHL */}

            <div className="student-anwesenheit-count">

                <strong>

                    {filteredAnwesenheiten.length}

                </strong>

                {' '}

                {filteredAnwesenheiten.length === 1

                    ? 'Eintrag'

                    : 'Einträge'

                }

            </div>


            {/* TABELLE */}

            {filteredAnwesenheiten.length > 0 ? (

                <div className="student-anwesenheit-table-scroll">

                    <table className="student-anwesenheit-table">

                        <thead>

                        <tr>

                            <th>Datum</th>

                            <th>Status</th>

                            <th>Abwesend ab</th>

                            <th>Abwesend bis</th>

                            <th>Grund Abwesenheit</th>

                            <th>ANA Anwesenheitskontrolle</th>

                            <th>Bemerkung</th>

                        </tr>

                        </thead>


                        <tbody>

                        {filteredAnwesenheiten.map(anwesenheit => {

                            const status =
                                getAttendanceStatus(anwesenheit);

                            return (

                                <tr key={anwesenheit.id}>

                                    {/* DATUM */}

                                    <td className="student-anwesenheit-date">

                                        {formatDatum(anwesenheit.datum)}

                                    </td>


                                    {/* STATUS */}

                                    <td>

                                        <span
                                            className={

                                                `student-anwesenheit-status ${

                                                    status.toLowerCase()

                                                }`

                                            }
                                        >

                                            {getStatusLabel(status)}

                                        </span>

                                    </td>


                                    {/* ABWESEND AB */}

                                    <td className="student-anwesenheit-time">

                                        {formatTime(

                                            anwesenheit.abwesendAb

                                        ) || '–'}

                                    </td>


                                    {/* ABWESEND BIS */}

                                    <td className="student-anwesenheit-time">

                                        {formatTime(

                                            anwesenheit.abwesendBis

                                        ) || '–'}

                                    </td>


                                    {/* GRUND */}

                                    <td className="student-anwesenheit-note">

                                        {anwesenheit.grundAbwesenheit || '–'}

                                    </td>


                                    {/* ANA KONTROLLE */}

                                    <td className="student-anwesenheit-check">

                                        <span
                                            className={

                                                anwesenheit.anaAnwesenheitskontrolle

                                                    ? 'student-ana-checked'

                                                    : 'student-ana-unchecked'

                                            }
                                        >

                                            {anwesenheit.anaAnwesenheitskontrolle

                                                ? '✓ Geprüft'

                                                : 'Nicht geprüft'

                                            }

                                        </span>

                                    </td>


                                    {/* BEMERKUNG */}

                                    <td className="student-anwesenheit-note">

                                        {anwesenheit.bemerkung || '–'}

                                    </td>

                                </tr>

                            );

                        })}

                        </tbody>

                    </table>

                </div>

            ) : (

                <p className="student-anwesenheit-empty">

                    {invalidDateRange

                        ? 'Bitte überprüfen Sie den Zeitraum.'

                        : anwesenheiten.length > 0

                            ? 'Keine Anwesenheiten für die aktuelle Filterauswahl gefunden.'

                            : 'Noch keine Anwesenheitsdaten vorhanden.'

                    }

                </p>

            )}


            {/* HINWEIS */}

            <p className="student-anwesenheit-hint">

                Die Statistik berücksichtigt ausschließlich
                gespeicherte Tagesanwesenheiten.

                Tage ohne Eintrag werden nicht gezählt.

                Teilweise abwesende Schüler werden separat
                ausgewiesen.

            </p>

        </section>
    );
}

export default StudentAnwesenheit;