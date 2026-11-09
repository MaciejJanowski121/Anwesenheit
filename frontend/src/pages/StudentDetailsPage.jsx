import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import StudentDetailView from '../components/StudentDetailView';

import {
    getStudentById
} from '../services/studentService';

import {
    getKurse
} from '../services/kursService';

import {
    getBuchungenByStudent,
    createBuchung,
    deleteBuchung,
    updateBesonderheiten
} from '../services/buchungService';

import {
    getAnwesenheitenByStudent
} from '../services/anwesenheitService';

import {
    getAngebote
} from '../services/angebotService';

import {
    getTeilnahmenByStudent,
    addStudentToAngebot,
    deleteAngebotTeilnahme,
    updateAngebotTeilnahmeBesonderheiten
} from '../services/angebotTeilnahmeService';

import './StudentDetailsPage.css';


function StudentDetailsPage() {

    const { id } = useParams();
    const navigate = useNavigate();

    /* =====================================================
       SCHÜLER
       ===================================================== */

    const [student, setStudent] = useState(null);

    /* =====================================================
       ANA
       ===================================================== */

    const [buchungen, setBuchungen] = useState([]);
    const [kurse, setKurse] = useState([]);
    const [anwesenheiten, setAnwesenheiten] = useState([]);

    /* =====================================================
       ANGEBOTE
       ===================================================== */

    const [angebote, setAngebote] = useState([]);
    const [angebotTeilnahmen, setAngebotTeilnahmen] = useState([]);

    /* =====================================================
       STATUS
       ===================================================== */

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    /* =====================================================
       SCHÜLERDETAILS LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const loadStudentDetails = async () => {

            try {

                setLoading(true);
                setError('');

                const [
                    studentData,
                    buchungenData,
                    kurseData,
                    anwesenheitenData,
                    angeboteData,
                    teilnahmenData
                ] = await Promise.all([

                    getStudentById(id),
                    getBuchungenByStudent(id),
                    getKurse(),
                    getAnwesenheitenByStudent(id),
                    getAngebote(),
                    getTeilnahmenByStudent(id)

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

                setKurse(
                    Array.isArray(kurseData)
                        ? kurseData
                        : []
                );

                setAnwesenheiten(
                    Array.isArray(anwesenheitenData)
                        ? anwesenheitenData
                        : []
                );

                setAngebote(
                    Array.isArray(angeboteData)
                        ? angeboteData
                        : []
                );

                setAngebotTeilnahmen(
                    Array.isArray(teilnahmenData)
                        ? teilnahmenData
                        : []
                );

            } catch (error) {

                console.error(
                    'Fehler beim Laden der Schülerdetails:',
                    error
                );

                if (active) {

                    setError(
                        'Schüler konnte nicht geladen werden.'
                    );
                }

            } finally {

                if (active) {
                    setLoading(false);
                }
            }
        };

        loadStudentDetails();

        return () => {
            active = false;
        };

    }, [id]);


    /* =====================================================
       ANA – KURS ZUWEISEN
       ===================================================== */

    const handleAssignKurs = async (kursId) => {

        try {

            setError('');

            const newBuchung = await createBuchung(
                id,
                kursId
            );

            setBuchungen((previous) => [
                ...previous,
                newBuchung
            ]);

            return newBuchung;

        } catch (error) {

            console.error(
                'Fehler beim Zuweisen des Kurses:',
                error
            );

            setError(
                'Kurs konnte nicht zugewiesen werden.'
            );

            throw error;
        }
    };


    /* =====================================================
       ANA – BUCHUNG LÖSCHEN
       ===================================================== */

    const handleDeleteBuchung = async (buchungId) => {

        try {

            setError('');

            await deleteBuchung(buchungId);

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
       ANA – BESONDERHEITEN AKTUALISIEREN
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
       ANGEBOTE – ANGEBOT ZUWEISEN
       ===================================================== */

    const handleAssignAngebot = async (angebotId) => {

        try {

            setError('');

            /*
             * WICHTIG:
             *
             * angebotTeilnahmeService.js erwartet:
             *
             * addStudentToAngebot(angebotId, studentId)
             *
             * Deshalb zuerst angebotId,
             * danach die Schüler-ID.
             */

            await addStudentToAngebot(
                angebotId,
                id
            );

            /*
             * Nach dem Hinzufügen werden die
             * Angebotsbuchungen neu geladen.
             *
             * Dadurch enthält die Liste alle
             * aktuellen Daten aus der Datenbank.
             */

            const updatedTeilnahmen =
                await getTeilnahmenByStudent(id);

            setAngebotTeilnahmen(
                Array.isArray(updatedTeilnahmen)
                    ? updatedTeilnahmen
                    : []
            );

        } catch (error) {

            console.error(
                'Fehler beim Zuweisen des Angebots:',
                error
            );

            setError(
                'Angebot konnte nicht zugewiesen werden.'
            );

            throw error;
        }
    };


    /* =====================================================
       ANGEBOTE – BUCHUNG ENTFERNEN
       ===================================================== */

    const handleDeleteAngebotTeilnahme = async (
        teilnahmeId
    ) => {

        try {

            setError('');

            await deleteAngebotTeilnahme(
                teilnahmeId
            );

            setAngebotTeilnahmen((previous) =>
                previous.filter(
                    (teilnahme) =>
                        teilnahme.id !== teilnahmeId
                )
            );

        } catch (error) {

            console.error(
                'Fehler beim Entfernen des Angebots:',
                error
            );

            setError(
                'Angebot konnte nicht entfernt werden.'
            );
        }
    };


    /* =====================================================
       ANGEBOTE – BESONDERHEITEN AKTUALISIEREN
       ===================================================== */

    const handleUpdateAngebotBesonderheiten = async (
        teilnahmeId,
        besonderheiten
    ) => {

        try {

            setError('');

            /*
             * Die Funktion heißt im Service:
             *
             * updateAngebotTeilnahmeBesonderheiten
             */

            const updatedTeilnahme =
                await updateAngebotTeilnahmeBesonderheiten(
                    teilnahmeId,
                    besonderheiten
                );

            setAngebotTeilnahmen((previous) =>
                previous.map(
                    (teilnahme) =>
                        teilnahme.id === teilnahmeId
                            ? updatedTeilnahme
                            : teilnahme
                )
            );

            return updatedTeilnahme;

        } catch (error) {

            console.error(
                'Besonderheiten des Angebots konnten nicht gespeichert werden:',
                error
            );

            setError(
                'Besonderheiten des Angebots konnten nicht gespeichert werden.'
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
       FEHLER BEIM LADEN
       ===================================================== */

    if (error && !student) {

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

            {/* =========================================
                FEHLERMELDUNG
               ========================================= */}

            {error && (

                <p className="details-message error">
                    {error}
                </p>

            )}


            {/* =========================================
                SCHÜLERDETAILS
               ========================================= */}

            <StudentDetailView

                student={student}

                /* =====================================
                   ANA
                   ===================================== */

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


                /* =====================================
                   ANGEBOTE
                   ===================================== */

                angebote={angebote}

                angebotTeilnahmen={angebotTeilnahmen}

                onAssignAngebot={
                    handleAssignAngebot
                }

                onDeleteAngebotTeilnahme={
                    handleDeleteAngebotTeilnahme
                }

                onUpdateAngebotBesonderheiten={
                    handleUpdateAngebotBesonderheiten
                }


                /* =====================================
                   ZURÜCK
                   ===================================== */

                onClose={() =>
                    navigate('/gesamtuebersicht')
                }

            />

        </div>
    );
}

export default StudentDetailsPage;