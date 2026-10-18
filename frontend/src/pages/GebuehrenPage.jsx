import React, { useEffect, useMemo, useState } from 'react';
import {
    getGebuehrenUebersicht,
    getGebuehrenBerechnung,
    getGebuehrenTarife,
    updateGebuehrenTarif,
    getBuchungenByStudent,
    getGebuehrenStatus,
    toggleGebuehrenErfasst,
    updateGebuehrenKorrektur
} from '../services/gebuehrenService';
import './GebuehrenPage.css';

const SCHULJAHRE = ['2025/2026', '2026/2027', '2027/2028', '2028/2029'];
const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const ZAHL = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

const geld = (wert) => EUR.format(Number(wert) || 0);
const faktorText = (wert) => ZAHL.format(Number(wert) || 0);
const eingabeBetrag = (wert) => String(wert ?? '').replace('.', ',');

// Akzeptiert z. B. "-37,50" oder "150.00", aber keine ungültigen Beträge.
function parseBetrag(text, negativeErlaubt = false) {
    const sauber = String(text).trim().replace(',', '.');
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(sauber)) return null;
    const zahl = Number(sauber);
    if (!Number.isFinite(zahl) || (!negativeErlaubt && zahl < 0)) return null;
    return zahl.toFixed(2);
}

function fehlerText(error, standard) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
        return 'Kein Zugriff. Für Gebühren sind Administratorrechte erforderlich.';
    }
    return standard;
}

function buchungsart(kurs) {
    return String(kurs?.buchungsart || '').toUpperCase();
}

function berechnungText(kurs) {
    switch (buchungsart(kurs)) {
        case 'OGS': return '1 Kurs';
        case 'OGSH': return '0,5 Kurs';
        case 'M': return 'Individuelle Musikgebühr';
        case 'KURZ':
        case 'OGSF':
        case 'P': return 'Kostenlos';
        default: return '–';
    }
}

function kursFaktor(kurs) {
    if (buchungsart(kurs) === 'OGS') return 1;
    if (buchungsart(kurs) === 'OGSH') return 0.5;
    return 0;
}

function GebuehrenPage() {
    const [schuljahr, setSchuljahr] = useState('2026/2027');
    const [halbjahr, setHalbjahr] = useState(1);
    const [ansicht, setAnsicht] = useState('uebersicht');
    const [suche, setSuche] = useState('');
    const [uebersicht, setUebersicht] = useState([]);
    const [tarife, setTarife] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [tarifEntwuerfe, setTarifEntwuerfe] = useState({});

    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [details, setDetails] = useState(null);
    const [buchungen, setBuchungen] = useState([]);
    const [erfassung, setErfassung] = useState(null);
    const [korrekturEntwurf, setKorrekturEntwurf] = useState('0,00');
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Übersicht und Tarife immer für das ausgewählte Schuljahr laden.
    useEffect(() => {
        let aktiv = true;
        setLoading(true);
        setError('');
        setMessage('');

        Promise.all([
            getGebuehrenUebersicht(schuljahr, halbjahr),
            getGebuehrenTarife(schuljahr)
        ])
            .then(([liste, tarifListe]) => {
                if (!aktiv) return;
                setUebersicht(Array.isArray(liste) ? liste : []);
                const sichereTarife = Array.isArray(tarifListe) ? tarifListe : [];
                setTarife(sichereTarife);
                setTarifEntwuerfe(Object.fromEntries(
                    sichereTarife.map(t => [t.id, eingabeBetrag(t.betrag)])
                ));
            })
            .catch(err => {
                console.error(err);
                if (aktiv) setError(fehlerText(err, 'Gebührendaten konnten nicht geladen werden.'));
            })
            .finally(() => { if (aktiv) setLoading(false); });

        return () => { aktiv = false; };
    }, [schuljahr, halbjahr]);

    // Beim Wechsel des Zeitraums zurück zur Übersicht, um keine alten Details anzuzeigen.
    useEffect(() => {
        setAnsicht('uebersicht');
        setSelectedStudentId(null);
        setDetails(null);
        setBuchungen([]);
        setErfassung(null);
    }, [schuljahr, halbjahr]);

    const gefiltert = useMemo(() => {
        const term = suche.trim().toLocaleLowerCase('de-DE');
        return [...uebersicht]
            .filter(s => `${s.nachname || ''} ${s.vorname || ''} ${s.vorname || ''} ${s.nachname || ''}`
                .toLocaleLowerCase('de-DE').includes(term))
            .sort((a, b) =>
                String(a.nachname || '').localeCompare(String(b.nachname || ''), 'de') ||
                String(a.vorname || '').localeCompare(String(b.vorname || ''), 'de')
            );
    }, [uebersicht, suche]);

    const aktualisiereUebersicht = async () => {
        const liste = await getGebuehrenUebersicht(schuljahr, halbjahr);
        setUebersicht(Array.isArray(liste) ? liste : []);
    };

    const oeffneDetails = async (studentId) => {
        setSelectedStudentId(studentId);
        setAnsicht('details');
        setDetails(null);
        setErfassung(null);
        setBuchungen([]);
        setDetailsLoading(true);
        setError('');
        setMessage('');
        try {
            const [berechnung, buchungsListe, status] = await Promise.all([
                getGebuehrenBerechnung(studentId, schuljahr, halbjahr),
                getBuchungenByStudent(studentId),
                getGebuehrenStatus(studentId, schuljahr, halbjahr)
            ]);
            setDetails(berechnung);
            setBuchungen(Array.isArray(buchungsListe) ? buchungsListe : []);
            setErfassung(status);
            setKorrekturEntwurf(eingabeBetrag(status?.gebuehrenkorrektur ?? 0));
        } catch (err) {
            console.error(err);
            setError(fehlerText(err, 'Schülerdetails konnten nicht geladen werden.'));
        } finally {
            setDetailsLoading(false);
        }
    };

    const zurUebersicht = () => {
        setAnsicht('uebersicht');
        setSelectedStudentId(null);
        setDetails(null);
        setErfassung(null);
        setBuchungen([]);
        setError('');
        setMessage('');
    };

    const speichereTarif = async (tarif) => {
        const betrag = parseBetrag(tarifEntwuerfe[tarif.id]);
        if (betrag === null) {
            setError('Bitte einen gültigen, nicht negativen Betrag mit maximal zwei Nachkommastellen eingeben.');
            return;
        }
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const gespeichert = await updateGebuehrenTarif(tarif.id, betrag);
            setTarife(alt => alt.map(t => t.id === tarif.id ? gespeichert : t));
            setTarifEntwuerfe(alt => ({ ...alt, [tarif.id]: eingabeBetrag(gespeichert.betrag) }));
            await aktualisiereUebersicht();
            setMessage('Gebührentarif wurde gespeichert. Die Übersicht wurde aktualisiert.');
        } catch (err) {
            console.error(err);
            setError(fehlerText(err, 'Gebührentarif konnte nicht gespeichert werden.'));
        } finally {
            setSaving(false);
        }
    };

    const speichereKorrektur = async () => {
        if (!selectedStudentId) return;
        const betrag = parseBetrag(korrekturEntwurf, true);
        if (betrag === null) {
            setError('Bitte eine gültige Korrektur mit maximal zwei Nachkommastellen eingeben (z. B. -25,50).');
            return;
        }
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const status = await updateGebuehrenKorrektur(selectedStudentId, schuljahr, halbjahr, betrag);
            setErfassung(status);
            setKorrekturEntwurf(eingabeBetrag(status?.gebuehrenkorrektur ?? betrag));
            const berechnung = await getGebuehrenBerechnung(selectedStudentId, schuljahr, halbjahr);
            setDetails(berechnung);
            await aktualisiereUebersicht();
            setMessage('Gebührenkorrektur wurde gespeichert.');
        } catch (err) {
            console.error(err);
            setError(fehlerText(err, 'Gebührenkorrektur konnte nicht gespeichert werden.'));
        } finally {
            setSaving(false);
        }
    };

    const toggleErfasst = async () => {
        if (!selectedStudentId) return;
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const status = await toggleGebuehrenErfasst(selectedStudentId, schuljahr, halbjahr);
            setErfassung(status);
            setMessage('Erfassungsstatus wurde aktualisiert.');
        } catch (err) {
            console.error(err);
            setError(fehlerText(err, 'Erfassungsstatus konnte nicht aktualisiert werden.'));
        } finally {
            setSaving(false);
        }
    };

    const exportiereExcel = async () => {
        if (loading || uebersicht.length === 0) return;
        setExporting(true);
        setError('');
        try {
            // Dynamischer Import: ExcelJS wird nur beim Export geladen.
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Gebührenübersicht');
            sheet.addRow([`Gebührenübersicht – ${schuljahr}, ${halbjahr}. Halbjahr`]);
            sheet.mergeCells('A1:H1');
            sheet.getRow(1).font = { bold: true, size: 15 };
            sheet.addRow([]);
            sheet.columns = [
                { key: 'nachname', width: 24 },
                { key: 'vorname', width: 24 },
                { key: 'kursbuchungen', width: 19 },
                { key: 'musikbuchungen', width: 19 },
                { key: 'kursgebuehren', width: 20 },
                { key: 'musikgebuehren', width: 20 },
                { key: 'gebuehrenkorrektur', width: 23 },
                { key: 'gesamtgebuehren', width: 22 }
            ];
            const header = sheet.addRow([
                'Nachname', 'Vorname', 'Kursbuchungen', 'Musikbuchungen',
                'Kursgebühren', 'Musikgebühren', 'Gebührenkorrektur', 'Gesamtgebühren'
            ]);
            header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27354A' } };
            sheet.views = [{ state: 'frozen', ySplit: 3 }];
            gefiltert.forEach(s => {
                const row = sheet.addRow([
                    s.nachname || '', s.vorname || '', Number(s.kursbuchungen) || 0,
                    Number(s.musikbuchungen) || 0, Number(s.kursgebuehren) || 0,
                    Number(s.musikgebuehren) || 0, Number(s.gebuehrenkorrektur) || 0,
                    Number(s.gesamtgebuehren) || 0
                ]);
                [5, 6, 7, 8].forEach(index => {
                    row.getCell(index).numFmt = '#,##0.00 "€"';
                });
            });
            sheet.autoFilter = { from: 'A3', to: 'H3' };
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Gebuehren_${schuljahr.replace('/', '-')}_H${halbjahr}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setMessage('Excel-Datei wurde erstellt.');
        } catch (err) {
            console.error(err);
            setError('Excel-Export konnte nicht erstellt werden.');
        } finally {
            setExporting(false);
        }
    };

    const countArt = art => buchungen.filter(b => buchungsart(b.kurs) === art).length;

    return (
        <div className="gebuehren-page">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>Gebühren</h1>
                    <p>Kursgebühren verwalten und die Übertragung ins Schulverwaltungsprogramm dokumentieren</p>
                </div>
            </header>

            <section className="gebuehren-section gebuehren-controls">
                <div className="gebuehren-filter-field">
                    <label htmlFor="gebuehren-schuljahr">Schuljahr</label>
                    <select id="gebuehren-schuljahr" value={schuljahr}
                            onChange={e => setSchuljahr(e.target.value)}>
                        {SCHULJAHRE.map(jahr => <option key={jahr} value={jahr}>{jahr}</option>)}
                    </select>
                </div>
                <div className="gebuehren-filter-field">
                    <label htmlFor="gebuehren-halbjahr">Halbjahr</label>
                    <select id="gebuehren-halbjahr" value={halbjahr}
                            onChange={e => setHalbjahr(Number(e.target.value))}>
                        <option value={1}>1. Halbjahr</option>
                        <option value={2}>2. Halbjahr</option>
                    </select>
                </div>
                <div className="gebuehren-tabs" role="group" aria-label="Gebührenansicht">
                    <button type="button" className={ansicht !== 'tarife' ? 'active' : ''}
                            onClick={zurUebersicht}>Gebührenübersicht</button>
                    <button type="button" className={ansicht === 'tarife' ? 'active' : ''}
                            onClick={() => { setAnsicht('tarife'); setError(''); setMessage(''); }}>
                        Gebührentabelle
                    </button>
                </div>
            </section>

            {error && <div className="gebuehren-alert gebuehren-alert-error" role="alert">{error}</div>}
            {message && <div className="gebuehren-alert gebuehren-alert-success" role="status">{message}</div>}

            {ansicht === 'uebersicht' && (
                <section className="gebuehren-section">
                    <div className="gebuehren-section-header">
                        <div>
                            <h2>Gebührenübersicht</h2>
                            <p>Alle Schüler und ihre Gebühren im ausgewählten Zeitraum.</p>
                        </div>
                        <span className="gebuehren-count">{gefiltert.length} Schüler</span>
                    </div>
                    <div className="gebuehren-toolbar">
                        <input type="search" aria-label="Schüler suchen" placeholder="Schüler suchen ..."
                               value={suche} onChange={e => setSuche(e.target.value)} />
                        <button type="button" className="gebuehren-primary-button"
                                disabled={loading || exporting || gefiltert.length === 0}
                                onClick={exportiereExcel}>
                            {exporting ? 'Export läuft ...' : 'Excel exportieren'}
                        </button>
                    </div>
                    {loading ? <div className="gebuehren-empty">Gebühren werden geladen ...</div> : (
                        <div className="gebuehren-table-scroll">
                            <table className="gebuehren-table">
                                <thead><tr>
                                    <th>Nachname</th><th>Vorname</th><th>Kursbuchungen</th>
                                    <th>Musikbuchungen</th><th>Kursgebühren</th><th>Musikgebühren</th>
                                    <th>Gesamtgebühren</th><th>Details</th>
                                </tr></thead>
                                <tbody>
                                    {gefiltert.map(s => (
                                        <tr key={s.studentId}>
                                            <td>{s.nachname || '–'}</td>
                                            <td>{s.vorname || '–'}</td>
                                            <td>{s.kursbuchungen ?? 0}</td>
                                            <td>{s.musikbuchungen ?? 0}</td>
                                            <td>{geld(s.kursgebuehren)}</td>
                                            <td>{geld(s.musikgebuehren)}</td>
                                            <td className="gebuehren-money-strong">{geld(s.gesamtgebuehren)}</td>
                                            <td><button type="button" className="gebuehren-secondary-button"
                                                        onClick={() => oeffneDetails(s.studentId)}>Details</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {gefiltert.length === 0 && <div className="gebuehren-empty">Keine Schüler gefunden.</div>}
                        </div>
                    )}
                </section>
            )}

            {ansicht === 'tarife' && (
                <section className="gebuehren-section">
                    <div className="gebuehren-section-header">
                        <div>
                            <h2>Gebührentabelle – {schuljahr}</h2>
                            <p>Die Kursgebühr richtet sich nach dem gesamten Buchungsfaktor. OGSH zählt als 0,5.</p>
                        </div>
                    </div>
                    {loading ? <div className="gebuehren-empty">Gebührentabelle wird geladen ...</div> : (
                        <div className="gebuehren-table-scroll">
                            <table className="gebuehren-table gebuehren-tarif-table">
                                <thead><tr><th>Buchungsfaktor</th><th>Gebühr / Halbjahr</th><th>Aktion</th></tr></thead>
                                <tbody>
                                    {tarife.map(t => (
                                        <tr key={t.id}>
                                            <td>{faktorText(t.buchungsfaktor)}</td>
                                            <td>
                                                <div className="gebuehren-money-input">
                                                    <input type="text" inputMode="decimal"
                                                           aria-label={`Gebühr für Faktor ${faktorText(t.buchungsfaktor)}`}
                                                           value={tarifEntwuerfe[t.id] ?? ''}
                                                           onChange={e => setTarifEntwuerfe(alt => ({ ...alt, [t.id]: e.target.value }))} />
                                                    <span>€</span>
                                                </div>
                                            </td>
                                            <td><button type="button" className="gebuehren-secondary-button"
                                                        disabled={saving} onClick={() => speichereTarif(t)}>Speichern</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="gebuehren-hint">Änderungen gelten für das ausgewählte Schuljahr und aktualisieren die berechneten Gebühren.</p>
                </section>
            )}

            {ansicht === 'details' && (
                <section className="gebuehren-section">
                    <div className="gebuehren-section-header">
                        <div>
                            <button type="button" className="gebuehren-back-button" onClick={zurUebersicht}>
                                ← Zur Gebührenübersicht
                            </button>
                            <h2>Schülerdetails</h2>
                            {details && <p>{details.nachname}, {details.vorname}</p>}
                        </div>
                        {details && <span className="gebuehren-count">{buchungen.length} Buchungen</span>}
                    </div>
                    {detailsLoading ? <div className="gebuehren-empty">Schülerdetails werden geladen ...</div> : details && (
                        <>
                            <div className="gebuehren-detail-top">
                                <div className="gebuehren-status-box">
                                    <div><span>Status</span>
                                        <strong className={erfassung?.erfasst ? 'gebuehren-status-ok' : 'gebuehren-status-open'}>
                                            {erfassung?.erfasst ? 'Erfasst' : 'Nicht erfasst'}
                                        </strong>
                                    </div>
                                    <button type="button" className="gebuehren-secondary-button"
                                            disabled={saving || !erfassung} onClick={toggleErfasst}>
                                        {erfassung?.erfasst ? 'Rückgängig' : 'Als erfasst markieren'}
                                    </button>
                                </div>
                                <div className="gebuehren-correction-box">
                                    <label htmlFor="gebuehren-korrektur">Gebührenkorrektur (+ / −)</label>
                                    <div className="gebuehren-correction-row">
                                        <div className="gebuehren-money-input">
                                            <input id="gebuehren-korrektur" type="text" inputMode="decimal"
                                                   value={korrekturEntwurf}
                                                   onChange={e => setKorrekturEntwurf(e.target.value)} />
                                            <span>€</span>
                                        </div>
                                        <button type="button" className="gebuehren-primary-button"
                                                disabled={saving || !erfassung} onClick={speichereKorrektur}>
                                            Speichern
                                        </button>
                                    </div>
                                    <small>Negativer Betrag reduziert die Gebühren, positiver Betrag erhöht sie.</small>
                                </div>
                            </div>

                            <div className="gebuehren-table-scroll">
                                <table className="gebuehren-table">
                                    <thead><tr>
                                        <th>Kurs</th><th>Wochentag</th><th>Uhrzeit</th>
                                        <th>Buchungsart</th><th>Berechnung</th><th>Faktor</th><th>Musikgebühr</th>
                                    </tr></thead>
                                    <tbody>
                                        {buchungen.map(b => (
                                            <tr key={b.id}>
                                                <td>{b.kurs?.name || '–'}</td>
                                                <td>{b.kurs?.wochentag || '–'}</td>
                                                <td>{b.kurs?.uhrzeit || '–'}</td>
                                                <td>{b.kurs?.buchungsart || '–'}</td>
                                                <td>{berechnungText(b.kurs)}</td>
                                                <td>{faktorText(kursFaktor(b.kurs))}</td>
                                                <td>{geld(buchungsart(b.kurs) === 'M' ? b.kurs?.kursgebuehr : 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {buchungen.length === 0 && <div className="gebuehren-empty">Keine Kurse gebucht.</div>}
                            </div>

                            <div className="gebuehren-summary">
                                <div className="gebuehren-summary-card"><span>OGS-Kurse</span><strong>{countArt('OGS')}</strong></div>
                                <div className="gebuehren-summary-card"><span>OGSH-Kurse</span><strong>{countArt('OGSH')}</strong></div>
                                <div className="gebuehren-summary-card"><span>Musikkurse</span><strong>{details.musikbuchungen}</strong></div>
                                <div className="gebuehren-summary-card"><span>OGS-Faktor</span><strong>{faktorText(details.buchungsfaktor)}</strong></div>
                                <div className="gebuehren-summary-card"><span>Kursgebühren</span><strong>{geld(details.kursgebuehren)}</strong></div>
                                <div className="gebuehren-summary-card"><span>Musikgebühren</span><strong>{geld(details.musikgebuehren)}</strong></div>
                                <div className="gebuehren-summary-card"><span>Gebührenkorrektur</span><strong>{geld(details.gebuehrenkorrektur)}</strong></div>
                                <div className="gebuehren-summary-card gebuehren-summary-total">
                                    <span>Gesamtgebühren</span><strong>{geld(details.gesamtgebuehren)}</strong>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}

export default GebuehrenPage;
