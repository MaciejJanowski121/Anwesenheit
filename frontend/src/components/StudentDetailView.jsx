import React from 'react';
import './StudentDetailView.css';

function StudentDetailView({ student, buchungen, onClose }) {
    return (
        <div className="student-detail-view">
            <button className="back-button" onClick={onClose}>
                Zurück zur Übersicht
            </button>

            <div className="detail-header">
                <h2>{student.name}</h2>
                <p>Schülerdetails</p>
            </div>

            <section className="detail-section">
                <h3>Allgemeine Informationen</h3>

                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Jahrgang</span>
                        <span className="detail-value">{student.jahrgang || '–'}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Klasse</span>
                        <span className="detail-value">{student.klasse || '–'}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Rückmeldung</span>
                        <span className="detail-value">{student.rueckmeldung || '–'}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">ANA-Buchung</span>
                        <span className="detail-value">{student.anaBuchung || '–'}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Geht um 15:30 Uhr</span>
                        <span className="detail-value">
                            {student.gehtUm1530 ? 'Ja' : 'Nein'}
                        </span>
                    </div>
                </div>
            </section>

            <section className="detail-section">
                <h3>Betreuung und Essen</h3>

                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Mittagessen</span>
                        <span className="detail-value">
                            {student.mittagessen ? 'Ja' : 'Nein'}
                        </span>
                    </div>
                </div>
            </section>

            <section className="detail-section">
                <h3>Kontakt</h3>

                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Email 1</span>
                        <span className="detail-value">
                            {student.email1 || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Email 2</span>
                        <span className="detail-value">
                            {student.email2 || '–'}
                        </span>
                    </div>
                </div>
            </section>

            <section className="detail-section">
                <h3>Kursbuchungen</h3>

                {buchungen && buchungen.length > 0 ? (
                    <table className="detail-table">
                        <thead>
                        <tr>
                            <th>Kurs</th>
                            <th>Wochentag</th>
                            <th>Uhrzeit</th>
                            <th>Beschreibung</th>
                        </tr>
                        </thead>

                        <tbody>
                        {buchungen.map((buchung) => (
                            <tr key={buchung.id}>
                                <td>{buchung.kurs?.name || '–'}</td>
                                <td>{buchung.kurs?.wochentag || '–'}</td>
                                <td>{buchung.kurs?.uhrzeit || '–'}</td>
                                <td>{buchung.kurs?.beschreibung || '–'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="empty-text">
                        Noch keine Kursbuchungen vorhanden.
                    </p>
                )}
            </section>

            <section className="detail-section">
                <h3>Anwesenheit</h3>

                <p className="empty-text">
                    Anwesenheitsdaten werden später ergänzt.
                </p>
            </section>
        </div>
    );
}

export default StudentDetailView;