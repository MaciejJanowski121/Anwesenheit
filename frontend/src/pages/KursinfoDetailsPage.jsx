import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    useNavigate,
    useParams
} from 'react-router-dom';

import {
    getKursById
} from '../services/kursService';

import {
    getBuchungenByKurs
} from '../services/buchungService';

import './KursinfoDetailsPage.css';

function KursinfoDetailsPage() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [kurs, setKurs] = useState(null);
    const [buchungen, setBuchungen] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    /* =====================================================
       DATEN LADEN
       ===================================================== */

    useEffect(() => {

        const loadData = async () => {

            try {

                setLoading(true);
                setError('');

                const [
                    kursData,
                    buchungenData
                ] = await Promise.all([
                    getKursById(id),
                    getBuchungenByKurs(id)
                ]);

                setKurs(kursData);

                setBuchungen(
                    Array.isArray(buchungenData)
                        ? buchungenData
                        : []
                );

            } catch (error) {

                console.error(
                    'Kursinfo konnte nicht geladen werden:',
                    error
                );

                setError(
                    'Die Kursinformationen konnten nicht geladen werden.'
                );

            } finally {

                setLoading(false);
            }
        };

        loadData();

    }, [id]);

    /* =====================================================
       SCHÜLER SORTIEREN
       ===================================================== */

    const sortedBuchungen =
        useMemo(() => {

            return [
                ...buchungen
            ].sort(
                (a, b) => {

                    const studentA =
                        a.student || {};

                    const studentB =
                        b.student || {};

                    const nachname =
                        String(
                            studentA.nachname ?? ''
                        ).localeCompare(
                            String(
                                studentB.nachname ?? ''
                            ),
                            'de'
                        );

                    if (nachname !== 0) {
                        return nachname;
                    }

                    return String(
                        studentA.vorname ?? ''
                    ).localeCompare(
                        String(
                            studentB.vorname ?? ''
                        ),
                        'de'
                    );
                }
            );

        }, [buchungen]);

    if (loading) {

        return (
            <div className="kursinfo-details-message">
                Kurs wird geladen...
            </div>
        );
    }

    if (error) {

        return (
            <div className="kursinfo-details-message kursinfo-details-error">
                {error}
            </div>
        );
    }

    if (!kurs) {

        return (
            <div className="kursinfo-details-message">
                Kurs nicht gefunden.
            </div>
        );
    }

    return (

        <div className="kursinfo-details-page">

            <button
                type="button"
                className="back-button"
                onClick={() =>
                    navigate('/kursinfos')
                }
            >
                Zurück zu den Kursinfos
            </button>

            <header className="page-header">

                <div className="page-header-content">

                    <h1>
                        {kurs.name}
                    </h1>

                    <p>
                        Kursinformationen
                    </p>

                </div>

                <span className="kursinfo-details-count">
                    {buchungen.length}{' '}
                    {buchungen.length === 1
                        ? 'Schüler'
                        : 'Schüler'}
                </span>

            </header>

            <section className="kursinfo-details-info">

                <div>
                    <span>
                        Kurs
                    </span>

                    <strong>
                        {kurs.name || '–'}
                    </strong>
                </div>

                <div>
                    <span>
                        Kursleitung
                    </span>

                    <strong>
                        {kurs.kursleitung || '–'}
                    </strong>
                </div>

                <div>
                    <span>
                        Wochentag
                    </span>

                    <strong>
                        {kurs.wochentag || '–'}
                    </strong>
                </div>

                <div>
                    <span>
                        Beginn
                    </span>

                    <strong>
                        {kurs.uhrzeit || '–'}
                    </strong>
                </div>

                <div>
                    <span>
                        Ende
                    </span>

                    <strong>
                        {kurs.uhrzeitEnde || '–'}
                    </strong>
                </div>

                <div>
                    <span>
                        Buchungsart
                    </span>

                    <strong>
                        {kurs.buchungsart || '–'}
                    </strong>
                </div>

            </section>

            <section className="kursinfo-students">

                <div className="kursinfo-students-header">

                    <div>
                        <h2>
                            Kursteilnehmer
                        </h2>

                        <p>
                            Zugeordnete Schüler dieses Kurses
                        </p>
                    </div>

                </div>

                <div className="kursinfo-table-scroll">

                    <table className="kursinfo-student-table">

                        <thead>

                        <tr>
                            <th>Nachname</th>
                            <th>Vorname</th>
                            <th>Jahrgang</th>
                            <th>Klasse</th>
                            <th>Besonderheiten</th>
                        </tr>

                        </thead>

                        <tbody>

                        {sortedBuchungen.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="5"
                                    className="kursinfo-empty"
                                >
                                    Keine Schüler zugeordnet.
                                </td>

                            </tr>

                        ) : (

                            sortedBuchungen.map(
                                (buchung) => {

                                    const student =
                                        buchung.student || {};

                                    return (

                                        <tr key={buchung.id}>

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
                                                {buchung.besonderheiten || '–'}
                                            </td>

                                        </tr>
                                    );
                                }
                            )

                        )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

export default KursinfoDetailsPage;