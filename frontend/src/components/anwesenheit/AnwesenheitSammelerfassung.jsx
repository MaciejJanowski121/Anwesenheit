import React, { useState, useMemo } from 'react';

import {
    TIME_OPTIONS,
    ANWESENHEIT_STATUS,
    getToday
} from './AnwesenheitUtils';

/* =====================================================
   KONSTANTEN
   ===================================================== */

const MAX_ZEITRAUM_TAGE = 366;
const MAX_SAMMEL_EINTRAEGE = 20000;

const WOCHENTAGE = [
    { value: 'MONDAY', label: 'Mo', index: 1 },
    { value: 'TUESDAY', label: 'Di', index: 2 },
    { value: 'WEDNESDAY', label: 'Mi', index: 3 },
    { value: 'THURSDAY', label: 'Do', index: 4 },
    { value: 'FRIDAY', label: 'Fr', index: 5 }
];

/* =====================================================
   STANDARDWERTE
   ===================================================== */

const createInitialValues = () => ({
    status: 'unchanged',
    abwesendAb: 'unchanged',
    abwesendBis: 'unchanged',
    grundAbwesenheitMode: 'unchanged',
    grundAbwesenheit: '',
    anaAnwesenheitskontrolle: 'unchanged'
});

const createInitialZeitraum = () => {

    const today = getToday();

    const currentDay = new Date(
        `${today}T12:00:00`
    ).getDay();

    const wochentag = WOCHENTAGE.find(
        day => day.index === currentDay
    );

    return {
        von: today,
        bis: today,
        wochentage: wochentag
            ? [wochentag.value]
            : []
    };
};

/* =====================================================
   DATUM FORMATIEREN
   ===================================================== */

const formatDate = value => {

    if (!value) {
        return '';
    }

    return new Date(
        `${value}T12:00:00`
    ).toLocaleDateString('de-DE');
};

/* =====================================================
   AUSGEWÄHLTE TAGE BERECHNEN
   ===================================================== */

const calculateZeitraum = (
    von,
    bis,
    wochentage
) => {

    const result = {
        tage: [],
        error: ''
    };

    if (!von || !bis) {

        result.error =
            'Bitte wählen Sie ein Start- und Enddatum.';

        return result;
    }

    const start = new Date(
        `${von}T00:00:00Z`
    );

    const end = new Date(
        `${bis}T00:00:00Z`
    );

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {

        result.error =
            'Ungültiges Datum.';

        return result;
    }

    if (start > end) {

        result.error =
            'Das Von-Datum darf nicht nach dem Bis-Datum liegen.';

        return result;
    }

    const kalendertage =
        Math.round(
            (end.getTime() - start.getTime()) /
            86400000
        ) + 1;

    if (kalendertage > MAX_ZEITRAUM_TAGE) {

        result.error =
            `Der Zeitraum darf maximal ${MAX_ZEITRAUM_TAGE} Kalendertage umfassen.`;

        return result;
    }

    if (wochentage.length === 0) {

        result.error =
            'Bitte wählen Sie mindestens einen Wochentag aus.';

        return result;
    }

    const selectedDayIndexes = new Set(

        WOCHENTAGE
            .filter(day =>
                wochentage.includes(day.value)
            )
            .map(day => day.index)
    );

    const current = new Date(start);

    while (current <= end) {

        if (
            selectedDayIndexes.has(
                current.getUTCDay()
            )
        ) {

            result.tage.push(
                current.toISOString().slice(0, 10)
            );
        }

        current.setUTCDate(
            current.getUTCDate() + 1
        );
    }

    if (result.tage.length === 0) {

        result.error =
            'Im ausgewählten Zeitraum liegen keine der ausgewählten Wochentage.';
    }

    return result;
};

/* =====================================================
   UHRZEIT AUSWAHL
   ===================================================== */

function SammelTimeSelect({
                              id,
                              label,
                              value,
                              onChange,
                              disabled
                          }) {

    return (

        <div className="anwesenheit-sammel-field">

            <label htmlFor={id}>
                {label}
            </label>

            <select
                id={id}
                value={value}
                disabled={disabled}
                onChange={event =>
                    onChange(event.target.value)
                }
            >

                <option value="unchanged">
                    Nicht ändern
                </option>

                <option value="clear">
                    Uhrzeit entfernen
                </option>

                {TIME_OPTIONS.map(time => (

                    <option
                        key={time}
                        value={time}
                    >
                        {time}
                    </option>

                ))}

            </select>

        </div>
    );
}

/* =====================================================
   SAMMELERFASSUNG
   ===================================================== */

function AnwesenheitSammelerfassung({

                                        selectedCount = 0,

                                        totalCount = 0,

                                        onSelectAll,

                                        onClearSelection,

                                        onSave,

                                        disabled = false

                                    }) {

    /* =====================================================
       STATE
       ===================================================== */

    const [values, setValues] = useState(
        createInitialValues
    );

    const [zeitraum, setZeitraum] = useState(
        createInitialZeitraum
    );

    const [expanded, setExpanded] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    /* =====================================================
       STATUS
       ===================================================== */

    const isFehlend =
        values.status ===
        ANWESENHEIT_STATUS.FEHLT;

    const hasChanges =

        values.status !== 'unchanged' ||

        values.abwesendAb !== 'unchanged' ||

        values.abwesendBis !== 'unchanged' ||

        values.grundAbwesenheitMode !== 'unchanged' ||

        values.anaAnwesenheitskontrolle !== 'unchanged';

    const formDisabled =
        disabled ||
        saving ||
        selectedCount === 0;

    const allSelected =
        totalCount > 0 &&
        selectedCount === totalCount;

    /* =====================================================
       ZEITRAUM BERECHNEN
       ===================================================== */

    const zeitraumResult = useMemo(

        () => calculateZeitraum(
            zeitraum.von,
            zeitraum.bis,
            zeitraum.wochentage
        ),

        [
            zeitraum.von,
            zeitraum.bis,
            zeitraum.wochentage
        ]
    );

    const anzahlTage =
        zeitraumResult.tage.length;

    const anzahlEintraege =
        selectedCount * anzahlTage;

    const limitExceeded =
        anzahlEintraege > MAX_SAMMEL_EINTRAEGE;

    const zeitraumError =

        zeitraumResult.error ||

        (
            limitExceeded

                ? `Es können maximal ${MAX_SAMMEL_EINTRAEGE.toLocaleString('de-DE')} Anwesenheitseinträge gleichzeitig gespeichert werden.`

                : ''
        );

    /* =====================================================
       FELD ÄNDERN
       ===================================================== */

    const updateField = (field, value) => {

        setValues(previous => {

            const next = {
                ...previous,
                [field]: value
            };

            /*
             * Bei vollständiger Abwesenheit
             * werden die Uhrzeiten entfernt.
             */

            if (
                field === 'status' &&
                value === ANWESENHEIT_STATUS.FEHLT
            ) {

                next.abwesendAb = 'clear';
                next.abwesendBis = 'clear';

            } else if (
                field === 'status' &&
                previous.status === ANWESENHEIT_STATUS.FEHLT
            ) {

                next.abwesendAb = 'unchanged';
                next.abwesendBis = 'unchanged';
            }

            return next;
        });

        setError('');
    };

    /* =====================================================
       DATUM ÄNDERN
       ===================================================== */

    const updateDatum = (field, value) => {

        setZeitraum(previous => ({
            ...previous,
            [field]: value
        }));

        setError('');
    };

    /* =====================================================
       WOCHENTAG AUSWÄHLEN
       ===================================================== */

    const toggleWochentag = wochentag => {

        setZeitraum(previous => {

            const selected =
                previous.wochentage.includes(
                    wochentag
                );

            return {

                ...previous,

                wochentage: selected

                    ? previous.wochentage.filter(
                        day => day !== wochentag
                    )

                    : [
                        ...previous.wochentage,
                        wochentag
                    ]
            };
        });

        setError('');
    };

    /* =====================================================
       ALLE WOCHENTAGE AUSWÄHLEN
       ===================================================== */

    const toggleAlleWochentage = () => {

        setZeitraum(previous => ({

            ...previous,

            wochentage:

                previous.wochentage.length ===
                WOCHENTAGE.length

                    ? []

                    : WOCHENTAGE.map(
                        day => day.value
                    )
        }));

        setError('');
    };

    /* =====================================================
       FORMULAR ZURÜCKSETZEN
       ===================================================== */

    const handleReset = () => {

        setValues(
            createInitialValues()
        );

        setZeitraum(
            createInitialZeitraum()
        );

        setError('');
    };

    /* =====================================================
       PAYLOAD ERSTELLEN
       ===================================================== */

    const createPayload = () => {

        const payload = {};

        /* STATUS */

        if (values.status !== 'unchanged') {

            payload.status =
                values.status === 'clear'
                    ? null
                    : values.status;
        }

        /* ABWESEND AB */

        if (values.abwesendAb !== 'unchanged') {

            payload.abwesendAb =
                values.abwesendAb === 'clear'
                    ? null
                    : values.abwesendAb;
        }

        /* ABWESEND BIS */

        if (values.abwesendBis !== 'unchanged') {

            payload.abwesendBis =
                values.abwesendBis === 'clear'
                    ? null
                    : values.abwesendBis;
        }

        /* GRUND ABWESENHEIT */

        if (
            values.grundAbwesenheitMode === 'set'
        ) {

            payload.grundAbwesenheit =
                values.grundAbwesenheit.trim();

        } else if (
            values.grundAbwesenheitMode === 'clear'
        ) {

            payload.grundAbwesenheit = null;
        }

        /* ANA ANWESENHEITSKONTROLLE */

        if (
            values.anaAnwesenheitskontrolle !==
            'unchanged'
        ) {

            payload.anaAnwesenheitskontrolle =
                values.anaAnwesenheitskontrolle ===
                'true';
        }

        /* VOLLSTÄNDIG FEHLEND */

        if (
            payload.status ===
            ANWESENHEIT_STATUS.FEHLT
        ) {

            payload.abwesendAb = null;
            payload.abwesendBis = null;
        }

        return payload;
    };

    /* =====================================================
       SAMMELAKTUALISIERUNG SPEICHERN
       ===================================================== */

    const handleSave = async () => {

        if (
            formDisabled ||
            !hasChanges
        ) {
            return;
        }

        setError('');

        /* ZEITRAUM VALIDIEREN */

        if (zeitraumError) {

            setError(zeitraumError);

            return;
        }

        /* ABWESENHEITSGRUND VALIDIEREN */

        if (
            values.grundAbwesenheitMode === 'set' &&
            !values.grundAbwesenheit.trim()
        ) {

            setError(
                'Bitte geben Sie einen Abwesenheitsgrund ein.'
            );

            return;
        }

        if (
            values.grundAbwesenheitMode === 'set' &&
            values.grundAbwesenheit.trim().length > 50
        ) {

            setError(
                'Der Abwesenheitsgrund darf maximal 50 Zeichen enthalten.'
            );

            return;
        }

        const payload =
            createPayload();

        /* UHRZEITEN VALIDIEREN */

        if (
            payload.abwesendAb &&
            payload.abwesendBis &&
            payload.abwesendAb >= payload.abwesendBis
        ) {

            setError(
                'Abwesend ab muss vor Abwesend bis liegen.'
            );

            return;
        }

        /* BESTÄTIGUNG */

        const selectedWochentage =
            WOCHENTAGE
                .filter(day =>
                    zeitraum.wochentage.includes(
                        day.value
                    )
                )
                .map(day => day.label)
                .join(', ');

        const confirmed = window.confirm(

            'Möchten Sie die Sammelerfassung speichern?\n\n' +

            `Zeitraum: ${formatDate(zeitraum.von)} bis ${formatDate(zeitraum.bis)}\n` +

            `Wochentage: ${selectedWochentage}\n` +

            `Schüler: ${selectedCount}\n` +

            `Tage: ${anzahlTage}\n` +

            `Anwesenheitseinträge: ${anzahlEintraege.toLocaleString('de-DE')}\n\n` +

            'Die ausgewählten Felder bereits vorhandener Einträge werden überschrieben.'

        );

        if (!confirmed) {
            return;
        }

        try {

            setSaving(true);

            await onSave(
                payload,
                {
                    von: zeitraum.von,
                    bis: zeitraum.bis,
                    wochentage: [
                        ...zeitraum.wochentage
                    ]
                }
            );

        } catch (err) {

            setError(

                err.response?.data?.message ||

                err.response?.data?.detail ||

                err.message ||

                'Die Sammelaktualisierung ist fehlgeschlagen.'
            );

        } finally {

            setSaving(false);
        }
    };

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <section className="anwesenheit-sammel-section">

            {/* HEADER */}

            <div className="anwesenheit-sammel-header">

                <div className="anwesenheit-sammel-heading">

                    <h3>
                        Sammelerfassung
                    </h3>

                    <span className="anwesenheit-sammel-count">

                        {selectedCount} von {totalCount}
                        {' Schülern ausgewählt'}

                    </span>

                </div>

                <button
                    type="button"
                    className="anwesenheit-sammel-toggle"
                    aria-expanded={expanded}
                    onClick={() =>
                        setExpanded(previous => !previous)
                    }
                >

                    {expanded
                        ? 'Einklappen ▲'
                        : 'Ausklappen ▼'}

                </button>

            </div>

            {expanded && (

                <>

                    {/* SCHÜLERAUSWAHL */}

                    <div className="anwesenheit-sammel-selection">

                        <button
                            type="button"
                            className="anwesenheit-sammel-select-button"
                            disabled={
                                disabled ||
                                saving ||
                                totalCount === 0
                            }
                            onClick={onSelectAll}
                        >

                            {allSelected
                                ? 'Alle abwählen'
                                : 'Alle sichtbaren auswählen'}

                        </button>

                        <button
                            type="button"
                            className="anwesenheit-sammel-clear-button"
                            disabled={
                                disabled ||
                                saving ||
                                selectedCount === 0
                            }
                            onClick={onClearSelection}
                        >

                            Auswahl aufheben

                        </button>

                    </div>

                    {/* HINWEIS */}

                    <p className="anwesenheit-sammel-hint">

                        Wählen Sie die gewünschten Schüler,
                        den Zeitraum und die zu ändernden
                        Felder aus. Nicht ausgewählte Felder
                        bleiben unverändert. Bei vollständiger
                        Abwesenheit werden vorhandene
                        Abwesenheitszeiten entfernt.

                    </p>

                    {disabled && (

                        <div className="anwesenheit-sammel-warning">

                            Die Sammelerfassung ist momentan
                            nicht verfügbar. Speichern Sie
                            gegebenenfalls zuerst die offenen
                            Einzeländerungen.

                        </div>

                    )}

                    {error && (

                        <div
                            className="anwesenheit-message error"
                            role="alert"
                        >

                            {error}

                        </div>

                    )}

                    {/* =====================================
                       ZEITRAUM
                       ===================================== */}

                    <div className="anwesenheit-sammel-zeitraum">

                        <h4>
                            Zeitraum der Sammelerfassung
                        </h4>

                        <div className="anwesenheit-sammel-datum-grid">

                            <div className="anwesenheit-sammel-field">

                                <label htmlFor="sammel-datum-von">

                                    Datum von

                                </label>

                                <input
                                    id="sammel-datum-von"
                                    type="date"
                                    value={zeitraum.von}
                                    disabled={disabled || saving}
                                    onChange={event =>
                                        updateDatum(
                                            'von',
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                            <div className="anwesenheit-sammel-field">

                                <label htmlFor="sammel-datum-bis">

                                    Datum bis

                                </label>

                                <input
                                    id="sammel-datum-bis"
                                    type="date"
                                    min={zeitraum.von || undefined}
                                    value={zeitraum.bis}
                                    disabled={disabled || saving}
                                    onChange={event =>
                                        updateDatum(
                                            'bis',
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                        </div>

                        {/* WOCHENTAGE */}

                        <fieldset
                            className="anwesenheit-sammel-wochentage"
                            disabled={disabled || saving}
                        >

                            <legend>
                                Wochentage
                            </legend>

                            <div className="anwesenheit-sammel-wochentage-options">

                                {WOCHENTAGE.map(day => (

                                    <label
                                        key={day.value}
                                        className={
                                            `anwesenheit-sammel-wochentag ${
                                                zeitraum.wochentage.includes(
                                                    day.value
                                                )
                                                    ? 'selected'
                                                    : ''
                                            }`
                                        }
                                    >

                                        <input
                                            type="checkbox"
                                            checked={
                                                zeitraum.wochentage.includes(
                                                    day.value
                                                )
                                            }
                                            onChange={() =>
                                                toggleWochentag(
                                                    day.value
                                                )
                                            }
                                        />

                                        <span>
                                            {day.label}
                                        </span>

                                    </label>

                                ))}

                                <button
                                    type="button"
                                    className="anwesenheit-sammel-week-button"
                                    disabled={disabled || saving}
                                    onClick={toggleAlleWochentage}
                                >

                                    {zeitraum.wochentage.length ===
                                    WOCHENTAGE.length

                                        ? 'Alle Tage abwählen'

                                        : 'Mo – Fr auswählen'}

                                </button>

                            </div>

                        </fieldset>

                        <p className="anwesenheit-sammel-hint">

                            Die Änderungen werden nur an den
                            ausgewählten Wochentagen innerhalb
                            des angegebenen Zeitraums durchgeführt.
                            Ferien und Feiertage werden nicht
                            automatisch ausgeschlossen.

                        </p>

                        {/* ZUSAMMENFASSUNG */}

                        <div
                            className="anwesenheit-sammel-summary"
                            aria-live="polite"
                        >

                            <div className="anwesenheit-sammel-summary-item">

                                <span>
                                    Schüler
                                </span>

                                <strong>
                                    {selectedCount}
                                </strong>

                            </div>

                            <div className="anwesenheit-sammel-summary-item">

                                <span>
                                    Ausgewählte Tage
                                </span>

                                <strong>
                                    {anzahlTage}
                                </strong>

                            </div>

                            <div className="anwesenheit-sammel-summary-item">

                                <span>
                                    Anwesenheitseinträge
                                </span>

                                <strong>
                                    {anzahlEintraege.toLocaleString(
                                        'de-DE'
                                    )}
                                </strong>

                            </div>

                        </div>

                        {zeitraumError && (

                            <div
                                className="anwesenheit-sammel-warning"
                                role="alert"
                            >

                                {zeitraumError}

                            </div>

                        )}

                    </div>

                    {/* =====================================
                       FORMULAR
                       ===================================== */}

                    <div className="anwesenheit-sammel-form">

                        {/* STATUS */}

                        <div className="anwesenheit-sammel-field">

                            <label htmlFor="sammel-status">

                                Anwesenheitsstatus

                            </label>

                            <select
                                id="sammel-status"
                                value={values.status}
                                disabled={formDisabled}
                                onChange={event =>
                                    updateField(
                                        'status',
                                        event.target.value
                                    )
                                }
                            >

                                <option value="unchanged">
                                    Nicht ändern
                                </option>

                                <option
                                    value={
                                        ANWESENHEIT_STATUS.ANWESEND
                                    }
                                >
                                    Anwesend
                                </option>

                                <option
                                    value={
                                        ANWESENHEIT_STATUS.FEHLT
                                    }
                                >
                                    Fehlt
                                </option>

                                <option value="clear">
                                    Status zurücksetzen
                                </option>

                            </select>

                        </div>

                        {/* ABWESEND AB */}

                        <SammelTimeSelect

                            id="sammel-abwesend-ab"

                            label="Abwesend ab"

                            value={values.abwesendAb}

                            disabled={
                                formDisabled ||
                                isFehlend
                            }

                            onChange={value =>
                                updateField(
                                    'abwesendAb',
                                    value
                                )
                            }

                        />

                        {/* ABWESEND BIS */}

                        <SammelTimeSelect

                            id="sammel-abwesend-bis"

                            label="Abwesend bis"

                            value={values.abwesendBis}

                            disabled={
                                formDisabled ||
                                isFehlend
                            }

                            onChange={value =>
                                updateField(
                                    'abwesendBis',
                                    value
                                )
                            }

                        />

                        {/* GRUND ABWESENHEIT */}

                        <div className="anwesenheit-sammel-field">

                            <label htmlFor="sammel-grund-mode">

                                Grund Abwesenheit

                            </label>

                            <select
                                id="sammel-grund-mode"
                                value={
                                    values.grundAbwesenheitMode
                                }
                                disabled={formDisabled}
                                onChange={event =>
                                    updateField(
                                        'grundAbwesenheitMode',
                                        event.target.value
                                    )
                                }
                            >

                                <option value="unchanged">
                                    Nicht ändern
                                </option>

                                <option value="set">
                                    Grund eintragen
                                </option>

                                <option value="clear">
                                    Grund entfernen
                                </option>

                            </select>

                            {values.grundAbwesenheitMode === 'set' && (

                                <div className="anwesenheit-sammel-grund-input">

                                    <input
                                        type="text"
                                        id="sammel-grund"
                                        aria-label="Abwesenheitsgrund"
                                        maxLength={50}
                                        placeholder="Abwesenheitsgrund eingeben"
                                        value={
                                            values.grundAbwesenheit
                                        }
                                        disabled={formDisabled}
                                        onChange={event =>
                                            updateField(
                                                'grundAbwesenheit',
                                                event.target.value
                                            )
                                        }
                                    />

                                    <span className="anwesenheit-sammel-character-count">

                                        {values.grundAbwesenheit.length}
                                        {' / 50 Zeichen'}

                                    </span>

                                </div>

                            )}

                        </div>

                        {/* ANA KONTROLLE */}

                        <div className="anwesenheit-sammel-field">

                            <label htmlFor="sammel-ana-kontrolle">

                                ANA Anwesenheitskontrolle

                            </label>

                            <select
                                id="sammel-ana-kontrolle"
                                value={
                                    values.anaAnwesenheitskontrolle
                                }
                                disabled={formDisabled}
                                onChange={event =>
                                    updateField(
                                        'anaAnwesenheitskontrolle',
                                        event.target.value
                                    )
                                }
                            >

                                <option value="unchanged">
                                    Nicht ändern
                                </option>

                                <option value="true">
                                    Kontrolliert
                                </option>

                                <option value="false">
                                    Nicht kontrolliert
                                </option>

                            </select>

                        </div>

                    </div>

                    {/* =====================================
                       AKTIONEN
                       ===================================== */}

                    <div className="anwesenheit-sammel-actions">

                        <button
                            type="button"
                            className="anwesenheit-sammel-reset-button"
                            disabled={saving || disabled}
                            onClick={handleReset}
                        >

                            Zurücksetzen

                        </button>

                        <button
                            type="button"
                            className="save-button"
                            disabled={
                                formDisabled ||
                                !hasChanges ||
                                Boolean(zeitraumError)
                            }
                            onClick={handleSave}
                        >

                            {saving

                                ? 'Wird gespeichert...'

                                : `${anzahlEintraege.toLocaleString('de-DE')} Einträge speichern`}

                        </button>

                    </div>

                </>

            )}

        </section>
    );
}

export default AnwesenheitSammelerfassung;