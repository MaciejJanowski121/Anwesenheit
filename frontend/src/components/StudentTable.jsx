import React from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentTable.css';

const columns = [
    { key: 'nachname', label: 'Nachname' },
    { key: 'vorname', label: 'Vorname' },
    { key: 'jahrgang', label: 'Jahrgang' },
    { key: 'klasse', label: 'Klasse' },
    { key: 'fotoFreigabe', label: 'Fotofreigabe' },

    // Anwesenheitsstatistik
    { key: 'anzahlAnwesend', label: 'Anzahl Anwesend', readOnly: true },
    { key: 'anzahlEntschuldigt', label: 'Anzahl Entschuldigt', readOnly: true },
    { key: 'anzahlFehlend', label: 'Anzahl Fehlend', readOnly: true },

    { key: 'email1', label: 'Email 1' },
    { key: 'telefon1', label: 'Telefon 1' },
    { key: 'mobil1', label: 'Mobil 1' },
    { key: 'email2', label: 'Email 2' },
    { key: 'telefon2', label: 'Telefon 2' },
    { key: 'mobil2', label: 'Mobil 2' },
];

function StudentTable({
                          students,
                          sortKey,
                          sortDirection,
                          onSort,
                          editingId,
                          editData,
                          onEditStart,
                          onEditChange,
                          onEditSave,
                          onEditCancel,
                          onDelete,
                      }) {
    const navigate = useNavigate();

    const renderSortIndicator = (key) => {
        if (sortKey !== key) {
            return null;
        }

        return sortDirection === 'asc'
            ? ' ▲'
            : ' ▼';
    };

    const handleRowClick = (student) => {
        /*
         * Während der Bearbeitung soll ein Klick
         * auf die Zeile nicht zur Detailansicht führen.
         */
        if (editingId === student.id) {
            return;
        }

        /*
         * Temporär angelegte Schüler besitzen noch
         * keine echte Datenbank-ID.
         */
        if (typeof student.id !== 'number') {
            return;
        }

        navigate(`/students/${student.id}`);
    };

    const renderCell = (student, col) => {
        const isEditing =
            editingId === student.id;

        /*
         * Anwesenheitswerte werden automatisch
         * berechnet und dürfen hier nicht bearbeitet werden.
         */
        if (col.readOnly) {
            return student[col.key] ?? 0;
        }

        if (isEditing) {
            return (
                <input
                    className="edit-input"
                    type={
                        col.key === 'jahrgang'
                            ? 'number'
                            : 'text'
                    }
                    value={
                        editData[col.key] ?? ''
                    }
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                    onChange={(event) =>
                        onEditChange(
                            col.key,
                            col.key === 'jahrgang'
                                ? event.target.value === ''
                                    ? ''
                                    : Number(
                                        event.target.value
                                    )
                                : event.target.value
                        )
                    }
                />
            );
        }

        /*
         * 0 soll bei Zahlen auch wirklich als 0
         * angezeigt werden und nicht als "–".
         */
        if (
            student[col.key] === 0
        ) {
            return 0;
        }

        return student[col.key] || '–';
    };

    return (
        <div className="student-table-scroll">
            <div className="student-table-container">
                <table className="student-table">
                    <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="sortable-header"
                                onClick={() =>
                                    onSort(col.key)
                                }
                            >
                                    <span className="header-content">
                                        {col.label}

                                        {renderSortIndicator(
                                            col.key
                                        )}
                                    </span>
                            </th>
                        ))}

                        <th className="actions-header">
                            Aktionen
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {students.length === 0 && (
                        <tr>
                            <td
                                colSpan={
                                    columns.length + 1
                                }
                                className="empty-row"
                            >
                                Keine Einträge gefunden.
                            </td>
                        </tr>
                    )}

                    {students.map(
                        (student, index) => (
                            <tr
                                key={
                                    student.id ??
                                    index
                                }
                                className={
                                    editingId ===
                                    student.id
                                        ? 'student-row student-row-editing'
                                        : 'student-row'
                                }
                                onClick={() =>
                                    handleRowClick(
                                        student
                                    )
                                }
                            >
                                {columns.map(
                                    (col) => (
                                        <td
                                            key={
                                                col.key
                                            }
                                        >
                                            {renderCell(
                                                student,
                                                col
                                            )}
                                        </td>
                                    )
                                )}

                                <td
                                    className="action-cell"
                                    onClick={(
                                        event
                                    ) =>
                                        event.stopPropagation()
                                    }
                                >
                                    {editingId ===
                                    student.id ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn-save"
                                                onClick={
                                                    onEditSave
                                                }
                                            >
                                                Speichern
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-cancel"
                                                onClick={
                                                    onEditCancel
                                                }
                                            >
                                                Abbrechen
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="btn-details"
                                                onClick={() =>
                                                    navigate(
                                                        `/students/${student.id}`
                                                    )
                                                }
                                            >
                                                Details
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-edit"
                                                onClick={() =>
                                                    onEditStart(
                                                        student
                                                    )
                                                }
                                            >
                                                Bearbeiten
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-delete"
                                                onClick={() =>
                                                    onDelete(
                                                        student.id
                                                    )
                                                }
                                            >
                                                Löschen
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default StudentTable;