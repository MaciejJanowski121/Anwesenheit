import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    getAnwesenheitszeiten
} from '../services/anwesenheitszeitenService';

import {
    getKlassen
} from '../services/klasseService';

import {
    getAngebote
} from '../services/angebotService';

import {
    getKurse
} from '../services/kursService';

import {
    getToday,
    formatDatum,
    formatTime,
    matchesWochentag,
    getErrorMessage
} from '../components/anwesenheit/AnwesenheitUtils';

import './AnwesenheitszeitenPage.css';


/* =====================================================
   FILTER
   ===================================================== */

const FILTER_TYPES = [

    {
        key: 'ALLE',
        label: 'Alle Schüler'
    },

    {
        key: 'KLASSE',
        label: 'Klasse'
    },

    {
        key: 'ANGEBOT',
        label: 'Angebote'
    },

    {
        key: 'ANA',
        label: 'ANA'
    }

];


/* =====================================================
   ANWESENHEITSZEITEN PAGE
   ===================================================== */

function AnwesenheitszeitenPage() {

    /* =====================================================
       FILTER STATE
       ===================================================== */

    const [datum, setDatum] =
        useState(getToday);

    const [filterTyp, setFilterTyp] =
        useState('ALLE');

    const [filterId, setFilterId] =
        useState('');


    /* =====================================================
       STAMMDATEN
       ===================================================== */

    const [klassen, setKlassen] =
        useState([]);

    const [angebote, setAngebote] =
        useState([]);

    const [kurse, setKurse] =
        useState([]);


    /* =====================================================
       ERGEBNIS
       ===================================================== */

    const [result, setResult] =
        useState(null);


    /* =====================================================
       STATUS
       ===================================================== */

    const [initialLoading, setInitialLoading] =
        useState(true);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState('');


    /* =====================================================
       STAMMDATEN LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const initialize = async () => {

            try {

                setInitialLoading(true);

                setError('');

                const today =
                    getToday();

                const [
                    klassenData,
                    angeboteData,
                    kurseData,
                    anwesenheitszeitenData
                ] = await Promise.all([

                    getKlassen(),

                    getAngebote(),

                    getKurse(),

                    getAnwesenheitszeiten(
                        today,
                        'ALLE'
                    )

                ]);

                if (!active) {
                    return;
                }

                setKlassen(klassenData);

                setAngebote(angeboteData);

                setKurse(kurseData);

                setResult(
                    anwesenheitszeitenData
                );

            } catch (err) {

                if (active) {

                    setError(

                        getErrorMessage(

                            err,

                            'Die Anwesenheitszeiten konnten nicht geladen werden.'

                        )
                    );
                }

            } finally {

                if (active) {

                    setInitialLoading(false);
                }
            }
        };

        initialize();

        return () => {

            active = false;
        };

    }, []);


    /* =====================================================
       KLASSEN SORTIEREN
       ===================================================== */

    const sortedKlassen = useMemo(() => {

        return [...klassen].sort(

            (a, b) =>

                String(a.name ?? '')
                    .localeCompare(

                        String(b.name ?? ''),

                        'de'
                    )
        );

    }, [klassen]);


    /* =====================================================
       ANGEBOTE DES GEWÄHLTEN TAGES
       ===================================================== */

    const tagesAngebote = useMemo(() => {

        return angebote

            .filter(angebot =>

                matchesWochentag(

                    angebot.wochentag,

                    datum
                )
            )

            .sort((a, b) =>

                String(a.name ?? '')
                    .localeCompare(

                        String(b.name ?? ''),

                        'de'
                    )
            );

    }, [
        angebote,
        datum
    ]);


    /* =====================================================
       ANA DES GEWÄHLTEN TAGES
       ===================================================== */

    const tagesAna = useMemo(() => {

        return kurse

            .filter(kurs =>

                matchesWochentag(

                    kurs.wochentag,

                    datum
                )
            )

            .sort((a, b) =>

                String(a.name ?? '')
                    .localeCompare(

                        String(b.name ?? ''),

                        'de'
                    )
            );

    }, [
        kurse,
        datum
    ]);


    /* =====================================================
       FILTER WECHSELN
       ===================================================== */

    const handleFilterChange = type => {

        setFilterTyp(type);

        setFilterId('');

        setError('');

        setResult(null);
    };


    /* =====================================================
       DATUM ÄNDERN
       ===================================================== */

    const handleDatumChange = value => {

        setDatum(value);

        setError('');

        setResult(null);

        if (
            filterTyp === 'ANGEBOT' ||
            filterTyp === 'ANA'
        ) {

            setFilterId('');
        }
    };


    /* =====================================================
       FILTER ID ÄNDERN
       ===================================================== */

    const handleFilterIdChange = value => {

        setFilterId(value);

        setResult(null);

        setError('');
    };


    /* =====================================================
       ANWESENHEITSZEITEN LADEN
       ===================================================== */

    const handleLoad = async () => {

        if (loading || initialLoading) {

            return;
        }

        if (!datum) {

            setError(
                'Bitte wählen Sie ein Datum aus.'
            );

            return;
        }

        if (
            filterTyp !== 'ALLE' &&
            !filterId
        ) {

            setError(
                'Bitte wählen Sie eine Gruppe aus.'
            );

            return;
        }

        try {

            setLoading(true);

            setError('');

            setResult(null);

            const data =
                await getAnwesenheitszeiten(

                    datum,

                    filterTyp,

                    filterTyp === 'ALLE'
                        ? null
                        : Number(filterId)
                );

            setResult(data);

        } catch (err) {

            setError(

                getErrorMessage(

                    err,

                    'Die Anwesenheitszeiten konnten nicht berechnet werden.'

                )
            );

        } finally {

            setLoading(false);
        }
    };


    /* =====================================================
       ZEITINTERVALLE
       ===================================================== */

    const zeitintervalle =
        result?.zeitintervalle || [];


    /* =====================================================
       MAXIMALWERTE
       ===================================================== */

    const statistik = useMemo(() => {

        return zeitintervalle.reduce(

            (previous, intervall) => ({

                maxPlan: Math.max(

                    previous.maxPlan,

                    intervall.plan ?? 0
                ),

                maxSoll: Math.max(

                    previous.maxSoll,

                    intervall.soll ?? 0
                ),

                maxIst: Math.max(

                    previous.maxIst,

                    intervall.ist ?? 0
                ),

                maxUngeprueft: Math.max(

                    previous.maxUngeprueft,

                    intervall.ungeprueft ?? 0
                )

            }),

            {

                maxPlan: 0,

                maxSoll: 0,

                maxIst: 0,

                maxUngeprueft: 0

            }
        );

    }, [zeitintervalle]);


    /* =====================================================
       PROZENTWERT
       ===================================================== */

    const getAnwesenheitsquote = (
        ist,
        soll
    ) => {

        if (!soll) {

            return '–';
        }

        return `${(

            (ist / soll) * 100

        ).toLocaleString('de-DE', {

            minimumFractionDigits: 1,

            maximumFractionDigits: 1

        })} %`;
    };


    /* =====================================================
       AUSLASTUNG
       ===================================================== */

    const getBarWidth = (
        value,
        max
    ) => {

        if (!max) {

            return '0%';
        }

        return `${Math.min(

            100,

            (value / max) * 100

        )}%`;
    };


    /* =====================================================
       CONTROLS
       ===================================================== */

    const controlsDisabled =
        loading || initialLoading;


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="anwesenheitszeiten-page">

            {/* PAGE HEADER */}

            <div className="page-header">

                <div className="page-header-content">

                    <h1>
                        Anwesenheitszeiten
                    </h1>

                    <p>
                        Übersicht der geplanten und
                        tatsächlichen Anwesenheit
                    </p>

                </div>

            </div>


            {/* FEHLERMELDUNG */}

            {error && (

                <div
                    className="zeiten-message error"
                    role="alert"
                >

                    {error}

                </div>

            )}


            {/* FILTER */}

            <section className="zeiten-section">

                <div className="zeiten-section-header">

                    <div>

                        <h2>
                            Anwesenheitszeiten berechnen
                        </h2>

                        <p>
                            Datum und Schülergruppe auswählen
                        </p>

                    </div>

                </div>


                {/* FILTER TYP */}

                <div className="zeiten-filter-switch">

                    {FILTER_TYPES.map(type => (

                        <button
                            key={type.key}
                            type="button"
                            disabled={controlsDisabled}
                            className={

                                filterTyp === type.key

                                    ? 'zeiten-filter-button active'

                                    : 'zeiten-filter-button'

                            }
                            onClick={() =>

                                handleFilterChange(type.key)

                            }
                        >

                            {type.label}

                        </button>

                    ))}

                </div>


                {/* FILTER FELDER */}

                <div className="zeiten-toolbar">

                    {/* DATUM */}

                    <div className="zeiten-field">

                        <label htmlFor="zeiten-datum">

                            Datum

                        </label>

                        <input
                            id="zeiten-datum"
                            type="date"
                            value={datum}
                            disabled={controlsDisabled}
                            onChange={event =>

                                handleDatumChange(

                                    event.target.value

                                )

                            }
                        />

                    </div>


                    {/* KLASSE */}

                    {filterTyp === 'KLASSE' && (

                        <div className="zeiten-field zeiten-field-large">

                            <label htmlFor="zeiten-klasse">

                                Klasse

                            </label>

                            <select
                                id="zeiten-klasse"
                                value={filterId}
                                disabled={controlsDisabled}
                                onChange={event =>

                                    handleFilterIdChange(

                                        event.target.value

                                    )

                                }
                            >

                                <option value="">

                                    Klasse auswählen

                                </option>

                                {sortedKlassen.map(klasse => (

                                    <option
                                        key={klasse.id}
                                        value={klasse.id}
                                    >

                                        {klasse.name}

                                    </option>

                                ))}

                            </select>

                        </div>

                    )}


                    {/* ANGEBOTE */}

                    {filterTyp === 'ANGEBOT' && (

                        <div className="zeiten-field zeiten-field-large">

                            <label htmlFor="zeiten-angebot">

                                Angebot

                            </label>

                            <select
                                id="zeiten-angebot"
                                value={filterId}
                                disabled={controlsDisabled}
                                onChange={event =>

                                    handleFilterIdChange(

                                        event.target.value

                                    )

                                }
                            >

                                <option value="">

                                    Angebot auswählen

                                </option>

                                {tagesAngebote.map(angebot => (

                                    <option
                                        key={angebot.id}
                                        value={angebot.id}
                                    >

                                        {angebot.name}

                                        {' · '}

                                        {formatTime(angebot.beginn)}

                                        {' – '}

                                        {formatTime(angebot.ende)}

                                    </option>

                                ))}

                            </select>

                            {tagesAngebote.length === 0 && (

                                <span className="zeiten-field-hint">

                                    Keine Angebote an diesem Tag.

                                </span>

                            )}

                        </div>

                    )}


                    {/* ANA */}

                    {filterTyp === 'ANA' && (

                        <div className="zeiten-field zeiten-field-large">

                            <label htmlFor="zeiten-ana">

                                ANA

                            </label>

                            <select
                                id="zeiten-ana"
                                value={filterId}
                                disabled={controlsDisabled}
                                onChange={event =>

                                    handleFilterIdChange(

                                        event.target.value

                                    )

                                }
                            >

                                <option value="">

                                    ANA auswählen

                                </option>

                                {tagesAna.map(kurs => (

                                    <option
                                        key={kurs.id}
                                        value={kurs.id}
                                    >

                                        {kurs.name}

                                        {' · '}

                                        {formatTime(kurs.uhrzeit)}

                                        {' – '}

                                        {formatTime(kurs.uhrzeitEnde)}

                                    </option>

                                ))}

                            </select>

                            {tagesAna.length === 0 && (

                                <span className="zeiten-field-hint">

                                    Keine ANA-Angebote an diesem Tag.

                                </span>

                            )}

                        </div>

                    )}


                    {/* LADEN */}

                    <button
                        type="button"
                        className="zeiten-load-button"
                        disabled={

                            controlsDisabled ||

                            !datum ||

                            (
                                filterTyp !== 'ALLE' &&
                                !filterId
                            )

                        }
                        onClick={handleLoad}
                    >

                        {loading

                            ? 'Wird berechnet...'

                            : 'Anwesenheitszeiten laden'

                        }

                    </button>

                </div>

            </section>


            {/* LOADING */}

            {controlsDisabled && (

                <div className="zeiten-empty">

                    Anwesenheitszeiten werden geladen...

                </div>

            )}


            {/* KEINE DATEN */}

            {!controlsDisabled && !result && !error && (

                <div className="zeiten-empty">

                    Bitte wählen Sie ein Datum und
                    einen Filter aus.

                </div>

            )}


            {/* ERGEBNIS */}

            {!controlsDisabled && result && (

                <>

                    {/* HINWEISE */}

                    {result.hinweise?.length > 0 && (

                        <div className="zeiten-warning">

                            <strong>

                                Hinweise zur Berechnung

                            </strong>

                            <ul>

                                {result.hinweise.map(

                                    (hinweis, index) => (

                                        <li key={index}>

                                            {hinweis}

                                        </li>

                                    )

                                )}

                            </ul>

                        </div>

                    )}


                    {/* ZUSAMMENFASSUNG */}

                    <div className="zeiten-summary">

                        <div>

                            <h2>

                                {result.filterName}

                            </h2>

                            <p>

                                {formatDatum(result.datum)}

                            </p>

                        </div>

                        <span className="zeiten-summary-count">

                            {result.anzahlSchueler} Schüler

                        </span>

                    </div>


                    {/* STATISTIK KARTEN */}

                    <div className="zeiten-statistik-grid">

                        <div className="zeiten-statistik-card">

                            <span>

                                Schüler insgesamt

                            </span>

                            <strong>

                                {result.anzahlSchueler}

                            </strong>

                            <small>

                                Ausgewählte Schülergruppe

                            </small>

                        </div>


                        <div className="zeiten-statistik-card plan">

                            <span>

                                Maximal PLAN

                            </span>

                            <strong>

                                {statistik.maxPlan}

                            </strong>

                            <small>

                                Laut Stundenplan und ANA

                            </small>

                        </div>


                        <div className="zeiten-statistik-card soll">

                            <span>

                                Maximal SOLL

                            </span>

                            <strong>

                                {statistik.maxSoll}

                            </strong>

                            <small>

                                Abzüglich Abwesenheiten

                            </small>

                        </div>


                        <div className="zeiten-statistik-card ist">

                            <span>

                                Maximal IST

                            </span>

                            <strong>

                                {statistik.maxIst}

                            </strong>

                            <small>

                                Bestätigte Anwesenheit

                            </small>

                        </div>


                        <div className="zeiten-statistik-card unchecked">

                            <span>

                                Maximal ungeprüft

                            </span>

                            <strong>

                                {statistik.maxUngeprueft}

                            </strong>

                            <small>

                                Noch nicht bestätigt

                            </small>

                        </div>


                        <div
                            className={

                                `zeiten-statistik-card ${

                                    result.anzahlOhneUnterrichtszeiten > 0

                                        ? 'missing'

                                        : ''

                                }`

                            }
                        >

                            <span>

                                Ohne Unterrichtszeiten

                            </span>

                            <strong>

                                {result.anzahlOhneUnterrichtszeiten}

                            </strong>

                            <small>

                                Nicht in der Berechnung enthalten

                            </small>

                        </div>

                    </div>


                    {/* TABELLE */}

                    <section className="zeiten-section">

                        <div className="zeiten-section-header">

                            <div>

                                <h2>

                                    Anwesenheit im Tagesverlauf

                                </h2>

                                <p>

                                    08:00 – 16:00 Uhr ·
                                    15-Minuten-Intervalle

                                </p>

                            </div>

                            <span className="zeiten-interval-count">

                                {zeitintervalle.length} Intervalle

                            </span>

                        </div>


                        {/* LEGENDE */}

                        <div className="zeiten-legend">

                            <span>

                                <strong>PLAN:</strong>

                                {' '}Geplante Anwesenheit

                            </span>

                            <span>

                                <strong>SOLL:</strong>

                                {' '}Abzüglich Abwesenheiten

                            </span>

                            <span>

                                <strong>IST:</strong>

                                {' '}Bestätigte Anwesenheit

                            </span>

                            <span>

                                <strong>Ungeprüft:</strong>

                                {' '}Noch nicht bestätigte Anwesenheit

                            </span>

                        </div>


                        {/* TABLE */}

                        <div className="zeiten-table-scroll">

                            <table className="zeiten-table">

                                <thead>

                                <tr>

                                    <th>

                                        Uhrzeit

                                    </th>

                                    <th className="zeiten-number">

                                        PLAN

                                    </th>

                                    <th className="zeiten-number">

                                        SOLL

                                    </th>

                                    <th className="zeiten-number">

                                        IST

                                    </th>

                                    <th className="zeiten-number">

                                        Ungeprüft

                                    </th>

                                    <th className="zeiten-number">

                                        Anwesenheitsquote

                                    </th>

                                    <th>

                                        SOLL / IST

                                    </th>

                                </tr>

                                </thead>


                                <tbody>

                                {zeitintervalle.map(intervall => (

                                    <tr
                                        key={intervall.von}
                                        className={

                                            intervall.plan === 0

                                                ? 'zeiten-row-empty'

                                                : ''

                                        }
                                    >

                                        {/* UHRZEIT */}

                                        <td className="zeiten-time">

                                            {formatTime(intervall.von)}

                                            {' – '}

                                            {formatTime(intervall.bis)}

                                        </td>


                                        {/* PLAN */}

                                        <td className="zeiten-number">

                                            {intervall.plan}

                                        </td>


                                        {/* SOLL */}

                                        <td className="zeiten-number zeiten-soll">

                                            {intervall.soll}

                                        </td>


                                        {/* IST */}

                                        <td className="zeiten-number zeiten-ist">

                                            {intervall.ist}

                                        </td>


                                        {/* UNGEPRÜFT */}

                                        <td
                                            className={

                                                `zeiten-number ${

                                                    intervall.ungeprueft > 0

                                                        ? 'zeiten-unchecked'

                                                        : ''

                                                }`

                                            }
                                        >

                                            {intervall.ungeprueft}

                                        </td>


                                        {/* QUOTE */}

                                        <td className="zeiten-number">

                                            {getAnwesenheitsquote(

                                                intervall.ist,

                                                intervall.soll

                                            )}

                                        </td>


                                        {/* VISUALISIERUNG */}

                                        <td className="zeiten-bar-cell">

                                            <div
                                                className="zeiten-bar-track"
                                                title={

                                                    `SOLL: ${intervall.soll} · IST: ${intervall.ist}`

                                                }
                                            >

                                                <div
                                                    className="zeiten-bar-soll"
                                                    style={{

                                                        width: getBarWidth(

                                                            intervall.soll,

                                                            statistik.maxPlan

                                                        )

                                                    }}
                                                />

                                                <div
                                                    className="zeiten-bar-ist"
                                                    style={{

                                                        width: getBarWidth(

                                                            intervall.ist,

                                                            statistik.maxPlan

                                                        )

                                                    }}
                                                />

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                                </tbody>

                            </table>

                        </div>


                        {/* BALKEN LEGENDE */}

                        <div className="zeiten-bar-legend">

                            <span>

                                <i className="zeiten-legend-soll" />

                                SOLL

                            </span>

                            <span>

                                <i className="zeiten-legend-ist" />

                                IST

                            </span>

                        </div>

                    </section>


                    {/* INFORMATION */}

                    <div className="zeiten-information">

                        Die Berechnung basiert auf den
                        aktuellen Unterrichtszeiten,
                        ANA-Buchungen und gespeicherten
                        Tagesanwesenheiten.

                        Angebote beeinflussen die
                        geplanten Anwesenheitszeiten nicht.

                    </div>

                </>

            )}

        </div>
    );
}

export default AnwesenheitszeitenPage;