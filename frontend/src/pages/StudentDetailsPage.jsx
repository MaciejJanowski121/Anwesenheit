import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentDetailView from '../components/StudentDetailView';
import { getStudentById } from '../services/studentService';
import './StudentDetailsPage.css';

function StudentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        getStudentById(id)
            .then((data) => {
                setStudent(data);
                setError('');
            })
            .catch((error) => {
                console.error(error);
                setError('Schüler konnte nicht geladen werden.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <p className="details-message">Schüler wird geladen...</p>;
    }

    if (error) {
        return <p className="details-message error">{error}</p>;
    }

    return (
        <div className="student-details-page">
            <StudentDetailView
                student={student}
                onClose={() => navigate('/gesamtuebersicht')}
            />
        </div>
    );
}

export default StudentDetailsPage;