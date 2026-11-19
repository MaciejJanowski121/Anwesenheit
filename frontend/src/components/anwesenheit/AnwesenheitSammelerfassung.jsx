import React, { useState } from 'react';

import {
    TIME_OPTIONS,
    ANWESENHEIT_STATUS
} from './AnwesenheitUtils';

/* =====================================================
   STANDARDWERTE
   ===================================================== */

const createInitialValues = () => ({
    status: 'unchanged',
    abwesendAb: 'unchanged',
    abwesendBis: 'unchanged',
    anaAnwesenheitskontrolle: 'unchanged'
});

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
        Object.values(values).some(
            value => value !== 'unchanged'
        );

    const formDisabled =
        disabled ||
        saving ||
        selectedCount === 0;

    const allSelected =
        totalCount > 0 &&
        selectedCount === totalCount;

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
       FORMULAR ZURÜCKSETZEN
       ===================================================== */

    const handleReset = () => {

        setValues(
            createInitialValues()
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

        const payload =
            createPayload();

        /* =============================================
           UHRZEITEN VALIDIEREN
           ============================================= */

        if (
            payload.abwesendAb &&
            payload.abwesendBis &&
            payload.abwesendAb >= payload.abwesendBis
        ) {

            setError(
                '„Abwesend ab“ muss vor „Abwesend bis“ liegen.'
            );

            return;
        }

        /* =============================================
           BESTÄTIGUNG
           ============================================= */

        const confirmed = window.confirm(

            `Möchten Sie die ausgewählten Felder für ` +
            `${selectedCount} Schüler aktualisieren?`

        );

        if (!confirmed) {
            return;
        }

        try {

            setSaving(true);

            await onSave(payload);

        } catch (err) {

            setError(
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

            {/* =========================================
               HEADER
               ========================================= */}

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

                    {/* =================================
                       SCHÜLERAUSWAHL
                       ================================= */}

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

                    {/* =================================
                       HINWEIS
                       ================================= */}

                    <p className="anwesenheit-sammel-hint">

                        Wählen Sie die gewünschten Schüler
                        und die zu ändernden Felder aus.
                        Alle anderen Werte bleiben unverändert.

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

                    {/* =================================
                       FORMULAR
                       ================================= */}

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

                    {/* =================================
                       AKTIONEN
                       ================================= */}

                    <div className="anwesenheit-sammel-actions">

                        <button
                            type="button"
                            className="anwesenheit-sammel-reset-button"
                            disabled={
                                saving ||
                                !hasChanges
                            }
                            onClick={handleReset}
                        >

                            Zurücksetzen

                        </button>

                        <button
                            type="button"
                            className="save-button"
                            disabled={
                                formDisabled ||
                                !hasChanges
                            }
                            onClick={handleSave}
                        >

                            {saving

                                ? 'Wird gespeichert...'

                                : `Für ${selectedCount} Schüler speichern`}

                        </button>

                    </div>

                </>

            )}

        </section>
    );
}

export default AnwesenheitSammelerfassung;