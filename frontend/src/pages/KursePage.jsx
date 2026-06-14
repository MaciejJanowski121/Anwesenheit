import React, { useEffect, useState } from 'react';
import { getKurse } from '../services/kursService';
import './KursePage.css';

function KursePage() {

    const [kurse, setKurse] = useState([]);

    useEffect(() => {

        getKurse()
            .then((data) => setKurse(data))
            .catch((error) => console.error(error));

    }, []);

    return (
        <div className="kurse-page">
            <h2>Kurse</h2>

            <table className="kurse-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Wochentag</th>
                    <th>Uhrzeit</th>
                    <th>Beschreibung</th>
                </tr>
                </thead>

                <tbody>
                {kurse.map((kurs) => (
                    <tr key={kurs.id}>
                        <td>{kurs.name}</td>
                        <td>{kurs.wochentag}</td>
                        <td>{kurs.uhrzeit}</td>
                        <td>{kurs.beschreibung}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default KursePage;