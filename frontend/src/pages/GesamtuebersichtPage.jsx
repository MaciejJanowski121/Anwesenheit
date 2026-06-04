import React from 'react';
import StudentTable from '../components/StudentTable';
import './GesamtuebersichtPage.css';

const mockStudents = [
    {
        id: 1,
        name: "Max Mustermann",
        jahrgang: 5,
        klasse: "5A",
        klassenkuerzel: "5A",
        mittagessen: true,
        gehtUm1530: false,
        rueckmeldung: "Ja",
        anaBuchung: "Montag",
        email1: "max@test.de",
        email2: "eltern@test.de"
    },
    {
        id: 2,
        name: "Anna Schmidt",
        jahrgang: 3,
        klasse: "3B",
        klassenkuerzel: "3B",
        mittagessen: false,
        gehtUm1530: true,
        rueckmeldung: "Nein",
        anaBuchung: "Dienstag",
        email1: "anna@test.de",
        email2: "familie@test.de"
    }
];

function GesamtuebersichtPage() {
    return (
        <div className="gesamtuebersicht-page">
            <h2>Gesamtübersicht</h2>
            <StudentTable students={mockStudents} />
        </div>
    );
}

export default GesamtuebersichtPage;
