import React from 'react';
import './StudentDetailView.css';

const wochentage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

function StudentDetailView({ student, onClose }) {
    return (
        <div className="student-detail-view">
            <button className="back-button" onClick={onClose}>
                ← Zurück zur Übersicht
            </button>

            <h3>{student.name}</h3>

            <section className="detail-section">
                <h4>Allgemeine Informationen</h4>
                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Jahrgang</span>
                        <span className="detail-value">{student.jahrgang}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Klasse</span>
                        <span className="detail-value">{student.klasse}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Klassenkürzel</span>
                        <span className="detail-value">{student.klassenkuerzel}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Rückmeldung</span>
                        <span className="detail-value">{student.rueckmeldung}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">ANA-Buchung</span>
                        <span className="detail-value">{student.anaBuchung}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Geht um 15:30 Uhr</span>
                        <span className="detail-value">{student.gehtUm1530 ? 'Ja' : 'Nein'}</span>
                    </div>
                </div>
            </section>

            <section className="detail-section">
                <h4>Kontakt</h4>
                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Email 1</span>
                        <span className="detail-value">{student.email1}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Email 2</span>
                        <span className="detail-value">{student.email2}</span>
                    </div>
                </div>
            </section>

            <section className="detail-section">
                <h4>Mittagessen</h4>
                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Mittagessen</span>
                        <span className="detail-value">{student.mittagessen ? 'Ja' : 'Nein'}</span>
                    </div>
                    {student.mittagsdetails && (
                        <>
                            <div className="detail-item">
                                <span className="detail-label">Typ</span>
                                <span className="detail-value">{student.mittagsdetails.typ}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Allergien</span>
                                <span className="detail-value">{student.mittagsdetails.allergien}</span>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <section className="detail-section">
                <h4>Buchungen (Wochentage / Kurse)</h4>
                <table className="detail-table">
                    <thead>
                        <tr>
                            <th>Wochentag</th>
                            <th>Kurs</th>
                            <th>Zeit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wochentage.map((tag) => {
                            const key = tag.toLowerCase();
                            const buchung = student.buchungen?.[key];
                            return (
                                <tr key={tag}>
                                    <td>{tag}</td>
                                    <td>{buchung ? buchung.kurs : '–'}</td>
                                    <td>{buchung ? buchung.zeit : '–'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>

            <section className="detail-section">
                <h4>Gebühren</h4>
                <div className="detail-grid">
                    {student.gebuehren && (
                        <>
                            <div className="detail-item">
                                <span className="detail-label">Monatlich</span>
                                <span className="detail-value">{student.gebuehren.monatlich} €</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Bezahlt</span>
                                <span className="detail-value">{student.gebuehren.bezahlt ? 'Ja' : 'Nein'}</span>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <section className="detail-section">
                <h4>Bemerkungen</h4>
                <p className="detail-remarks">
                    {student.bemerkungen || 'Keine Bemerkungen.'}
                </p>
            </section>
        </div>
    );
}

export default StudentDetailView;
