import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import StudentDetailView from '../components/StudentDetailView';

import {
    getStudentById
} from '../services/studentService';

import { getKurse } from '../services/kursService';

import {
    getBuchungenByStudent,
    createBuchung,
    deleteBuchung,
    updateBesonderheiten
} from '../services/buchungService';

import {
    getAnwesenheitenByStudent
} from '../services/anwesenheitService';

import './StudentDetailsPage.css';

function StudentDetailsPage() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [buchungen, setBuchungen] = useState([]);
    const [kurse, setKurse] = useState([]);
    const [anwesenheiten, setAnwesenheiten] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    /* =====================================================
       SCHÜLERDETAILS LADEN
       ===================================================== */

    useEffect(() => {

        setLoading(true);

        Promise.all([
            getStudentById(id),
            getBuchungenByStudent(id),
            getKurse(),
            getAnwesenheitenByStudent(id)
        ])
            .then(([
                       studentData,
                       buchungenData,
                       kurseData,
                       anwesenheitenData
                   ]) => {

                setStudent(studentData);
                setBuchungen(buchungenData);
                setKurse(kurseData);
                setAnwesenheiten(anwesenheitenData);

                setError('');
            })
            .catch((error) => {

                console.error(
                    'Fehler beim Laden der Schülerdetails:',
                    error
                );

                setError(
                    'Schüler konnte nicht geladen werden.'
                );
            })
            .finally(() => {

                setLoading(false);
            });

    }, [id]);


    /* =====================================================
       KURS ZUWEISEN
       ===================================================== */

    const handleAssignKurs = async (kursId) => {

        try {

            setError('');

            const newBuchung =
                await createBuchung(
                    id,
                    kursId
                );

            setBuchungen((previous) => [
                ...previous,
                newBuchung
            ]);

        } catch (error) {

            console.error(
                'Fehler beim Zuweisen des Kurses:',
                error
            );

            setError(
                'Kurs konnte nicht zugewiesen werden.'
            );
        }
    };


    /* =====================================================
       BUCHUNG LÖSCHEN
       ===================================================== */

    const handleDeleteBuchung = async (buchungId) => {

        try {

            setError('');

            await deleteBuchung(
                buchungId
            );

            setBuchungen((previous) =>
                previous.filter(
                    (buchung) =>
                        buchung.id !== buchungId
                )
            );

        } catch (error) {

            console.error(
                'Fehler beim Entfernen des Kurses:',
                error
            );

            setError(
                'Kurs konnte nicht entfernt werden.'
            );
        }
    };


    /* =====================================================
       BESONDERHEITEN AKTUALISIEREN

       Besonderheiten gehören zur Buchung:
       Schüler + Kurs.

       Die Information "Geht um 15:30 Uhr"
       wird künftig ebenfalls individuell
       über Besonderheiten verwaltet.
       ===================================================== */

    const handleUpdateBesonderheiten = async (
        buchungId,
        besonderheiten
    ) => {

        try {

            setError('');

            const updatedBuchung =
                await updateBesonderheiten(
                    buchungId,
                    besonderheiten
                );

            setBuchungen((previous) =>
                previous.map(
                    (buchung) =>
                        buchung.id === buchungId
                            ? updatedBuchung
                            : buchung
                )
            );

            return updatedBuchung;

        } catch (error) {

            console.error(
                'Besonderheiten konnten nicht gespeichert werden:',
                error
            );

            setError(
                'Besonderheiten konnten nicht gespeichert werden.'
            );

            throw error;
        }
    };


    /* =====================================================
       LADEN
       ===================================================== */

    if (loading) {

        return (
            <p className="details-message">
                Schüler wird geladen...
            </p>
        );
    }


    /* =====================================================
       FEHLER
       ===================================================== */

    if (error) {

        return (
            <p className="details-message error">
                {error}
            </p>
        );
    }


    /* =====================================================
       SCHÜLER NICHT GEFUNDEN
       ===================================================== */

    if (!student) {

        return (
            <p className="details-message error">
                Schüler nicht gefunden.
            </p>
        );
    }


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="student-details-page">

            <StudentDetailView

                student={student}

                buchungen={buchungen}

                kurse={kurse}

                anwesenheiten={anwesenheiten}

                onAssignKurs={
                    handleAssignKurs
                }

                onDeleteBuchung={
                    handleDeleteBuchung
                }

                onUpdateBesonderheiten={
                    handleUpdateBesonderheiten
                }

                onClose={() =>
                    navigate('/gesamtuebersicht')
                }
            />

        </div>
    );
}

export default StudentDetailsPage;