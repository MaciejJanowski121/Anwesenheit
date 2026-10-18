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

import './SchuelerinfosPage.css';

function SchuelerinfoDetailsPage() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {

        const loadStudent = async () => {

            try {

                setLoading(true);

                const data = await getSchuelerinfoById(id);

                setStudent(data);

            } catch (error) {

                console.error(error);

                setError(
                    'Schüler konnte nicht geladen werden.'
                );

            } finally {

                setLoading(false);
            }
        };

        loadStudent();

    }, [id]);

    if (loading) {
        return <p>Schüler wird geladen...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!student) {
        return <p>Schüler nicht gefunden.</p>;
    }

    const fields = [
        ['Nachname', student.nachname],
        ['Vorname', student.vorname],
        ['Jahrgang', student.jahrgang],
        ['Klasse', student.klasse],
        ['Fotofreigabe', student.fotoFreigabe],
        ['Email 1', student.email1],
        ['Telefon 1', student.telefon1],
        ['Mobil 1', student.mobil1],
        ['Email 2', student.email2],
        ['Telefon 2', student.telefon2],
        ['Mobil 2', student.mobil2],

    ];

    return (

        <div className="schuelerinfos-page">

            <button
                type="button"
                className="schuelerinfos-back-button"
                onClick={() =>
                    navigate('/schuelerinfos')
                }
            >
                ← Zurück zu Schülerinfos
            </button>

            <header className="page-header">

                <div className="page-header-content">

                    <h1>
                        {student.vorname} {student.nachname}
                    </h1>

                    <p>Schülerdetails</p>

                </div>

            </header>

            <section className="schuelerinfos-details-grid">

                {fields.map(([label, value]) => (

                    <div
                        key={label}
                        className="schuelerinfos-detail-card"
                    >

                        <span>{label}</span>

                        <strong>
                            {value === null ||
                            value === undefined ||
                            value === ''
                                ? '–'
                                : value}
                        </strong>

                    </div>

                ))}

            </section>

        </div>
    );
}

export default SchuelerinfoDetailsPage;