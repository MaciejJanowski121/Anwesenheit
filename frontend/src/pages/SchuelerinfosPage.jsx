import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
    getSchuelerinfos
} from '../services/schuelerinfoService';

import './SchuelerinfosPage.css';

function SchuelerinfosPage() {

    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filter, setFilter] = useState('');

    /* =====================================================
       SCHÜLER LADEN
       ===================================================== */

    useEffect(() => {

        const loadStudents = async () => {

            try {

                setLoading(true);
                setError('');

                const data = await getSchuelerinfos();

                setStudents(
                    Array.isArray(data) ? data : []
                );

            } catch (error) {

                console.error(
                    'Fehler beim Laden der Schülerinfos:',
                    error
                );

                setError(
                    'Die Schülerinfos konnten nicht geladen werden.'
                );

            } finally {

                setLoading(false);
            }
        };

        loadStudents();

    }, []);


    /* =====================================================
       SUCHEN UND SORTIEREN
       ===================================================== */

    const filteredStudents = useMemo(() => {

        const term = filter.trim().toLowerCase();

        return students
            .filter((student) => {

                if (!term) {
                    return true;
                }

                return [
                    student.nachname,
                    student.vorname,
                    student.jahrgang,
                    student.klasse,
                    student.fotoFreigabe,
                    student.email1,
                    student.telefon1,
                    student.mobil1,
                    student.email2,
                    student.telefon2,
                    student.mobil2
                ].some((value) =>
                    String(value ?? '')
                        .toLowerCase()
                        .includes(term)
                );

            })
            .sort((a, b) => {

                const nachname =
                    String(a.nachname ?? '')
                        .localeCompare(
                            String(b.nachname ?? ''),
                            'de'
                        );

                if (nachname !== 0) {
                    return nachname;
                }

                return String(a.vorname ?? '')
                    .localeCompare(
                        String(b.vorname ?? ''),
                        'de'
                    );
            });

    }, [students, filter]);


    /* =====================================================
       SCHÜLERDETAILS ÖFFNEN
       ===================================================== */

    const openStudentDetails = (studentId) => {

        navigate(
            `/schuelerinfos/${studentId}`
        );
    };


    /* =====================================================
       TASTATURSTEUERUNG

       Enter oder Leertaste öffnet Schülerdetails.
       ===================================================== */

    const handleRowKeyDown = (
        event,
        studentId
    ) => {

        if (
            event.target !== event.currentTarget
        ) {
            return;
        }

        if (
            event.key === 'Enter' ||
            event.key === ' '
        ) {

            event.preventDefault();

            openStudentDetails(
                studentId
            );
        }
    };


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="schuelerinfos-page">

            <header className="page-header">

                <div className="page-header-content">

                    <h1>
                        Schülerinfos
                    </h1>

                    <p>
                        Schülerdaten und Kontaktdaten
                    </p>

                </div>

            </header>


            {error && (

                <div className="schuelerinfos-error">
                    {error}
                </div>

            )}


            <section className="schuelerinfos-content">

                {/* =====================================
                    SUCHFELD
                   ===================================== */}

                <div className="schuelerinfos-toolbar">

                    <input
                        type="text"
                        placeholder="Schüler suchen..."
                        value={filter}
                        onChange={(event) =>
                            setFilter(
                                event.target.value
                            )
                        }
                    />

                    <span>
                        {filteredStudents.length} Schüler
                    </span>

                </div>


                {/* =====================================
                    SCHÜLERTABELLE
                   ===================================== */}

                <div className="schuelerinfos-table-scroll">

                    <table className="schuelerinfos-table">

                        <thead>

                        <tr>
                            <th>Nachname</th>
                            <th>Vorname</th>
                            <th>Jahrgang</th>
                            <th>Klasse</th>
                            <th>Fotofreigabe</th>
                            <th>Email 1</th>
                            <th>Telefon 1</th>
                            <th>Mobil 1</th>
                            <th>Email 2</th>
                            <th>Telefon 2</th>
                            <th>Mobil 2</th>
                            <th>Details</th>
                        </tr>

                        </thead>


                        <tbody>

                        {loading ? (

                            <tr>
                                <td
                                    colSpan="12"
                                    className="schuelerinfos-empty"
                                >
                                    Schüler werden geladen...
                                </td>
                            </tr>

                        ) : filteredStudents.length === 0 ? (

                            <tr>
                                <td
                                    colSpan="12"
                                    className="schuelerinfos-empty"
                                >
                                    Keine Schüler gefunden.
                                </td>
                            </tr>

                        ) : (

                            filteredStudents.map(
                                (student) => (

                                    <tr
                                        key={student.id}

                                        /* Ganzen Schüler anklickbar machen */
                                        onClick={() =>
                                            openStudentDetails(
                                                student.id
                                            )
                                        }

                                        /* Tastatur: Enter / Leertaste */
                                        onKeyDown={(event) =>
                                            handleRowKeyDown(
                                                event,
                                                student.id
                                            )
                                        }

                                        tabIndex={0}
                                        role="link"

                                        className="schuelerinfos-clickable-row"

                                        title="Schülerdetails öffnen"
                                    >

                                        <td>
                                            {student.nachname || '–'}
                                        </td>

                                        <td>
                                            {student.vorname || '–'}
                                        </td>

                                        <td>
                                            {student.jahrgang ?? '–'}
                                        </td>

                                        <td>
                                            {student.klasse || '–'}
                                        </td>

                                        <td>
                                            {student.fotoFreigabe || '–'}
                                        </td>

                                        <td>
                                            {student.email1 || '–'}
                                        </td>

                                        <td>
                                            {student.telefon1 || '–'}
                                        </td>

                                        <td>
                                            {student.mobil1 || '–'}
                                        </td>

                                        <td>
                                            {student.email2 || '–'}
                                        </td>

                                        <td>
                                            {student.telefon2 || '–'}
                                        </td>

                                        <td>
                                            {student.mobil2 || '–'}
                                        </td>


                                        {/* =================================
                                            DETAILS BUTTON
                                           ================================= */}

                                        <td>

                                            <button
                                                type="button"
                                                className="schuelerinfos-details-button"

                                                onClick={(event) => {

                                                    // Verhindert doppeltes Auslösen
                                                    event.stopPropagation();

                                                    openStudentDetails(
                                                        student.id
                                                    );
                                                }}
                                            >
                                                Details
                                            </button>

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

export default SchuelerinfosPage;