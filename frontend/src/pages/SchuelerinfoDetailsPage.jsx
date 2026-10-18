import React, {
    useEffect,
    useState
} from 'react';

import {
    useNavigate,
    useParams
} from 'react-router-dom';

import {
    getSchuelerinfoById
} from '../services/schuelerinfoService';

import {
    getBuchungenByStudent
} from '../services/buchungService';

import './SchuelerinfosPage.css';


function SchuelerinfoDetailsPage() {

    const { id } = useParams();
    const navigate = useNavigate();

    /* =====================================================
       STATES
       ===================================================== */

    const [student, setStudent] = useState(null);
    const [buchungen, setBuchungen] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    /* =====================================================
       SCHÜLER UND KURSBUCHUNGEN LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const loadStudent = async () => {

            try {

                setLoading(true);
                setError('');

                const [
                    studentData,
                    buchungenData
                ] = await Promise.all([

                    getSchuelerinfoById(id),

                    getBuchungenByStudent(id)

                ]);

                if (!active) {
                    return;
                }

                setStudent(studentData);

                setBuchungen(
                    Array.isArray(buchungenData)
                        ? buchungenData
                        : []
                );

            } catch (error) {

                console.error(
                    'Fehler beim Laden der Schülerdetails:',
                    error
                );

                if (active) {

                    setError(
                        'Schülerdetails konnten nicht geladen werden.'
                    );
                }

            } finally {

                if (active) {
                    setLoading(false);
                }
            }
        };

        loadStudent();

        return () => {
            active = false;
        };

    }, [id]);


    /* =====================================================
       WERTE FORMATIEREN
       ===================================================== */

    const formatValue = (value) => {

        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return '–';
        }

        return value;
    };


    /* =====================================================
       INFORMATIONSKARTE
       ===================================================== */

    const renderField = (label, value) => (

        <div
            key={label}
            className="schuelerinfos-detail-card"
        >

            <span>
                {label}
            </span>

            <strong>
                {formatValue(value)}
            </strong>

        </div>

    );


    /* =====================================================
       LADEN
       ===================================================== */

    if (loading) {

        return (

            <div className="schuelerinfos-page">

                <p>Schüler wird geladen...</p>

            </div>
        );
    }


    /* =====================================================
       FEHLER
       ===================================================== */

    if (error) {

        return (

            <div className="schuelerinfos-page">

                <div className="schuelerinfos-error">
                    {error}
                </div>

            </div>
        );
    }


    /* =====================================================
       SCHÜLER NICHT GEFUNDEN
       ===================================================== */

    if (!student) {

        return <p>Schüler nicht gefunden.</p>;
    }


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="schuelerinfos-page">


            {/* =========================================
                ZURÜCK
               ========================================= */}

            <button
                type="button"
                className="schuelerinfos-back-button"
                onClick={() =>
                    navigate('/schuelerinfos')
                }
            >
                ← Zurück zu Schülerinfos
            </button>


            {/* =========================================
                HEADER
               ========================================= */}

            <header className="page-header">

                <div className="page-header-content">

                    <h1>
                        {student.vorname} {student.nachname}
                    </h1>

                    <p>
                        Schülerdetails
                    </p>

                </div>

            </header>


            {/* =========================================
                ALLGEMEINE INFORMATIONEN
               ========================================= */}

            <section className="schuelerinfos-detail-section">

                <h2>
                    Allgemeine Informationen
                </h2>

                <div className="schuelerinfos-details-grid">

                    {renderField(
                        'Vorname',
                        student.vorname
                    )}

                    {renderField(
                        'Nachname',
                        student.nachname
                    )}

                    {renderField(
                        'Jahrgang',
                        student.jahrgang
                    )}

                    {renderField(
                        'Klasse',
                        student.klasse
                    )}

                    {renderField(
                        'Foto- und Bildfreigabe',
                        student.fotoFreigabe
                    )}

                </div>

            </section>


            {/* =========================================
                KONTAKT 1
               ========================================= */}

            <section className="schuelerinfos-detail-section">

                <h2>
                    Kontakt 1
                </h2>

                <div className="schuelerinfos-details-grid">

                    {renderField(
                        'Email 1',
                        student.email1
                    )}

                    {renderField(
                        'Telefon 1',
                        student.telefon1
                    )}

                    {renderField(
                        'Mobil 1',
                        student.mobil1
                    )}

                </div>

            </section>


            {/* =========================================
                KONTAKT 2
               ========================================= */}

            <section className="schuelerinfos-detail-section">

                <h2>
                    Kontakt 2
                </h2>

                <div className="schuelerinfos-details-grid">

                    {renderField(
                        'Email 2',
                        student.email2
                    )}

                    {renderField(
                        'Telefon 2',
                        student.telefon2
                    )}

                    {renderField(
                        'Mobil 2',
                        student.mobil2
                    )}

                </div>

            </section>


            {/* =========================================
                GEBUCHTE KURSE
               ========================================= */}

            <section className="schuelerinfos-detail-section">

                <div className="schuelerinfos-kurse-header">

                    <h2>
                        Gebuchte Kurse
                    </h2>

                    <span className="schuelerinfos-kurse-count">

                        {buchungen.length}

                        {' '}

                        {buchungen.length === 1
                            ? 'Kurs'
                            : 'Kurse'}

                    </span>

                </div>


                {/* =====================================
                    KURSTABELLE
                   ===================================== */}

                {buchungen.length > 0 ? (

                    <div className="schuelerinfos-kurse-scroll">

                        <table className="schuelerinfos-kurse-table">

                            <thead>

                            <tr>

                                <th>Kurs</th>

                                <th>Kursleitung</th>

                                <th>Wochentag</th>

                                <th>Uhrzeit</th>

                            </tr>

                            </thead>


                            <tbody>

                            {buchungen.map((buchung) => (

                                <tr key={buchung.id}>

                                    <td>
                                        {formatValue(
                                            buchung.kurs?.name
                                        )}
                                    </td>

                                    <td>
                                        {formatValue(
                                            buchung.kurs?.kursleitung
                                        )}
                                    </td>

                                    <td>
                                        {formatValue(
                                            buchung.kurs?.wochentag
                                        )}
                                    </td>

                                    <td>
                                        {formatValue(
                                            buchung.kurs?.uhrzeit
                                        )}
                                    </td>

                                </tr>

                            ))}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <p className="schuelerinfos-kurse-empty">

                        Noch keine Kursbuchungen vorhanden.

                    </p>

                )}

            </section>

        </div>
    );
}

export default SchuelerinfoDetailsPage;