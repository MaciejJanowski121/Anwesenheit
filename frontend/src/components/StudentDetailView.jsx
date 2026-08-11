import React, { useMemo, useState } from 'react';
import './StudentDetailView.css';

const WOCHENTAGE = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag'
];

function StudentDetailView({
                               student,
                               buchungen,
                               kurse,
                               anwesenheiten,
                               onAssignKurs,
                               onDeleteBuchung,
                               onUpdateGehtUm1530,
                               onClose
                           }) {

    /* =====================================================
       KURSZUWEISUNG
       ===================================================== */

    const [selectedWochentag, setSelectedWochentag] =
        useState('');

    const [selectedKursId, setSelectedKursId] =
        useState('');

    /* =====================================================
       15:30
       ===================================================== */

    const [gehtUm1530, setGehtUm1530] = useState(
        student.gehtUm1530 ?? false
    );

    const [saving1530, setSaving1530] =
        useState(false);

    /* =====================================================
       ANWESENHEIT FILTER
       ===================================================== */

    const [
        anwesenheitDatumFilter,
        setAnwesenheitDatumFilter
    ] = useState('');

    const [
        anwesenheitKursFilter,
        setAnwesenheitKursFilter
    ] = useState('');

    const [
        anwesenheitStatusFilter,
        setAnwesenheitStatusFilter
    ] = useState('');

    /* =====================================================
       KURSE NACH WOCHENTAG FILTERN
       ===================================================== */

    const filteredKurse = useMemo(() => {
        if (!selectedWochentag) {
            return [];
        }

        return kurse.filter(
            (kurs) =>
                kurs.wochentag === selectedWochentag
        );
    }, [kurse, selectedWochentag]);

    /* =====================================================
       KURSE AUS ANWESENHEITEN
       ===================================================== */

    const anwesenheitKurse = useMemo(() => {
        const kursMap = new Map();

        (anwesenheiten || []).forEach(
            (anwesenheit) => {
                const kurs = anwesenheit.kurs;

                if (kurs?.id) {
                    kursMap.set(
                        String(kurs.id),
                        kurs
                    );
                }
            }
        );

        return [...kursMap.values()].sort(
            (a, b) =>
                String(a.name ?? '')
                    .localeCompare(
                        String(b.name ?? ''),
                        'de'
                    )
        );
    }, [anwesenheiten]);

    /* =====================================================
       VERFÜGBARE STATUS
       ===================================================== */

    /*
     * Die Statuswerte werden direkt aus den vorhandenen
     * Anwesenheitsdaten erzeugt.
     *
     * Dadurch funktioniert der Filter unabhängig davon,
     * ob der Backend-Status z.B. "ANWESEND",
     * "Anwesend", "FEHLT" usw. lautet.
     */
    const anwesenheitStatus = useMemo(() => {
        return [
            ...new Set(
                (anwesenheiten || [])
                    .map(
                        (anwesenheit) =>
                            anwesenheit.status
                    )
                    .filter(Boolean)
            )
        ].sort((a, b) =>
            String(a).localeCompare(
                String(b),
                'de'
            )
        );
    }, [anwesenheiten]);

    /* =====================================================
       ANWESENHEITEN FILTERN UND SORTIEREN
       ===================================================== */

    const filteredAnwesenheiten = useMemo(() => {
        return [...(anwesenheiten || [])]
            .filter((anwesenheit) => {

                const matchesDatum =
                    !anwesenheitDatumFilter ||
                    String(
                        anwesenheit.datum ?? ''
                    ) === anwesenheitDatumFilter;

                const matchesKurs =
                    !anwesenheitKursFilter ||
                    String(
                        anwesenheit.kurs?.id ?? ''
                    ) ===
                    String(anwesenheitKursFilter);

                const matchesStatus =
                    !anwesenheitStatusFilter ||
                    String(
                        anwesenheit.status ?? ''
                    ) ===
                    anwesenheitStatusFilter;

                return (
                    matchesDatum &&
                    matchesKurs &&
                    matchesStatus
                );
            })
            .sort((a, b) =>
                String(b.datum ?? '')
                    .localeCompare(
                        String(a.datum ?? '')
                    )
            );
    }, [
        anwesenheiten,
        anwesenheitDatumFilter,
        anwesenheitKursFilter,
        anwesenheitStatusFilter
    ]);

    const hasAnwesenheitFilter =
        Boolean(
            anwesenheitDatumFilter ||
            anwesenheitKursFilter ||
            anwesenheitStatusFilter
        );

    /* =====================================================
       KURSZUWEISUNG HANDLER
       ===================================================== */

    const handleWochentagChange = (event) => {
        setSelectedWochentag(
            event.target.value
        );

        setSelectedKursId('');
    };

    const handleKursChange = (event) => {
        setSelectedKursId(
            event.target.value
        );
    };

    const handleAssign = async () => {
        if (!selectedKursId) {
            return;
        }

        await onAssignKurs(
            selectedKursId
        );

        setSelectedKursId('');
    };

    /* =====================================================
       15:30 HANDLER
       ===================================================== */

    const handle1530Change = async (
        newValue
    ) => {

        if (newValue === gehtUm1530) {
            return;
        }

        try {
            setSaving1530(true);

            /*
             * Zuerst im Backend speichern.
             */
            await onUpdateGehtUm1530(
                newValue
            );

            /*
             * Lokalen Zustand erst nach
             * erfolgreichem Speichern ändern.
             */
            setGehtUm1530(
                newValue
            );

        } catch (error) {
            console.error(
                '15:30-Einstellung konnte nicht gespeichert werden:',
                error
            );
        } finally {
            setSaving1530(false);
        }
    };

    /* =====================================================
       ANWESENHEIT FILTER ZURÜCKSETZEN
       ===================================================== */

    const resetAnwesenheitFilter = () => {
        setAnwesenheitDatumFilter('');
        setAnwesenheitKursFilter('');
        setAnwesenheitStatusFilter('');
    };

    return (
        <div className="student-detail-view">

            {/* =================================================
                ZURÜCK
               ================================================= */}

            <button
                type="button"
                className="back-button"
                onClick={onClose}
            >
                Zurück zur Übersicht
            </button>

            {/* =================================================
                HEADER
               ================================================= */}

            <div className="detail-header">
                <h2>
                    {student.nachname},{' '}
                    {student.vorname}
                </h2>

                <p>Schülerdetails</p>
            </div>

            {/* =================================================
                ALLGEMEINE INFORMATIONEN
               ================================================= */}

            <section className="detail-section">

                <h3>
                    Allgemeine Informationen
                </h3>

                <div className="detail-grid">

                    <div className="detail-item">
                        <span className="detail-label">
                            Vorname
                        </span>

                        <span className="detail-value">
                            {student.vorname || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Nachname
                        </span>

                        <span className="detail-value">
                            {student.nachname || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Jahrgang
                        </span>

                        <span className="detail-value">
                            {student.jahrgang ?? '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Klasse
                        </span>

                        <span className="detail-value">
                            {student.klasse || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Foto- und Bildfreigabe
                        </span>

                        <span className="detail-value">
                            {student.fotoFreigabe || '–'}
                        </span>
                    </div>

                    {/* =============================================
                        15:30
                       ============================================= */}

                    <div
                        className="
                            detail-item
                            detail-item-1530
                        "
                    >
                        <div className="detail-1530-header">

                            <span className="detail-label">
                                Geht um 15:30 Uhr
                            </span>

                            <div className="detail-1530-options">

                                <button
                                    type="button"
                                    className={
                                        gehtUm1530
                                            ? 'detail-1530-option active'
                                            : 'detail-1530-option'
                                    }
                                    disabled={
                                        saving1530
                                    }
                                    onClick={() =>
                                        handle1530Change(
                                            true
                                        )
                                    }
                                >
                                    Ja
                                </button>

                                <button
                                    type="button"
                                    className={
                                        !gehtUm1530
                                            ? 'detail-1530-option active'
                                            : 'detail-1530-option'
                                    }
                                    disabled={
                                        saving1530
                                    }
                                    onClick={() =>
                                        handle1530Change(
                                            false
                                        )
                                    }
                                >
                                    Nein
                                </button>

                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* =================================================
                KONTAKT 1
               ================================================= */}

            <section className="detail-section">

                <h3>Kontakt 1</h3>

                <div className="detail-grid">

                    <div className="detail-item">
                        <span className="detail-label">
                            Email 1
                        </span>

                        <span className="detail-value">
                            {student.email1 || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Telefon 1
                        </span>

                        <span className="detail-value">
                            {student.telefon1 || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Mobil 1
                        </span>

                        <span className="detail-value">
                            {student.mobil1 || '–'}
                        </span>
                    </div>

                </div>
            </section>

            {/* =================================================
                KONTAKT 2
               ================================================= */}

            <section className="detail-section">

                <h3>Kontakt 2</h3>

                <div className="detail-grid">

                    <div className="detail-item">
                        <span className="detail-label">
                            Email 2
                        </span>

                        <span className="detail-value">
                            {student.email2 || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Telefon 2
                        </span>

                        <span className="detail-value">
                            {student.telefon2 || '–'}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">
                            Mobil 2
                        </span>

                        <span className="detail-value">
                            {student.mobil2 || '–'}
                        </span>
                    </div>

                </div>
            </section>

            {/* =================================================
                KURSBUCHUNGEN
               ================================================= */}

            <section className="detail-section">

                <h3>Kursbuchungen</h3>

                <div className="assign-kurs-box">

                    {/* Wochentag */}

                    <div className="assign-kurs-field">

                        <label htmlFor="kurs-wochentag">
                            Wochentag
                        </label>

                        <select
                            id="kurs-wochentag"
                            value={
                                selectedWochentag
                            }
                            onChange={
                                handleWochentagChange
                            }
                        >
                            <option value="">
                                Wochentag auswählen...
                            </option>

                            {WOCHENTAGE.map(
                                (tag) => (
                                    <option
                                        key={tag}
                                        value={tag}
                                    >
                                        {tag}
                                    </option>
                                )
                            )}

                        </select>
                    </div>

                    {/* Kurs */}

                    <div className="assign-kurs-field">

                        <label htmlFor="kurs-auswahl">
                            Kurs
                        </label>

                        <select
                            id="kurs-auswahl"
                            value={
                                selectedKursId
                            }
                            onChange={
                                handleKursChange
                            }
                            disabled={
                                !selectedWochentag
                            }
                        >

                            <option value="">
                                {!selectedWochentag
                                    ? 'Zuerst Wochentag auswählen...'
                                    : 'Kurs auswählen...'}
                            </option>

                            {filteredKurse.map(
                                (kurs) => (
                                    <option
                                        key={kurs.id}
                                        value={kurs.id}
                                    >
                                        {kurs.name}

                                        {kurs.uhrzeit
                                            ? ` | ${kurs.uhrzeit}`
                                            : ''}
                                    </option>
                                )
                            )}

                        </select>
                    </div>

                    <button
                        type="button"
                        className="assign-kurs-button"
                        onClick={
                            handleAssign
                        }
                        disabled={
                            !selectedKursId
                        }
                    >
                        Kurs hinzufügen
                    </button>

                </div>

                {selectedWochentag &&
                    filteredKurse.length === 0 && (
                        <p className="empty-text">
                            Für{' '}
                            {selectedWochentag}{' '}
                            sind keine Kurse
                            vorhanden.
                        </p>
                    )}

                {buchungen &&
                buchungen.length > 0 ? (

                    <div className="detail-table-scroll">

                        <table className="detail-table">

                            <thead>
                            <tr>
                                <th>Kurs</th>
                                <th>Kursleitung</th>
                                <th>Wochentag</th>
                                <th>Uhrzeit</th>
                                <th>Buchungsart</th>
                                <th>Gebühr</th>
                                <th>Aktionen</th>
                            </tr>
                            </thead>

                            <tbody>

                            {buchungen.map(
                                (buchung) => (
                                    <tr
                                        key={
                                            buchung.id
                                        }
                                    >
                                        <td>
                                            {buchung.kurs
                                                    ?.name ||
                                                '–'}
                                        </td>

                                        <td>
                                            {buchung.kurs
                                                    ?.kursleitung ||
                                                '–'}
                                        </td>

                                        <td>
                                            {buchung.kurs
                                                    ?.wochentag ||
                                                '–'}
                                        </td>

                                        <td>
                                            {buchung.kurs
                                                    ?.uhrzeit ||
                                                '–'}
                                        </td>

                                        <td>
                                            {buchung.kurs
                                                    ?.buchungsart ||
                                                '–'}
                                        </td>

                                        <td>
                                            {buchung.kurs
                                                ?.kursgebuehr != null
                                                ? `${buchung.kurs.kursgebuehr} €`
                                                : '–'}
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="btn-remove-kurs"
                                                onClick={() =>
                                                    onDeleteBuchung(
                                                        buchung.id
                                                    )
                                                }
                                            >
                                                Entfernen
                                            </button>
                                        </td>
                                    </tr>
                                )
                            )}

                            </tbody>
                        </table>
                    </div>

                ) : (
                    <p className="empty-text">
                        Noch keine Kursbuchungen
                        vorhanden.
                    </p>
                )}

            </section>

            {/* =================================================
                ANWESENHEIT
               ================================================= */}

            <section className="detail-section">

                <div className="detail-anwesenheit-header">

                    <div>
                        <h3>Anwesenheit</h3>

                        <p>
                            Anwesenheiten nach Datum,
                            Kurs oder Status filtern
                        </p>
                    </div>

                    {hasAnwesenheitFilter && (
                        <button
                            type="button"
                            className="detail-filter-reset"
                            onClick={
                                resetAnwesenheitFilter
                            }
                        >
                            Filter zurücksetzen
                        </button>
                    )}

                </div>

                {/* =============================================
                    FILTER
                   ============================================= */}

                <div className="detail-anwesenheit-filter">

                    {/* Datum */}

                    <div className="detail-filter-field">

                        <label htmlFor="anwesenheit-datum">
                            Datum
                        </label>

                        <input
                            id="anwesenheit-datum"
                            type="date"
                            value={
                                anwesenheitDatumFilter
                            }
                            onChange={(event) =>
                                setAnwesenheitDatumFilter(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    {/* Kurs */}

                    <div className="detail-filter-field">

                        <label htmlFor="anwesenheit-kurs">
                            Kurs
                        </label>

                        <select
                            id="anwesenheit-kurs"
                            value={
                                anwesenheitKursFilter
                            }
                            onChange={(event) =>
                                setAnwesenheitKursFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Alle Kurse
                            </option>

                            {anwesenheitKurse.map(
                                (kurs) => (
                                    <option
                                        key={kurs.id}
                                        value={kurs.id}
                                    >
                                        {kurs.name}
                                    </option>
                                )
                            )}

                        </select>
                    </div>

                    {/* Status */}

                    <div className="detail-filter-field">

                        <label htmlFor="anwesenheit-status">
                            Status
                        </label>

                        <select
                            id="anwesenheit-status"
                            value={
                                anwesenheitStatusFilter
                            }
                            onChange={(event) =>
                                setAnwesenheitStatusFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Alle Status
                            </option>

                            {anwesenheitStatus.map(
                                (status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {status}
                                    </option>
                                )
                            )}

                        </select>
                    </div>

                </div>

                {/* =============================================
                    ERGEBNISANZAHL
                   ============================================= */}

                <div className="detail-anwesenheit-count">

                    <strong>
                        {filteredAnwesenheiten.length}
                    </strong>

                    {' '}

                    {filteredAnwesenheiten.length === 1
                        ? 'Eintrag'
                        : 'Einträge'}

                </div>

                {/* =============================================
                    TABELLE
                   ============================================= */}

                {filteredAnwesenheiten.length > 0 ? (

                    <div className="detail-table-scroll">

                        <table className="detail-table">

                            <thead>
                            <tr>
                                <th>Datum</th>
                                <th>Kurs</th>
                                <th>Status</th>
                                <th>Bemerkung</th>
                            </tr>
                            </thead>

                            <tbody>

                            {filteredAnwesenheiten.map(
                                (anwesenheit) => (

                                    <tr
                                        key={
                                            anwesenheit.id
                                        }
                                    >

                                        <td>
                                            {anwesenheit.datum ||
                                                '–'}
                                        </td>

                                        <td>
                                            {anwesenheit.kurs
                                                    ?.name ||
                                                '–'}
                                        </td>

                                        <td>
                                            {anwesenheit.status ||
                                                '–'}
                                        </td>

                                        <td>
                                            {anwesenheit.bemerkung ||
                                                '–'}
                                        </td>

                                    </tr>
                                )
                            )}

                            </tbody>
                        </table>

                    </div>

                ) : (

                    <p className="empty-text">

                        {anwesenheiten?.length > 0
                            ? 'Keine Anwesenheiten für die aktuelle Filterauswahl gefunden.'
                            : 'Noch keine Anwesenheitsdaten vorhanden.'}

                    </p>

                )}

            </section>

        </div>
    );
}

export default StudentDetailView;