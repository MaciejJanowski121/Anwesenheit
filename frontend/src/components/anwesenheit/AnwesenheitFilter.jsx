import React from 'react';

/* =====================================================
   FILTERMODI
   ===================================================== */

const FILTER_MODES = [
    { key: 'klasse', label: 'Klasse' },
    { key: 'angebote', label: 'Angebote' },
    { key: 'ana', label: 'ANA' },
    { key: 'alle', label: 'Alle Schüler' }
];

/* =====================================================
   ANWESENHEIT FILTER
   ===================================================== */

function AnwesenheitFilter({

                               datum,
                               onDatumChange,

                               filterMode,
                               onFilterModeChange,

                               klassen = [],
                               angebote = [],
                               kurse = [],
                               jahrgaenge = [],

                               selectedKlasseId,
                               onKlasseChange,

                               selectedAngebotId,
                               onAngebotChange,

                               selectedKursId,
                               onKursChange,

                               search,
                               onSearchChange,

                               jahrgangFilter,
                               onJahrgangFilterChange,

                               klasseFilter,
                               onKlasseFilterChange,

                               onReload,

                               disabled = false

                           }) {

    /* =====================================================
       SORTIERUNG
       ===================================================== */

    const sortedKlassen = [...klassen].sort(
        (a, b) =>
            String(a.name ?? '').localeCompare(
                String(b.name ?? ''),
                'de'
            )
    );

    const sortedAngebote = [...angebote].sort(
        (a, b) =>
            String(a.name ?? '').localeCompare(
                String(b.name ?? ''),
                'de'
            )
    );

    const sortedKurse = [...kurse].sort(
        (a, b) =>
            String(a.name ?? '').localeCompare(
                String(b.name ?? ''),
                'de'
            )
    );

    const sortedJahrgaenge = [...jahrgaenge].sort(
        (a, b) => Number(a) - Number(b)
    );

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <>

            {/* =================================================
                FILTERMODUS
                ================================================= */}

            <div className="anwesenheit-view-switch">

                {FILTER_MODES.map(mode => (

                    <button
                        key={mode.key}
                        type="button"
                        className={
                            filterMode === mode.key
                                ? 'active'
                                : ''
                        }
                        aria-pressed={
                            filterMode === mode.key
                        }
                        disabled={disabled}
                        onClick={() =>
                            onFilterModeChange(mode.key)
                        }
                    >

                        {mode.label}

                    </button>

                ))}

            </div>

            {/* =================================================
                DATUM UND GRUPPENAUSWAHL
                ================================================= */}

            <div className="anwesenheit-toolbar">

                {/* DATUM */}

                <div className="anwesenheit-field">

                    <label htmlFor="anwesenheit-datum">
                        Datum
                    </label>

                    <input
                        id="anwesenheit-datum"
                        type="date"
                        value={datum}
                        disabled={disabled}
                        onChange={event =>
                            onDatumChange(
                                event.target.value
                            )
                        }
                    />

                </div>

                {/* =============================================
                    KLASSE
                    ============================================= */}

                {filterMode === 'klasse' && (

                    <div className="anwesenheit-field anwesenheit-field-large">

                        <label htmlFor="anwesenheit-klasse">
                            Klasse
                        </label>

                        <select
                            id="anwesenheit-klasse"
                            value={selectedKlasseId}
                            disabled={
                                disabled ||
                                sortedKlassen.length === 0
                            }
                            onChange={event =>
                                onKlasseChange(
                                    event.target.value
                                )
                            }
                        >

                            {sortedKlassen.length === 0 && (

                                <option value="">
                                    Keine Klassen vorhanden
                                </option>

                            )}

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

                {/* =============================================
                    ANGEBOTE
                    ============================================= */}

                {filterMode === 'angebote' && (

                    <div className="anwesenheit-field anwesenheit-field-large">

                        <label htmlFor="anwesenheit-angebot">
                            Angebot
                        </label>

                        <select
                            id="anwesenheit-angebot"
                            value={selectedAngebotId}
                            disabled={
                                disabled ||
                                sortedAngebote.length === 0
                            }
                            onChange={event =>
                                onAngebotChange(
                                    event.target.value
                                )
                            }
                        >

                            {sortedAngebote.length === 0 && (

                                <option value="">
                                    Keine Angebote an diesem Tag
                                </option>

                            )}

                            {sortedAngebote.map(angebot => (

                                <option
                                    key={angebot.id}
                                    value={angebot.id}
                                >

                                    {angebot.name}

                                    {angebot.beginn &&
                                        ` · ${angebot.beginn.slice(0, 5)}`}

                                    {angebot.ende &&
                                        ` – ${angebot.ende.slice(0, 5)}`}

                                </option>

                            ))}

                        </select>

                    </div>

                )}

                {/* =============================================
                    ANA
                    ============================================= */}

                {filterMode === 'ana' && (

                    <div className="anwesenheit-field anwesenheit-field-large">

                        <label htmlFor="anwesenheit-ana">
                            ANA
                        </label>

                        <select
                            id="anwesenheit-ana"
                            value={selectedKursId}
                            disabled={
                                disabled ||
                                sortedKurse.length === 0
                            }
                            onChange={event =>
                                onKursChange(
                                    event.target.value
                                )
                            }
                        >

                            {sortedKurse.length === 0 && (

                                <option value="">
                                    Keine ANA an diesem Tag
                                </option>

                            )}

                            {sortedKurse.map(kurs => (

                                <option
                                    key={kurs.id}
                                    value={kurs.id}
                                >

                                    {kurs.name}

                                    {kurs.uhrzeit &&
                                        ` · ${kurs.uhrzeit.slice(0, 5)}`}

                                    {kurs.uhrzeitEnde &&
                                        ` – ${kurs.uhrzeitEnde.slice(0, 5)}`}

                                </option>

                            ))}

                        </select>

                    </div>

                )}

                {/* =============================================
                    NEU LADEN
                    ============================================= */}

                <div className="anwesenheit-toolbar-actions">

                    <button
                        type="button"
                        className="anwesenheit-load-button"
                        disabled={disabled}
                        onClick={onReload}
                    >

                        Neu laden

                    </button>

                </div>

            </div>

            {/* =================================================
                SCHÜLER FILTER
                ================================================= */}

            <div className="anwesenheit-student-filters">

                {/* FREITEXTSUCHE */}

                <div className="anwesenheit-field anwesenheit-student-search">

                    <label htmlFor="anwesenheit-suche">
                        Suche
                    </label>

                    <input
                        id="anwesenheit-suche"
                        type="text"
                        placeholder="Name, Angebot oder ANA suchen..."
                        value={search}
                        disabled={disabled}
                        onChange={event =>
                            onSearchChange(
                                event.target.value
                            )
                        }
                    />

                </div>

                {/* JAHRGANG */}

                <div className="anwesenheit-field">

                    <label htmlFor="anwesenheit-jahrgang">
                        Jahrgang
                    </label>

                    <select
                        id="anwesenheit-jahrgang"
                        value={jahrgangFilter}
                        disabled={disabled}
                        onChange={event =>
                            onJahrgangFilterChange(
                                event.target.value
                            )
                        }
                    >

                        <option value="">
                            Alle Jahrgänge
                        </option>

                        {sortedJahrgaenge.map(jahrgang => (

                            <option
                                key={jahrgang}
                                value={jahrgang}
                            >

                                Jahrgang {jahrgang}

                            </option>

                        ))}

                    </select>

                </div>

                {/* =============================================
                    ZUSÄTZLICHER KLASSENFILTER
                    ============================================= */}

                {filterMode === 'alle' && (

                    <div className="anwesenheit-field">

                        <label htmlFor="anwesenheit-klasse-filter">
                            Klasse
                        </label>

                        <select
                            id="anwesenheit-klasse-filter"
                            value={klasseFilter}
                            disabled={disabled}
                            onChange={event =>
                                onKlasseFilterChange(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                Alle Klassen
                            </option>

                            {sortedKlassen.map(klasse => (

                                <option
                                    key={klasse.id}
                                    value={klasse.name}
                                >

                                    {klasse.name}

                                </option>

                            ))}

                        </select>

                    </div>

                )}

            </div>

        </>
    );
}

export default AnwesenheitFilter;