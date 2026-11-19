import React, {
    useEffect,
    useRef,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import './StudentTable.css';


/* =====================================================
   TABELLENSPALTEN
   ===================================================== */

const columns = [

    { key: 'nachname', label: 'Nachname' },

    { key: 'vorname', label: 'Vorname' },

    { key: 'jahrgang', label: 'Jahrgang' },

    { key: 'klasse', label: 'Klasse' },

    { key: 'fotoFreigabe', label: 'Fotofreigabe' },

    {
        key: 'anzahlAnwesend',
        label: 'Anwesend (Tage)',
        readOnly: true
    },

    {
        key: 'anzahlFehlend',
        label: 'Fehlt (Tage)',
        readOnly: true
    },

    {
        key: 'anzahlTeilweiseAbwesend',
        label: 'Teilweise abwesend',
        readOnly: true
    },

    {
        key: 'anzahlUngeprueft',
        label: 'Ungeprüft',
        readOnly: true
    },

    { key: 'email1', label: 'Email 1' },

    { key: 'telefon1', label: 'Telefon 1' },

    { key: 'mobil1', label: 'Mobil 1' },

    { key: 'email2', label: 'Email 2' },

    { key: 'telefon2', label: 'Telefon 2' },

    { key: 'mobil2', label: 'Mobil 2' }

];


/* =====================================================
   STUDENT TABLE
   ===================================================== */

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


    /* =====================================================
       TABELLENBREITE MESSEN
       ===================================================== */

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

        const observer = new ResizeObserver(
            updateScrollWidth
        );

        if (tableContentRef.current) {

            observer.observe(
                tableContentRef.current
            );
        }

        const table =
            tableContentRef.current?.querySelector(
                'table'
            );

        if (table) {

            observer.observe(table);
        }

        window.addEventListener(
            'resize',
            updateScrollWidth
        );

        return () => {

            observer.disconnect();

            window.removeEventListener(
                'resize',
                updateScrollWidth
            );
        };

    }, [students, editingId]);


    /* =====================================================
       SCROLLBALKEN SYNCHRONISIEREN
       ===================================================== */

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


    /* =====================================================
       SORTIERUNG
       ===================================================== */

    const renderSortIndicator = (key) => {

        if (sortKey !== key) {

            return null;
        }

        return sortDirection === 'asc'
            ? ' ▲'
            : ' ▼';
    };


    /* =====================================================
       SCHÜLERDETAILS ÖFFNEN
       ===================================================== */

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


    /* =====================================================
       TABELLENZELLE
       ===================================================== */

    const renderCell = (student, col) => {

        const isEditing =
            editingId === student.id;


        /* =================================================
           TAGESANWESENHEITSSTATISTIK

           Automatisch berechnet.
           Nicht manuell editierbar.
           ================================================= */

        if (col.readOnly) {

            return student[col.key] ?? '–';
        }


        /* =================================================
           SCHÜLER BEARBEITEN
           ================================================= */

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


        /* =================================================
           STANDARDWERT
           ================================================= */

        if (student[col.key] === 0) {

            return 0;
        }

        return student[col.key] || '–';
    };


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="student-table-wrapper">

            {/* OBERER SCROLLBALKEN */}

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


            {/* TABELLE */}

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
                                    colSpan={columns.length + 1}
                                    className="empty-row"
                                >

                                    Keine Einträge gefunden.

                                </td>

                            </tr>

                        )}


                        {students.map((student, index) => (

                            <tr
                                key={student.id ?? index}

                                className={

                                    editingId === student.id

                                        ? 'student-row student-row-editing'

                                        : 'student-row'
                                }

                                onClick={() =>
                                    handleRowClick(student)
                                }
                            >

                                {columns.map((col) => (

                                    <td key={col.key}>

                                        {renderCell(
                                            student,
                                            col
                                        )}

                                    </td>

                                ))}


                                {/* AKTIONEN */}

                                <td
                                    className="action-cell"

                                    onClick={(event) =>
                                        event.stopPropagation()
                                    }
                                >

                                    {editingId === student.id ? (

                                        <>

                                            <button
                                                type="button"
                                                className="btn-save"
                                                onClick={onEditSave}
                                            >

                                                Speichern

                                            </button>


                                            <button
                                                type="button"
                                                className="btn-cancel"
                                                onClick={onEditCancel}
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

                        ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default StudentTable;