import React, { useState } from 'react';

import {
    TIME_OPTIONS,
    getKlasseClassName,
    ANWESENHEIT_STATUS
} from './AnwesenheitUtils';

/* =====================================================
   SORTIERBARE SPALTEN
   ===================================================== */

function SortableHeader({
                            label,
                            column,
                            sortKey,
                            sortDirection,
                            onSort,
                            className = ''
                        }) {

    const active = sortKey === column;

    return (
        <th
            className={`sortable-header ${className}`}
            aria-sort={
                active
                    ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                    : 'none'
            }
        >
            <button
                type="button"
                className="anwesenheit-sort-button"
                onClick={() => onSort(column)}
            >
                {label}

                {active && (
                    <span className="anwesenheit-sort-icon">
                        {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                    </span>
                )}
            </button>
        </th>
    );
}

/* =====================================================
   UHRZEIT AUSWAHL
   ===================================================== */

function TimeSelect({
                        value,
                        onChange,
                        disabled,
                        label
                    }) {

    return (
        <select
            className="anwesenheit-time-select"
            value={value || ''}
            disabled={disabled}
            aria-label={label}
            onChange={event =>
                onChange(event.target.value)
            }
        >
            <option value="">–</option>

            {TIME_OPTIONS.map(time => (
                <option
                    key={time}
                    value={time}
                >
                    {time}
                </option>
            ))}
        </select>
    );
}

/* =====================================================
   ANWESENHEITSTABELLE
   ===================================================== */

function AnwesenheitTabelle({

                                rows = [],

                                selectedStudentIds = [],

                                onSelectStudent,

                                onSelectAll,

                                onChange,

                                onStatusChange,

                                sortKey,

                                sortDirection,

                                onSort,

                                disabled = false

                            }) {

    /* =====================================================
       ZWEITE ABWESENHEIT
       ===================================================== */

    const [expandedStudentIds, setExpandedStudentIds] =
        useState(() => new Set());

    const hasSecondAbsence = (anwesenheit) =>
        Boolean(
            anwesenheit?.abwesendAb2 ||
            anwesenheit?.abwesendBis2 ||
            anwesenheit?.grundAbwesenheit2
        );

    const isSecondAbsenceExpanded = (
        studentId,
        anwesenheit
    ) =>
        expandedStudentIds.has(String(studentId)) ||
        hasSecondAbsence(anwesenheit);

    const addSecondAbsence = (studentId) => {

        setExpandedStudentIds(previous => {

            const next = new Set(previous);

            next.add(String(studentId));

            return next;
        });
    };

    const removeSecondAbsence = (studentId) => {

        /*
         * Alle drei Felder der zweiten Abwesenheit
         * werden zurückgesetzt.
         */

        onChange(studentId, 'abwesendAb2', '');
        onChange(studentId, 'abwesendBis2', '');
        onChange(studentId, 'grundAbwesenheit2', '');

        setExpandedStudentIds(previous => {

            const next = new Set(previous);

            next.delete(String(studentId));

            return next;
        });
    };

    /* =====================================================
       SCHÜLERAUSWAHL
       ===================================================== */

    const selectedIds = new Set(
        selectedStudentIds.map(String)
    );

    const allSelected =
        rows.length > 0 &&
        rows.every(row =>
            selectedIds.has(String(row.studentId))
        );

    const partiallySelected =
        !allSelected &&
        rows.some(row =>
            selectedIds.has(String(row.studentId))
        );

    /* =====================================================
       RENDER
       ===================================================== */

    return (
        <div className="anwesenheit-table-scroll">

            <table className="anwesenheit-table anwesenheit-daily-table">

                {/* =========================================
                   TABELLENKOPF
                   ========================================= */}

                <thead>
                <tr>

                    {/* ALLE SCHÜLER AUSWÄHLEN */}

                    <th className="anwesenheit-selection-column">
                        <input
                            type="checkbox"
                            className="attendance-checkbox"
                            checked={allSelected}
                            disabled={
                                disabled ||
                                rows.length === 0
                            }
                            aria-label="Alle sichtbaren Schüler auswählen"
                            title="Alle sichtbaren Schüler auswählen"
                            ref={element => {
                                if (element) {
                                    element.indeterminate =
                                        partiallySelected;
                                }
                            }}
                            onChange={onSelectAll}
                        />
                    </th>

                    {/* NAME */}

                    <SortableHeader
                        label="Name"
                        column="name"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="anwesenheit-name-column"
                    />

                    {/* JAHRGANG */}

                    <SortableHeader
                        label="Jahrgang"
                        column="jahrgang"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                    />

                    {/* KLASSE */}

                    <SortableHeader
                        label="Klasse"
                        column="klasse"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                    />

                    {/* ANGEBOTE / ANA */}

                    <SortableHeader
                        label="Angebot / ANA"
                        column="gruppenText"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="anwesenheit-gruppen-column"
                    />

                    {/* BESONDERHEITEN */}

                    <SortableHeader
                        label="Besonderheiten"
                        column="besonderheiten"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="besonderheiten-column"
                    />

                    {/* ANWESEND */}

                    <SortableHeader
                        label="Anwesend"
                        column="anwesend"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="status-column"
                    />

                    {/* ABWESEND */}

                    <SortableHeader
                        label="Abwesend"
                        column="fehlt"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="status-column"
                    />

                    {/* ABWESEND AB */}

                    <SortableHeader
                        label="Abwesend ab"
                        column="abwesendAb"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="anwesenheit-time-column"
                    />

                    {/* ABWESEND BIS */}

                    <SortableHeader
                        label="Abwesend bis"
                        column="abwesendBis"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="anwesenheit-time-column"
                    />

                    {/* GRUND ABWESENHEIT */}

                    <th className="anwesenheit-grund-column">
                        Grund Abwesenheit
                    </th>

                    {/* ANA ANWESENHEITSKONTROLLE */}

                    <SortableHeader
                        label={
                            <span>
                                    ANA<br />
                                    Anwesenheitskontrolle
                                </span>
                        }
                        column="anaAnwesenheitskontrolle"
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="anwesenheit-ana-kontrolle-column"
                    />

                    {/* BEMERKUNG */}

                    <th className="anwesenheit-bemerkung-column">
                        Bemerkung
                    </th>

                </tr>
                </thead>

                {/* =========================================
                   TABELLENINHALT
                   ========================================= */}

                <tbody>

                {rows.map(row => {

                    const studentId = row.studentId;

                    const anwesenheit = row.anwesenheit;

                    const isSelected =
                        selectedIds.has(String(studentId));

                    const isAnwesend =
                        anwesenheit.status ===
                        ANWESENHEIT_STATUS.ANWESEND;

                    const isFehlend =
                        anwesenheit.status ===
                        ANWESENHEIT_STATUS.FEHLT;

                    const klasseClassName =
                        getKlasseClassName(row.klasse);

                    const gruppen = row.gruppen || [];

                    const secondAbsenceExpanded =
                        isSecondAbsenceExpanded(
                            studentId,
                            anwesenheit
                        );

                    return (

                        <React.Fragment key={studentId}>

                            {/* =================================
                                   HAUPTZEILE
                                   ================================= */}

                            <tr
                                className={[
                                    klasseClassName,
                                    isSelected
                                        ? 'anwesenheit-row-selected'
                                        : ''
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >

                                {/* SCHÜLER AUSWÄHLEN */}

                                <td className="anwesenheit-selection-column">
                                    <input
                                        type="checkbox"
                                        className="attendance-checkbox"
                                        checked={isSelected}
                                        disabled={disabled}
                                        aria-label={`${row.name} auswählen`}
                                        onChange={() =>
                                            onSelectStudent(studentId)
                                        }
                                    />
                                </td>

                                {/* NAME */}

                                <td className="anwesenheit-name-cell">
                                    {row.name}
                                </td>

                                {/* JAHRGANG */}

                                <td>
                                    {row.jahrgang ?? '–'}
                                </td>

                                {/* KLASSE */}

                                <td className="klasse-cell">
                                    {row.klasse || '–'}
                                </td>

                                {/* ANGEBOTE / ANA */}

                                <td className="anwesenheit-gruppen-cell">

                                    {gruppen.length === 0 ? (

                                        <span className="anwesenheit-muted">
                                                –
                                            </span>

                                    ) : (

                                        <div className="anwesenheit-gruppen-list">

                                            {gruppen.map(gruppe => (

                                                <div
                                                    key={`${gruppe.typ}-${gruppe.id}`}
                                                    className="anwesenheit-gruppe"
                                                >

                                                        <span
                                                            className={
                                                                gruppe.typ === 'ANA'
                                                                    ? 'anwesenheit-gruppe-badge ana'
                                                                    : 'anwesenheit-gruppe-badge angebot'
                                                            }
                                                        >
                                                            {gruppe.typ}
                                                        </span>

                                                    <span className="anwesenheit-gruppe-name">
                                                            {gruppe.name || '–'}
                                                        </span>

                                                </div>

                                            ))}

                                        </div>

                                    )}

                                </td>

                                {/* BESONDERHEITEN */}

                                <td className="besonderheiten-cell">

                                    {row.besonderheiten ? (

                                        <span className="besonderheiten-readonly">
                                                {row.besonderheiten}
                                            </span>

                                    ) : (

                                        <span className="anwesenheit-muted">
                                                –
                                            </span>

                                    )}

                                </td>

                                {/* ANWESEND */}

                                <td className="attendance-checkbox-cell">
                                    <input
                                        type="checkbox"
                                        className="attendance-checkbox anwesenheit-present-checkbox"
                                        checked={isAnwesend}
                                        disabled={disabled}
                                        aria-label={`${row.name}: Anwesend`}
                                        onChange={() =>
                                            onStatusChange(
                                                studentId,
                                                ANWESENHEIT_STATUS.ANWESEND
                                            )
                                        }
                                    />
                                </td>

                                {/* ABWESEND */}

                                <td className="attendance-checkbox-cell">
                                    <input
                                        type="checkbox"
                                        className="attendance-checkbox anwesenheit-absent-checkbox"
                                        checked={isFehlend}
                                        disabled={disabled}
                                        aria-label={`${row.name}: Abwesend`}
                                        onChange={() =>
                                            onStatusChange(
                                                studentId,
                                                ANWESENHEIT_STATUS.FEHLT
                                            )
                                        }
                                    />
                                </td>

                                {/* ABWESEND AB */}

                                <td className="anwesenheit-time-cell">

                                    <div className="anwesenheit-time-with-add">

                                        {!secondAbsenceExpanded && (

                                            <button
                                                type="button"
                                                className="anwesenheit-add-absence"
                                                disabled={disabled || isFehlend}
                                                title="Zweite Abwesenheit hinzufügen"
                                                aria-label={`${row.name}: Zweite Abwesenheit hinzufügen`}
                                                onClick={() =>
                                                    addSecondAbsence(studentId)
                                                }
                                            >
                                                +
                                            </button>

                                        )}

                                        <TimeSelect
                                            value={anwesenheit.abwesendAb}
                                            disabled={disabled || isFehlend}
                                            label={`${row.name}: Abwesend ab`}
                                            onChange={value =>
                                                onChange(
                                                    studentId,
                                                    'abwesendAb',
                                                    value
                                                )
                                            }
                                        />

                                    </div>

                                </td>

                                {/* ABWESEND BIS */}

                                <td className="anwesenheit-time-cell">
                                    <TimeSelect
                                        value={anwesenheit.abwesendBis}
                                        disabled={disabled || isFehlend}
                                        label={`${row.name}: Abwesend bis`}
                                        onChange={value =>
                                            onChange(
                                                studentId,
                                                'abwesendBis',
                                                value
                                            )
                                        }
                                    />
                                </td>

                                {/* GRUND ABWESENHEIT */}

                                <td className="anwesenheit-grund-cell">

                                    <input
                                        type="text"
                                        className="anwesenheit-grund-input"
                                        placeholder="Abwesenheitsgrund..."
                                        value={
                                            anwesenheit.grundAbwesenheit || ''
                                        }
                                        maxLength={50}
                                        disabled={disabled}
                                        aria-label={`${row.name}: Grund Abwesenheit`}
                                        onChange={event =>
                                            onChange(
                                                studentId,
                                                'grundAbwesenheit',
                                                event.target.value
                                            )
                                        }
                                    />

                                    <span className="anwesenheit-grund-counter">
                                            {
                                                (
                                                    anwesenheit.grundAbwesenheit || ''
                                                ).length
                                            } / 50
                                        </span>

                                </td>

                                {/* ANA ANWESENHEITSKONTROLLE */}

                                <td className="attendance-checkbox-cell">
                                    <input
                                        type="checkbox"
                                        className="attendance-checkbox anwesenheit-ana-checkbox"
                                        checked={
                                            anwesenheit.anaAnwesenheitskontrolle === true
                                        }
                                        disabled={disabled}
                                        aria-label={`${row.name}: ANA Anwesenheitskontrolle`}
                                        onChange={event =>
                                            onChange(
                                                studentId,
                                                'anaAnwesenheitskontrolle',
                                                event.target.checked
                                            )
                                        }
                                    />
                                </td>

                                {/* BEMERKUNG */}

                                <td className="anwesenheit-bemerkung-cell">
                                    <input
                                        type="text"
                                        className="bemerkung-input"
                                        placeholder="Bemerkung..."
                                        value={anwesenheit.bemerkung || ''}
                                        disabled={disabled}
                                        aria-label={`${row.name}: Bemerkung`}
                                        onChange={event =>
                                            onChange(
                                                studentId,
                                                'bemerkung',
                                                event.target.value
                                            )
                                        }
                                    />
                                </td>

                            </tr>

                            {/* =================================
                                   ZWEITE ABWESENHEIT
                                   ================================= */}

                            {secondAbsenceExpanded && (

                                <tr
                                    className={[
                                        klasseClassName,
                                        'anwesenheit-second-absence-row',
                                        isSelected
                                            ? 'anwesenheit-row-selected'
                                            : ''
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                >

                                    {/* LEERE SPALTEN */}

                                    <td colSpan={8}>
                                        <div className="anwesenheit-second-absence-label">
                                            ↳ Zweite Abwesenheit
                                        </div>
                                    </td>

                                    {/* ABWESEND AB 2 */}

                                    <td className="anwesenheit-time-cell">

                                        <div className="anwesenheit-time-with-add">

                                            <button
                                                type="button"
                                                className="anwesenheit-remove-absence"
                                                disabled={disabled}
                                                title="Zweite Abwesenheit entfernen"
                                                aria-label={`${row.name}: Zweite Abwesenheit entfernen`}
                                                onClick={() =>
                                                    removeSecondAbsence(studentId)
                                                }
                                            >
                                                −
                                            </button>

                                            <TimeSelect
                                                value={anwesenheit.abwesendAb2}
                                                disabled={disabled || isFehlend}
                                                label={`${row.name}: Zweite Abwesenheit ab`}
                                                onChange={value =>
                                                    onChange(
                                                        studentId,
                                                        'abwesendAb2',
                                                        value
                                                    )
                                                }
                                            />

                                        </div>

                                    </td>

                                    {/* ABWESEND BIS 2 */}

                                    <td className="anwesenheit-time-cell">
                                        <TimeSelect
                                            value={anwesenheit.abwesendBis2}
                                            disabled={disabled || isFehlend}
                                            label={`${row.name}: Zweite Abwesenheit bis`}
                                            onChange={value =>
                                                onChange(
                                                    studentId,
                                                    'abwesendBis2',
                                                    value
                                                )
                                            }
                                        />
                                    </td>

                                    {/* GRUND ABWESENHEIT 2 */}

                                    <td className="anwesenheit-grund-cell">

                                        <input
                                            type="text"
                                            className="anwesenheit-grund-input"
                                            placeholder="Zweiter Abwesenheitsgrund..."
                                            value={
                                                anwesenheit.grundAbwesenheit2 || ''
                                            }
                                            maxLength={50}
                                            disabled={disabled}
                                            aria-label={`${row.name}: Zweiter Abwesenheitsgrund`}
                                            onChange={event =>
                                                onChange(
                                                    studentId,
                                                    'grundAbwesenheit2',
                                                    event.target.value
                                                )
                                            }
                                        />

                                        <span className="anwesenheit-grund-counter">
                                                {
                                                    (
                                                        anwesenheit.grundAbwesenheit2 || ''
                                                    ).length
                                                } / 50
                                            </span>

                                    </td>

                                    {/* ANA + BEMERKUNG */}

                                    <td colSpan={2} />

                                </tr>

                            )}

                        </React.Fragment>

                    );
                })}

                </tbody>

            </table>

        </div>
    );
}

export default AnwesenheitTabelle;