import React, {
    useEffect,
    useRef,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import './StudentTable.css';

const columns = [
    { key: 'nachname', label: 'Nachname' },
    { key: 'vorname', label: 'Vorname' },
    { key: 'jahrgang', label: 'Jahrgang' },
    { key: 'klasse', label: 'Klasse' },
    { key: 'fotoFreigabe', label: 'Fotofreigabe' },

    {
        key: 'anzahlAnwesend',
        label: 'Anzahl Anwesend',
        readOnly: true
    },

    {
        key: 'anzahlEntschuldigt',
        label: 'Anzahl Entschuldigt',
        readOnly: true
    },

    {
        key: 'anzahlFehlend',
        label: 'Anzahl Fehlend',
        readOnly: true
    },

    { key: 'email1', label: 'Email 1' },
    { key: 'telefon1', label: 'Telefon 1' },
    { key: 'mobil1', label: 'Mobil 1' },
    { key: 'email2', label: 'Email 2' },
    { key: 'telefon2', label: 'Telefon 2' },
    { key: 'mobil2', label: 'Mobil 2' }
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
                          onDelete
                      }) {
    const navigate = useNavigate();

    const topScrollRef = useRef(null);
    const tableScrollRef = useRef(null);
    const tableContentRef = useRef(null);

    const [scrollWidth, setScrollWidth] =
        useState(0);

    /*
     * Breite der Tabelle messen.
     *
     * Diese Breite wird für den künstlichen
     * oberen Scrollbereich verwendet.
     */
    useEffect(() => {
        const updateScrollWidth = () => {
            if (!tableContentRef.current) {
                return;
            }

            setScrollWidth(
                tableContentRef.current.scrollWidth
            );
        };

        updateScrollWidth();

        window.addEventListener(
            'resize',
            updateScrollWidth
        );

        return () => {
            window.removeEventListener(
                'resize',
                updateScrollWidth
            );
        };
    }, [students]);

    /*
     * Wenn oben gescrollt wird,
     * wird die Tabelle mitbewegt.
     */
    const handleTopScroll = () => {
        if (
            !topScrollRef.current ||
            !tableScrollRef.current
        ) {
            return;
        }

        tableScrollRef.current.scrollLeft =
            topScrollRef.current.scrollLeft;
    };

    /*
     * Wenn die Tabelle z. B. mit Trackpad,
     * Magic Mouse oder Shift + Mausrad
     * bewegt wird, folgt der obere Balken.
     */
    const handleTableScroll = () => {
        if (
            !topScrollRef.current ||
            !tableScrollRef.current
        ) {
            return;
        }

        topScrollRef.current.scrollLeft =
            tableScrollRef.current.scrollLeft;
    };

    const renderSortIndicator = (key) => {
        if (sortKey !== key) {
            return null;
        }

        return sortDirection === 'asc'
            ? ' ▲'
            : ' ▼';
    };

    const handleRowClick = (student) => {
        if (editingId === student.id) {
            return;
        }

        if (typeof student.id !== 'number') {
            return;
        }

        navigate(
            `/students/${student.id}`
        );
    };

    const renderCell = (
        student,
        col
    ) => {
        const isEditing =
            editingId === student.id;

        /*
         * Anwesenheitsstatistik wird automatisch
         * berechnet und ist nicht editierbar.
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

        if (student[col.key] === 0) {
            return 0;
        }

        return student[col.key] || '–';
    };

    return (
        <div className="student-table-wrapper">

            {/* =================================================
                OBERER HORIZONTALER SCROLLBALKEN
               ================================================= */}

            <div
                ref={topScrollRef}
                className="student-table-top-scroll"
                onScroll={handleTopScroll}
            >
                <div
                    className="student-table-top-scroll-content"
                    style={{
                        width: `${scrollWidth}px`
                    }}
                />
            </div>

            {/* =================================================
                TABELLE
               ================================================= */}

            <div
                ref={tableScrollRef}
                className="student-table-scroll"
                onScroll={handleTableScroll}
            >
                <div
                    ref={tableContentRef}
                    className="student-table-container"
                >
                    <table className="student-table">

                        <thead>
                        <tr>

                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="sortable-header"
                                    onClick={() =>
                                        onSort(
                                            col.key
                                        )
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
                            (
                                student,
                                index
                            ) => (
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
                                        onClick={(event) =>
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
        </div>
    );
}

export default StudentTable;