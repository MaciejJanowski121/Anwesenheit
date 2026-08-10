import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import StudentDetailView from '../components/StudentDetailView';

import {
    getStudentById,
    updateStudent
} from '../services/studentService';

import { getKurse } from '../services/kursService';

import {
    getBuchungenByStudent,
    createBuchung,
    deleteBuchung
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
                console.error(error);

                setError(
                    'Schüler konnte nicht geladen werden.'
                );
            })
            .finally(() => {
                setLoading(false);
            });

    }, [id]);

    const handleAssignKurs = async (kursId) => {
        try {
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
            console.error(error);

            setError(
                'Kurs konnte nicht zugewiesen werden.'
            );
        }
    };

    const handleDeleteBuchung = async (
        buchungId
    ) => {
        try {
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
            console.error(error);

            setError(
                'Kurs konnte nicht entfernt werden.'
            );
        }
    };

    const handleUpdateGehtUm1530 = async (
        value
    ) => {
        try {
            setError('');

            const updatedStudent =
                await updateStudent(
                    id,
                    {
                        ...student,
                        gehtUm1530: value
                    }
                );

            setStudent(updatedStudent);

            return updatedStudent;

        } catch (error) {
            console.error(
                'Fehler beim Speichern von gehtUm1530:',
                error
            );

            setError(
                'Die 15:30-Einstellung konnte nicht gespeichert werden.'
            );

            throw error;
        }
    };

    if (loading) {
        return (
            <p className="details-message">
                Schüler wird geladen...
            </p>
        );
    }

    if (error) {
        return (
            <p className="details-message error">
                {error}
            </p>
        );
    }

    if (!student) {
        return (
            <p className="details-message error">
                Schüler nicht gefunden.
            </p>
        );
    }

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

                onUpdateGehtUm1530={
                    handleUpdateGehtUm1530
                }

                onClose={() =>
                    navigate(
                        '/gesamtuebersicht'
                    )
                }
            />
        </div>
    );
}

export default StudentDetailsPage;