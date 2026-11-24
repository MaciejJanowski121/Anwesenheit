import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    exportAbwesenheitPdf,
    exportAnaBuchungenPdf,
    exportAngebotBuchungenPdf,
    exportSchuelerBuchungenPdf,
    exportAnwesenheitsverlaufExcel,
    exportAnwesenheitszeitenPdf,
    exportAnaArchivExcel
} from '../services/exportService';

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
    getSchuelerinfos
} from '../services/schuelerinfoService';

import {
    getToday,
    matchesWochentag,
    formatTime
} from '../components/anwesenheit/AnwesenheitUtils';

import './ExportePage.css';


/* =====================================================
   FILTER KONFIGURATION
   ===================================================== */

const FILTER_TYPES = [
    {
        key: 'ALLE',
        label: 'Alle Schüler'
    },
    {
        key: 'KLASSE',
        label: 'Nach Klasse'
    },
    {
        key: 'ANGEBOT',
        label: 'Nach Angebot'
    },
    {
        key: 'ANA',
        label: 'Nach ANA'
    },
    {
        key: 'SCHUELER',
        label: 'Nach Schüler'
    }
];

const ZEITEN_FILTER_TYPES = FILTER_TYPES.filter(
    type => type.key !== 'SCHUELER'
);

const ARCHIV_FILTER_TYPES = [
    {
        key: 'ALLE',
        label: 'Alle Schüler'
    },
    {
        key: 'KLASSE',
        label: 'Nach Klasse (aktuell)'
    },
    {
        key: 'ANA',
        label: 'Nach ANA-Kurs'
    },
    {
        key: 'SCHUELER',
        label: 'Nach Schüler'
    }
];

const ARCHIV_START_DATUM = '2026-09-01';


/* =====================================================
   HILFSFUNKTIONEN
   ===================================================== */

const getMonthStart = () => {
    return `${getToday().slice(0, 7)}-01`;
};

const sortByName = items => {
    return [...items].sort((a, b) =>
        String(a.name ?? '').localeCompare(
            String(b.name ?? ''),
            'de'
        )
    );
};

const getStudentName = student => {
    return `${student.nachname ?? ''}, ${student.vorname ?? ''}`;
};


/* =====================================================
   EXPORT KARTE
   ===================================================== */

function ExportCard({
                        title,
                        description,
                        format,
                        loading,
                        disabled,
                        error,
                        success,
                        onDownload,
                        children
                    }) {

    const isPdf = format === 'PDF';

    return (
        <article
            className={`export-card ${
                isPdf ? 'export-card-pdf' : 'export-card-excel'
            }`}
        >

            <div className="export-card-header">

                <div
                    className={`export-file-icon ${
                        isPdf ? 'pdf' : 'excel'
                    }`}
                    aria-hidden="true"
                >
                    {format}
                </div>

                <div className="export-card-title">

                    <h3>{title}</h3>

                    <span className="export-format-label">
                        {isPdf
                            ? 'PDF-Dokument'
                            : 'Excel-Arbeitsmappe'}
                    </span>

                </div>

            </div>

            <p className="export-card-description">
                {description}
            </p>

            {children && (
                <div className="export-card-fields">
                    {children}
                </div>
            )}

            {error && (
                <div
                    className="export-message error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="export-message success"
                    role="status"
                >
                    {success}
                </div>
            )}

            <div className="export-card-footer">

                <button
                    type="button"
                    className={`export-download-button ${
                        isPdf ? 'pdf' : 'excel'
                    }`}
                    disabled={loading || disabled}
                    onClick={onDownload}
                >

                    <span aria-hidden="true">
                        {loading ? '◌' : '↓'}
                    </span>

                    {loading
                        ? 'Export wird erstellt...'
                        : `${format} herunterladen`}

                </button>

            </div>

        </article>
    );
}


/* =====================================================
   DATUMSFELD
   ===================================================== */

function DateField({
                       id,
                       label,
                       value,
                       onChange,
                       disabled
                   }) {

    return (
        <div className="export-field">

            <label htmlFor={id}>
                {label}
            </label>

            <input
                id={id}
                type="date"
                value={value}
                disabled={disabled}
                onChange={event =>
                    onChange(event.target.value)
                }
            />

        </div>
    );
}


/* =====================================================
   FILTER AUSWAHL
   ===================================================== */

function FilterFields({
                          prefix,
                          filterTypes,
                          filterTyp,
                          filterId,
                          options,
                          onFilterChange,
                          onFilterIdChange,
                          disabled,
                          metadataLoading
                      }) {

    return (
        <>

            <div className="export-field">

                <label htmlFor={`${prefix}-filter`}>
                    Filter
                </label>

                <select
                    id={`${prefix}-filter`}
                    value={filterTyp}
                    disabled={disabled}
                    onChange={event =>
                        onFilterChange(event.target.value)
                    }
                >

                    {filterTypes.map(type => (

                        <option
                            key={type.key}
                            value={type.key}
                        >
                            {type.label}
                        </option>

                    ))}

                </select>

            </div>

            {filterTyp !== 'ALLE' && (

                <div className="export-field">

                    <label htmlFor={`${prefix}-filter-id`}>
                        Auswahl
                    </label>

                    <select
                        id={`${prefix}-filter-id`}
                        value={filterId}
                        disabled={
                            disabled || metadataLoading
                        }
                        onChange={event =>
                            onFilterIdChange(event.target.value)
                        }
                    >

                        <option value="">
                            {metadataLoading
                                ? 'Wird geladen...'
                                : 'Bitte auswählen'}
                        </option>

                        {options.map(option => (

                            <option
                                key={option.id}
                                value={option.id}
                            >
                                {option.label}
                            </option>

                        ))}

                    </select>

                    {!metadataLoading &&
                        options.length === 0 && (

                            <small className="export-field-hint">
                                Keine passenden Einträge vorhanden.
                            </small>

                        )}

                </div>

            )}

        </>
    );
}


/* =====================================================
   EXPORTE PAGE
   ===================================================== */

function ExportePage() {

    /* =================================================
       ABWESENHEITSLISTE
       ================================================= */

    const [abwesenheitDatum, setAbwesenheitDatum] =
        useState(getToday);


    /* =================================================
       ANWESENHEITSVERLAUF
       ================================================= */

    const [verlaufVon, setVerlaufVon] =
        useState(getMonthStart);

    const [verlaufBis, setVerlaufBis] =
        useState(getToday);

    const [verlaufFilterTyp, setVerlaufFilterTyp] =
        useState('ALLE');

    const [verlaufFilterId, setVerlaufFilterId] =
        useState('');


    /* =================================================
       ANWESENHEITSZEITEN
       ================================================= */

    const [zeitenDatum, setZeitenDatum] =
        useState(getToday);

    const [zeitenFilterTyp, setZeitenFilterTyp] =
        useState('ALLE');

    const [zeitenFilterId, setZeitenFilterId] =
        useState('');


    /* =================================================
       ANA-ANWESENHEITSARCHIV
       ================================================= */

    const [archivVon, setArchivVon] =
        useState(ARCHIV_START_DATUM);

    const [archivBis, setArchivBis] =
        useState(getToday);

    const [archivFilterTyp, setArchivFilterTyp] =
        useState('ALLE');

    const [archivFilterId, setArchivFilterId] =
        useState('');


    /* =================================================
       STAMMDATEN
       ================================================= */

    const [klassen, setKlassen] =
        useState([]);

    const [angebote, setAngebote] =
        useState([]);

    const [kurse, setKurse] =
        useState([]);

    const [students, setStudents] =
        useState([]);

    const [metadataLoading, setMetadataLoading] =
        useState(true);

    const [metadataError, setMetadataError] =
        useState('');

    const [metadataReload, setMetadataReload] =
        useState(0);


    /* =================================================
       EXPORT STATUS
       ================================================= */

    const [exportStates, setExportStates] =
        useState({});


    /* =================================================
       STAMMDATEN LADEN
       ================================================= */

    useEffect(() => {

        let active = true;

        const loadMetadata = async () => {

            try {

                setMetadataLoading(true);
                setMetadataError('');

                const [
                    klassenData,
                    angeboteData,
                    kurseData,
                    studentsData
                ] = await Promise.all([
                    getKlassen(),
                    getAngebote(),
                    getKurse(),
                    getSchuelerinfos()
                ]);

                if (!active) {
                    return;
                }

                setKlassen(klassenData ?? []);
                setAngebote(angeboteData ?? []);
                setKurse(kurseData ?? []);
                setStudents(studentsData ?? []);

            } catch (error) {

                if (active) {

                    setMetadataError(
                        'Die Filterdaten konnten nicht geladen werden.'
                    );
                }

            } finally {

                if (active) {
                    setMetadataLoading(false);
                }
            }
        };

        loadMetadata();

        return () => {
            active = false;
        };

    }, [metadataReload]);


    /* =================================================
       KLASSEN OPTIONEN
       ================================================= */

    const klassenOptions = useMemo(() => {

        return sortByName(klassen).map(klasse => ({
            id: klasse.id,
            label: klasse.name
        }));

    }, [klassen]);


    /* =================================================
       ANGEBOTE OPTIONEN
       ================================================= */

    const angebotOptions = useMemo(() => {

        return sortByName(angebote).map(angebot => ({
            id: angebot.id,
            label: `${angebot.name} · ${angebot.wochentag ?? '–'}`
        }));

    }, [angebote]);


    /* =================================================
       ANA OPTIONEN
       ================================================= */

    const anaOptions = useMemo(() => {

        return sortByName(kurse).map(kurs => ({
            id: kurs.id,
            label: `${kurs.name} · ${kurs.wochentag ?? '–'}`
        }));

    }, [kurse]);


    /* =================================================
       SCHÜLER OPTIONEN
       ================================================= */

    const studentOptions = useMemo(() => {

        return [...students]
            .sort((a, b) =>
                getStudentName(a).localeCompare(
                    getStudentName(b),
                    'de'
                )
            )
            .map(student => ({
                id: student.id,
                label: `${getStudentName(student)} · ${
                    student.klasse ?? 'Ohne Klasse'
                }`
            }));

    }, [students]);


    /* =================================================
       ANWESENHEITSVERLAUF FILTER OPTIONEN
       ================================================= */

    const verlaufOptions = useMemo(() => {

        switch (verlaufFilterTyp) {

            case 'KLASSE':
                return klassenOptions;

            case 'ANGEBOT':
                return angebotOptions;

            case 'ANA':
                return anaOptions;

            case 'SCHUELER':
                return studentOptions;

            default:
                return [];
        }

    }, [
        verlaufFilterTyp,
        klassenOptions,
        angebotOptions,
        anaOptions,
        studentOptions
    ]);


    /* =================================================
       ANWESENHEITSZEITEN FILTER OPTIONEN
       ================================================= */

    const zeitenOptions = useMemo(() => {

        switch (zeitenFilterTyp) {

            case 'KLASSE':
                return klassenOptions;

            case 'ANGEBOT':

                return sortByName(
                    angebote.filter(angebot =>
                        matchesWochentag(
                            angebot.wochentag,
                            zeitenDatum
                        )
                    )
                ).map(angebot => ({
                    id: angebot.id,
                    label: `${angebot.name} · ${
                        formatTime(angebot.beginn)
                    } – ${formatTime(angebot.ende)}`
                }));

            case 'ANA':

                return sortByName(
                    kurse.filter(kurs =>
                        matchesWochentag(
                            kurs.wochentag,
                            zeitenDatum
                        )
                    )
                ).map(kurs => ({
                    id: kurs.id,
                    label: `${kurs.name} · ${
                        formatTime(kurs.uhrzeit)
                    } – ${formatTime(kurs.uhrzeitEnde)}`
                }));

            default:
                return [];
        }

    }, [
        zeitenFilterTyp,
        zeitenDatum,
        klassenOptions,
        angebote,
        kurse
    ]);


    /* =================================================
       ANA-ARCHIV FILTER OPTIONEN
       ================================================= */

    const archivOptions = useMemo(() => {

        switch (archivFilterTyp) {

            case 'KLASSE':
                return klassenOptions;

            case 'ANA':
                return anaOptions;

            case 'SCHUELER':
                return studentOptions;

            default:
                return [];
        }

    }, [
        archivFilterTyp,
        klassenOptions,
        anaOptions,
        studentOptions
    ]);


    /* =================================================
       EXPORT STATUS AKTUALISIEREN
       ================================================= */

    const updateExportState = (key, state) => {

        setExportStates(previous => ({
            ...previous,
            [key]: {
                ...previous[key],
                ...state
            }
        }));
    };

    const clearExportState = key => {

        updateExportState(key, {
            error: '',
            success: ''
        });
    };

    const getExportState = key => {

        return exportStates[key] ?? {
            loading: false,
            error: '',
            success: ''
        };
    };


    /* =================================================
       ALLGEMEINE EXPORT FUNKTION
       ================================================= */

    const handleExport = async (key, exportFunction) => {

        if (getExportState(key).loading) {
            return;
        }

        updateExportState(key, {
            loading: true,
            error: '',
            success: ''
        });

        try {

            const filename = await exportFunction();

            updateExportState(key, {
                success: `Download gestartet: ${filename}`
            });

        } catch (error) {

            updateExportState(key, {
                error:
                    error.message ||
                    'Der Export konnte nicht erstellt werden.'
            });

        } finally {

            updateExportState(key, {
                loading: false
            });
        }
    };


    /* =================================================
       FILTER ÄNDERN
       ================================================= */

    const handleVerlaufFilterChange = value => {

        setVerlaufFilterTyp(value);
        setVerlaufFilterId('');

        clearExportState('verlauf');
    };

    const handleZeitenFilterChange = value => {

        setZeitenFilterTyp(value);
        setZeitenFilterId('');

        clearExportState('zeiten');
    };

    const handleZeitenDatumChange = value => {

        setZeitenDatum(value);

        if (
            zeitenFilterTyp === 'ANGEBOT' ||
            zeitenFilterTyp === 'ANA'
        ) {
            setZeitenFilterId('');
        }

        clearExportState('zeiten');
    };

    const handleArchivFilterChange = value => {

        setArchivFilterTyp(value);
        setArchivFilterId('');

        clearExportState('archiv');
    };


    /* =================================================
       ABWESENHEITSLISTE EXPORTIEREN
       ================================================= */

    const handleAbwesenheitExport = () => {

        if (!abwesenheitDatum) {

            updateExportState('abwesenheit', {
                error: 'Bitte wählen Sie ein Datum aus.',
                success: ''
            });

            return;
        }

        handleExport(
            'abwesenheit',
            () => exportAbwesenheitPdf(abwesenheitDatum)
        );
    };


    /* =================================================
       ANWESENHEITSVERLAUF EXPORTIEREN
       ================================================= */

    const handleVerlaufExport = () => {

        if (!verlaufVon || !verlaufBis) {

            updateExportState('verlauf', {
                error: 'Bitte wählen Sie einen Zeitraum aus.',
                success: ''
            });

            return;
        }

        if (verlaufVon > verlaufBis) {

            updateExportState('verlauf', {
                error: 'Das Von-Datum darf nicht nach dem Bis-Datum liegen.',
                success: ''
            });

            return;
        }

        if (
            verlaufFilterTyp !== 'ALLE' &&
            !verlaufFilterId
        ) {

            updateExportState('verlauf', {
                error: 'Bitte treffen Sie eine Auswahl.',
                success: ''
            });

            return;
        }

        handleExport(
            'verlauf',
            () => exportAnwesenheitsverlaufExcel(
                verlaufVon,
                verlaufBis,
                verlaufFilterTyp,
                verlaufFilterTyp === 'ALLE'
                    ? null
                    : Number(verlaufFilterId)
            )
        );
    };


    /* =================================================
       ANWESENHEITSZEITEN PDF EXPORTIEREN
       ================================================= */

    const handleZeitenExport = () => {

        if (!zeitenDatum) {

            updateExportState('zeiten', {
                error: 'Bitte wählen Sie ein Datum aus.',
                success: ''
            });

            return;
        }

        if (
            zeitenFilterTyp !== 'ALLE' &&
            !zeitenFilterId
        ) {

            updateExportState('zeiten', {
                error: 'Bitte treffen Sie eine Auswahl.',
                success: ''
            });

            return;
        }

        handleExport(
            'zeiten',
            () => exportAnwesenheitszeitenPdf(
                zeitenDatum,
                zeitenFilterTyp,
                zeitenFilterTyp === 'ALLE'
                    ? null
                    : Number(zeitenFilterId)
            )
        );
    };


    /* =================================================
       ANA-ARCHIV EXPORTIEREN
       ================================================= */

    const handleArchivExport = () => {

        if (!archivVon || !archivBis) {

            updateExportState('archiv', {
                error: 'Bitte wählen Sie einen Zeitraum aus.',
                success: ''
            });

            return;
        }

        if (archivVon > archivBis) {

            updateExportState('archiv', {
                error: 'Das Von-Datum darf nicht nach dem Bis-Datum liegen.',
                success: ''
            });

            return;
        }

        if (archivFilterTyp !== 'ALLE') {

            const validSelection = archivOptions.some(
                option =>
                    String(option.id) === String(archivFilterId)
            );

            if (
                !archivFilterId ||
                !validSelection ||
                metadataLoading ||
                metadataError
            ) {

                updateExportState('archiv', {
                    error: 'Bitte treffen Sie eine gültige Auswahl.',
                    success: ''
                });

                return;
            }
        }

        handleExport(
            'archiv',
            () => exportAnaArchivExcel(
                archivVon,
                archivBis,
                archivFilterTyp,
                archivFilterTyp === 'ALLE'
                    ? null
                    : archivFilterId
            )
        );
    };


    /* =================================================
       STATUS
       ================================================= */

    const abwesenheitState =
        getExportState('abwesenheit');

    const verlaufState =
        getExportState('verlauf');

    const zeitenState =
        getExportState('zeiten');

    const archivState =
        getExportState('archiv');

    const archivSelectionValid =
        archivFilterTyp === 'ALLE' ||
        archivOptions.some(
            option =>
                String(option.id) === String(archivFilterId)
        );


    /* =================================================
       RENDER
       ================================================= */

    return (

        <div className="exporte-page">

            {/* PAGE HEADER */}

            <div className="page-header">

                <div className="page-header-content">

                    <h1>Exporte</h1>

                    <p>
                        Anwesenheitslisten, Buchungsübersichten
                        und Statistiken herunterladen
                    </p>

                </div>

            </div>


            {/* INFORMATION */}

            <div className="export-information">

                <div
                    className="export-information-icon"
                    aria-hidden="true"
                >
                    ⓘ
                </div>

                <div>

                    <strong>
                        Exportübersicht
                    </strong>

                    <p>
                        PDF-Dokumente eignen sich zum Ausdrucken.
                        Excel-Dateien ermöglichen eine weitere
                        Auswertung und Bearbeitung der Daten.
                    </p>

                </div>

            </div>


            {/* METADATA ERROR */}

            {metadataError && (

                <div
                    className="export-message error"
                    role="alert"
                >

                    <span>{metadataError}</span>

                    <button
                        type="button"
                        className="export-retry-button"
                        onClick={() =>
                            setMetadataReload(value => value + 1)
                        }
                    >
                        Erneut laden
                    </button>

                </div>

            )}


            {/* =========================================
                PDF EXPORTE
               ========================================= */}

            <section className="export-section">

                <div className="export-section-header">

                    <div>

                        <h2>PDF-Exporte</h2>

                        <p>
                            Druckfertige Listen und Übersichten
                        </p>

                    </div>

                    <span className="export-section-count pdf">
                        5 Exporte
                    </span>

                </div>


                <div className="export-grid">


                    {/* 1. ABWESENHEITSLISTE */}

                    <ExportCard
                        title="Abwesenheitsliste"
                        description="Übersicht aller fehlenden und teilweise abwesenden Schüler eines Tages, gruppiert nach Klassen."
                        format="PDF"
                        {...abwesenheitState}
                        disabled={!abwesenheitDatum}
                        onDownload={handleAbwesenheitExport}
                    >

                        <DateField
                            id="export-abwesenheit-datum"
                            label="Datum"
                            value={abwesenheitDatum}
                            disabled={abwesenheitState.loading}
                            onChange={value => {

                                setAbwesenheitDatum(value);

                                clearExportState('abwesenheit');
                            }}
                        />

                    </ExportCard>


                    {/* 2. ANA BUCHUNGEN */}

                    <ExportCard
                        title="ANA-Buchungen"
                        description="Übersicht aller ANA-Kurse mit den zugeordneten Schülern, Kurszeiten und Besonderheiten."
                        format="PDF"
                        {...getExportState('ana')}
                        onDownload={() =>
                            handleExport(
                                'ana',
                                exportAnaBuchungenPdf
                            )
                        }
                    >

                        <div className="export-static-info">
                            Alle aktuellen ANA-Buchungen
                        </div>

                    </ExportCard>


                    {/* 3. ANGEBOTSBUCHUNGEN */}

                    <ExportCard
                        title="Angebotsbuchungen"
                        description="Übersicht aller Angebote mit Teilnehmerlisten, Angebotszeiten und Besonderheiten."
                        format="PDF"
                        {...getExportState('angebot')}
                        onDownload={() =>
                            handleExport(
                                'angebot',
                                exportAngebotBuchungenPdf
                            )
                        }
                    >

                        <div className="export-static-info">
                            Alle aktuellen Angebotsbuchungen
                        </div>

                    </ExportCard>


                    {/* 4. SCHÜLERBUCHUNGEN */}

                    <ExportCard
                        title="Schülerbuchungen"
                        description="Alle ANA- und Angebotsbuchungen pro Schüler, sortiert nach Klassen und Schülernamen."
                        format="PDF"
                        {...getExportState('schueler')}
                        onDownload={() =>
                            handleExport(
                                'schueler',
                                exportSchuelerBuchungenPdf
                            )
                        }
                    >

                        <div className="export-static-info">
                            Alle Schüler und ihre Buchungen
                        </div>

                    </ExportCard>


                    {/* 5. ANWESENHEITSZEITEN PDF */}

                    <ExportCard
                        title="Anwesenheitszeiten"
                        description="Auswertung der geplanten und bestätigten Anwesenheit mit PLAN-, SOLL- und IST-Werten in 15-Minuten-Intervallen."
                        format="PDF"
                        {...zeitenState}
                        disabled={
                            !zeitenDatum ||
                            (
                                zeitenFilterTyp !== 'ALLE' &&
                                (
                                    !zeitenFilterId ||
                                    metadataLoading ||
                                    Boolean(metadataError)
                                )
                            )
                        }
                        onDownload={handleZeitenExport}
                    >

                        <DateField
                            id="export-zeiten-datum"
                            label="Datum"
                            value={zeitenDatum}
                            disabled={zeitenState.loading}
                            onChange={handleZeitenDatumChange}
                        />

                        <FilterFields
                            prefix="export-zeiten"
                            filterTypes={ZEITEN_FILTER_TYPES}
                            filterTyp={zeitenFilterTyp}
                            filterId={zeitenFilterId}
                            options={zeitenOptions}
                            onFilterChange={
                                handleZeitenFilterChange
                            }
                            onFilterIdChange={value => {

                                setZeitenFilterId(value);

                                clearExportState('zeiten');
                            }}
                            disabled={zeitenState.loading}
                            metadataLoading={metadataLoading}
                        />

                        <div className="export-static-info">

                            08:00 – 16:00 Uhr ·
                            15-Minuten-Intervalle

                        </div>

                    </ExportCard>

                </div>

            </section>


            {/* =========================================
                EXCEL EXPORTE
               ========================================= */}

            <section className="export-section">

                <div className="export-section-header">

                    <div>

                        <h2>Excel-Exporte</h2>

                        <p>
                            Anwesenheitsdaten, Statistiken
                            und historische ANA-Einträge
                            zur weiteren Auswertung
                        </p>

                    </div>

                    <span className="export-section-count excel">
                        2 Exporte
                    </span>

                </div>


                <div className="export-grid">


                    {/* 6. ANWESENHEITSVERLAUF */}

                    <ExportCard
                        title="Anwesenheitsverlauf"
                        description="Gespeicherte Tagesanwesenheiten innerhalb eines ausgewählten Zeitraums mit Abwesenheitszeiten, Gründen und Bemerkungen."
                        format="Excel"
                        {...verlaufState}
                        disabled={
                            !verlaufVon ||
                            !verlaufBis ||
                            verlaufVon > verlaufBis ||
                            (
                                verlaufFilterTyp !== 'ALLE' &&
                                (
                                    !verlaufFilterId ||
                                    metadataLoading ||
                                    Boolean(metadataError)
                                )
                            )
                        }
                        onDownload={handleVerlaufExport}
                    >

                        <div className="export-date-grid">

                            <DateField
                                id="export-verlauf-von"
                                label="Von"
                                value={verlaufVon}
                                disabled={verlaufState.loading}
                                onChange={value => {

                                    setVerlaufVon(value);

                                    clearExportState('verlauf');
                                }}
                            />

                            <DateField
                                id="export-verlauf-bis"
                                label="Bis"
                                value={verlaufBis}
                                disabled={verlaufState.loading}
                                onChange={value => {

                                    setVerlaufBis(value);

                                    clearExportState('verlauf');
                                }}
                            />

                        </div>

                        {verlaufVon &&
                            verlaufBis &&
                            verlaufVon > verlaufBis && (

                                <div className="export-message error">
                                    Das Von-Datum darf nicht nach
                                    dem Bis-Datum liegen.
                                </div>

                            )}

                        <FilterFields
                            prefix="export-verlauf"
                            filterTypes={FILTER_TYPES}
                            filterTyp={verlaufFilterTyp}
                            filterId={verlaufFilterId}
                            options={verlaufOptions}
                            onFilterChange={
                                handleVerlaufFilterChange
                            }
                            onFilterIdChange={value => {

                                setVerlaufFilterId(value);

                                clearExportState('verlauf');
                            }}
                            disabled={verlaufState.loading}
                            metadataLoading={metadataLoading}
                        />

                    </ExportCard>


                    {/* 7. ANA-ANWESENHEITSARCHIV */}

                    <ExportCard
                        title="ANA-Anwesenheitsarchiv"
                        description="Historische Anwesenheiten einzelner ANA-Kurse aus dem bisherigen Anwesenheitssystem inklusive einer separaten statistischen Zusammenfassung."
                        format="Excel"
                        {...archivState}
                        disabled={
                            !archivVon ||
                            !archivBis ||
                            archivVon > archivBis ||
                            (
                                archivFilterTyp !== 'ALLE' &&
                                (
                                    !archivSelectionValid ||
                                    metadataLoading ||
                                    Boolean(metadataError)
                                )
                            )
                        }
                        onDownload={handleArchivExport}
                    >

                        <div className="export-date-grid">

                            <DateField
                                id="export-archiv-von"
                                label="Von"
                                value={archivVon}
                                disabled={archivState.loading}
                                onChange={value => {

                                    setArchivVon(value);

                                    clearExportState('archiv');
                                }}
                            />

                            <DateField
                                id="export-archiv-bis"
                                label="Bis"
                                value={archivBis}
                                disabled={archivState.loading}
                                onChange={value => {

                                    setArchivBis(value);

                                    clearExportState('archiv');
                                }}
                            />

                        </div>

                        {archivVon &&
                            archivBis &&
                            archivVon > archivBis && (

                                <div
                                    className="export-message error"
                                    role="alert"
                                >
                                    Das Von-Datum darf nicht nach
                                    dem Bis-Datum liegen.
                                </div>

                            )}

                        <FilterFields
                            prefix="export-archiv"
                            filterTypes={ARCHIV_FILTER_TYPES}
                            filterTyp={archivFilterTyp}
                            filterId={archivFilterId}
                            options={archivOptions}
                            onFilterChange={
                                handleArchivFilterChange
                            }
                            onFilterIdChange={value => {

                                setArchivFilterId(value);

                                clearExportState('archiv');
                            }}
                            disabled={archivState.loading}
                            metadataLoading={metadataLoading}
                        />

                        <div className="export-static-info">

                            Historische ANA-Anwesenheiten ·
                            Nur lesender Zugriff

                        </div>

                        <small className="export-field-hint">

                            Die historischen ANA-Einträge werden
                            nicht mit den neuen Tagesanwesenheiten
                            verrechnet. Klasse, Jahrgang und
                            Kursdaten entsprechen den aktuellen
                            Stammdaten.

                        </small>

                    </ExportCard>

                </div>

            </section>


            {/* DATENSCHUTZ */}

            <div className="export-privacy-information">

                <strong>Hinweis zum Datenschutz</strong>

                <p>
                    Die exportierten Dateien können
                    personenbezogene Schülerdaten enthalten.
                    Bitte behandeln Sie diese vertraulich
                    und speichern Sie die Dateien ausschließlich
                    an dafür vorgesehenen Speicherorten.
                </p>

            </div>

        </div>
    );
}

export default ExportePage;