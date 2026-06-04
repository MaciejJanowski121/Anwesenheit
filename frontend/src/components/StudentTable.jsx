import React from 'react';
import './StudentTable.css';

const columns = [
    'Name',
    'Jahrgang',
    'Klasse',
    'Klassenkürzel',
    'Mittagessen',
    'Geht um 15:30 Uhr',
    'Rückmeldung',
    'ANA-Buchung',
    'Email 1',
    'Email 2',
];

function StudentTable({ students }) {
    return (
        <table className="student-table">
            <thead>
                <tr>
                    {columns.map((col) => (
                        <th key={col}>{col}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {students.map((student, index) => (
                    <tr key={student.id ?? index}>
                        <td>{student.name}</td>
                        <td>{student.jahrgang}</td>
                        <td>{student.klasse}</td>
                        <td>{student.klassenkuerzel}</td>
                        <td>{student.mittagessen ? 'Ja' : 'Nein'}</td>
                        <td>{student.gehtUm1530 ? 'Ja' : 'Nein'}</td>
                        <td>{student.rueckmeldung}</td>
                        <td>{student.anaBuchung}</td>
                        <td>{student.email1}</td>
                        <td>{student.email2}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default StudentTable;
