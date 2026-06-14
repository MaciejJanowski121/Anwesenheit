import React from 'react';
import './StudentTable.css';

const columns = [
    { key: 'name', label: 'Name' },
    { key: 'jahrgang', label: 'Jahrgang' },
    { key: 'klasse', label: 'Klasse' },
    { key: 'klassenkuerzel', label: 'Klassenkürzel' },
    { key: 'mittagessen', label: 'Mittagessen' },
    { key: 'gehtUm1530', label: 'Geht um 15:30 Uhr' },
    { key: 'rueckmeldung', label: 'Rückmeldung' },
    { key: 'anaBuchung', label: 'ANA-Buchung' },
    { key: 'email1', label: 'Email 1' },
    { key: 'email2', label: 'Email 2' },
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
    const renderSortIndicator = (key) => {
        if (sortKey !== key) return null;
        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    };

    const renderCell = (student, col) => {
        const isEditing = editingId === student.id;

        if (col.key === 'mittagessen' || col.key === 'gehtUm1530') {
            if (isEditing) {
                return (
                    <input
                        type="checkbox"
                        checked={!!editData[col.key]}
                        onChange={(e) => onEditChange(col.key, e.target.checked)}
                    />
                );
            }
            return student[col.key] ? 'Ja' : 'Nein';
        }

        if (isEditing) {
            return (
                <input
                    className="edit-input"
                    type={col.key === 'jahrgang' ? 'number' : 'text'}
                    value={editData[col.key] ?? ''}
                    onChange={(e) =>
                        onEditChange(
                            col.key,
                            col.key === 'jahrgang' ? Number(e.target.value) : e.target.value
                        )
                    }
                />
            );
        }

        return student[col.key];
    };

    return (
        <div className="table-container">
            <table className="student-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="sortable-header"
                                onClick={() => onSort(col.key)}
                            >
                                {col.label}{renderSortIndicator(col.key)}
                            </th>
                        ))}
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length === 0 && (
                        <tr>
                            <td colSpan={columns.length + 1} className="empty-row">
                                Keine Einträge gefunden.
                            </td>
                        </tr>
                    )}
                    {students.map((student, index) => (
                        <tr key={student.id ?? index}>
                            {columns.map((col) => (
                                <td key={col.key}>{renderCell(student, col)}</td>
                            ))}
                            <td className="action-cell">
                                {editingId === student.id ? (
                                    <>
                                        <button className="btn-save" onClick={onEditSave}>
                                            Speichern
                                        </button>
                                        <button className="btn-cancel" onClick={onEditCancel}>
                                            Abbrechen
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="btn-edit"
                                            onClick={() => onEditStart(student)}
                                        >
                                            Bearbeiten
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => onDelete(student.id)}
                                        >
                                            Löschen
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default StudentTable;
