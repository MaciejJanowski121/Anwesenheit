import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

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
                               buchungen = [],
                               kurse = [],
                               anwesenheiten = [],

                               // Angebote
                               angebote = [],
                               angebotTeilnahmen = [],

                               // ANA
                               onAssignKurs,
                               onDeleteBuchung,
                               onUpdateBesonderheiten,

                               // Angebote
                               onAssignAngebot,
                               onDeleteAngebotTeilnahme,
                               onUpdateAngebotBesonderheiten,

                               onClose
                           }) {

    /* =====================================================
       ANA – KURS ZUWEISEN
       ===================================================== */

    const [selectedWochentag, setSelectedWochentag] =
        useState('');

    const [selectedKursId, setSelectedKursId] =
        useState('');


    /* =====================================================
       ANGEBOTE – ANGEBOT ZUWEISEN
       ===================================================== */

    const [
        selectedAngebotWochentag,
        setSelectedAngebotWochentag
    ] = useState('');

    const [
        selectedAngebotId,
        setSelectedAngebotId
    ] = useState('');

    const [
        assigningAngebot,
        setAssigningAngebot
    ] = useState(false);


    /* =====================================================
       ANA – BESONDERHEITEN
       ===================================================== */

    const [
        besonderheitenValues,
        setBesonderheitenValues
    ] = useState({});

    const [
        savingBesonderheitenId,
        setSavingBesonderheitenId
    ] = useState(null);


    /* =====================================================
       ANGEBOTE – BESONDERHEITEN
       ===================================================== */

    const [
        angebotBesonderheitenValues,
        setAngebotBesonderheitenValues
    ] = useState({});

    const [
        savingAngebotBesonderheitenId,
        setSavingAngebotBesonderheitenId
    ] = useState(null);


    /* =====================================================
       ANA – BESONDERHEITEN SYNCHRONISIEREN
       ===================================================== */

    useEffect(() => {

        const values = {};

        buchungen.forEach((buchung) => {

            values[buchung.id] =
                buchung.besonderheiten ?? '';

        });

        setBesonderheitenValues(values);

    }, [buchungen]);


    /* =====================================================
       ANGEBOTE – BESONDERHEITEN SYNCHRONISIEREN
       ===================================================== */

    useEffect(() => {

        const values = {};

        angebotTeilnahmen.forEach((teilnahme) => {

            values[teilnahme.id] =
                teilnahme.besonderheiten ?? '';

        });

        setAngebotBesonderheitenValues(values);

    }, [angebotTeilnahmen]);


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
       ANA – KURSE NACH WOCHENTAG FILTERN
       ===================================================== */

    const filteredKurse = useMemo(() => {

        if (!selectedWochentag) {
            return [];
        }

        return kurse.filter(
            (kurs) =>
                kurs.wochentag === selectedWochentag
        );

    }, [
        kurse,
        selectedWochentag
    ]);


    /* =====================================================
       ANGEBOTE – NACH WOCHENTAG FILTERN
       ===================================================== */

    const filteredAngebote = useMemo(() => {

        if (!selectedAngebotWochentag) {
            return [];
        }

        const assignedIds = new Set(
            angebotTeilnahmen.map(
                (teilnahme) =>
                    String(teilnahme.angebot?.id)
            )
        );

        return angebote.filter((angebot) =>

            angebot.wochentag === selectedAngebotWochentag &&

            !assignedIds.has(
                String(angebot.id)
            )

        );

    }, [
        angebote,
        angebotTeilnahmen,
        selectedAngebotWochentag
    ]);


    /* =====================================================
       ANWESENHEIT – KURSE ERMITTELN
       ===================================================== */

    const anwesenheitKurse = useMemo(() => {

        const kursMap = new Map();

        anwesenheiten.forEach((anwesenheit) => {

            const kurs = anwesenheit.kurs;

            if (kurs?.id) {

                kursMap.set(
                    String(kurs.id),
                    kurs
                );
            }
        });

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
       ANWESENHEIT – STATUS ERMITTELN
       ===================================================== */

    const anwesenheitStatus = useMemo(() => {

        return [
            ...new Set(
                anwesenheiten
                    .map(
                        (anwesenheit) =>
                            anwesenheit.status
                    )
                    .filter(Boolean)
            )
        ].sort(
            (a, b) =>
                String(a)
                    .localeCompare(
                        String(b),
                        'de'
                    )
        );

    }, [anwesenheiten]);


    /* =====================================================
       ANWESENHEITEN FILTERN UND SORTIEREN
       ===================================================== */

    const filteredAnwesenheiten = useMemo(() => {

        return [...anwesenheiten]

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
                    ) === String(
                        anwesenheitKursFilter
                    );

                const matchesStatus =
                    !anwesenheitStatusFilter ||
                    String(
                        anwesenheit.status ?? ''
                    ) === anwesenheitStatusFilter;

                return (
                    matchesDatum &&
                    matchesKurs &&
                    matchesStatus
                );
            })

            .sort(
                (a, b) =>
                    String(
                        b.datum ?? ''
                    ).localeCompare(
                        String(
                            a.datum ?? ''
                        )
                    )
            );

    }, [
        anwesenheiten,
        anwesenheitDatumFilter,
        anwesenheitKursFilter,
        anwesenheitStatusFilter
    ]);


    const hasAnwesenheitFilter = Boolean(
        anwesenheitDatumFilter ||
        anwesenheitKursFilter ||
        anwesenheitStatusFilter
    );


    /* =====================================================
       ANA – WOCHENTAG ÄNDERN
       ===================================================== */

    const handleWochentagChange = (event) => {

        setSelectedWochentag(
            event.target.value
        );

        setSelectedKursId('');
    };


    /* =====================================================
       ANA – KURS AUSWÄHLEN
       ===================================================== */

    const handleKursChange = (event) => {

        setSelectedKursId(
            event.target.value
        );
    };


    /* =====================================================
       ANA – KURS HINZUFÜGEN
       ===================================================== */

    const handleAssign = async () => {

        if (!selectedKursId) {
            return;
        }

        try {

            await onAssignKurs(
                selectedKursId
            );

            setSelectedKursId('');

        } catch (error) {

            console.error(
                'Kurs konnte nicht hinzugefügt werden:',
                error
            );
        }
    };


    /* =====================================================
       ANGEBOTE – WOCHENTAG ÄNDERN
       ===================================================== */

    const handleAngebotWochentagChange = (event) => {

        setSelectedAngebotWochentag(
            event.target.value
        );

        setSelectedAngebotId('');
    };


    /* =====================================================
       ANGEBOTE – ANGEBOT AUSWÄHLEN
       ===================================================== */

    const handleAngebotChange = (event) => {

        setSelectedAngebotId(
            event.target.value
        );
    };


    /* =====================================================
       ANGEBOTE – ANGEBOT HINZUFÜGEN
       ===================================================== */

    const handleAssignAngebot = async () => {

        if (
            !selectedAngebotId ||
            assigningAngebot
        ) {
            return;
        }

        try {

            setAssigningAngebot(true);

            await onAssignAngebot(
                selectedAngebotId
            );

            setSelectedAngebotId('');

        } catch (error) {

            console.error(
                'Angebot konnte nicht hinzugefügt werden:',
                error
            );

        } finally {

            setAssigningAngebot(false);
        }
    };


    /* =====================================================
       ANA – BESONDERHEITEN ÄNDERN
       ===================================================== */

    const handleBesonderheitenChange = (
        buchungId,
        value
    ) => {

        const limitedValue =
            value.slice(0, 50);

        setBesonderheitenValues(
            (previous) => ({
                ...previous,
                [buchungId]: limitedValue
            })
        );
    };


    /* =====================================================
       ANA – BESONDERHEITEN SPEICHERN
       ===================================================== */

    const handleBesonderheitenSave = async (
        buchungId
    ) => {

        try {

            setSavingBesonderheitenId(
                buchungId
            );

            await onUpdateBesonderheiten(
                buchungId,
                besonderheitenValues[buchungId] ?? ''
            );

        } catch (error) {

            console.error(
                'Besonderheiten konnten nicht gespeichert werden:',
                error
            );

        } finally {

            setSavingBesonderheitenId(null);
        }
    };


    /* =====================================================
       ANGEBOTE – BESONDERHEITEN ÄNDERN
       ===================================================== */

    const handleAngebotBesonderheitenChange = (
        teilnahmeId,
        value
    ) => {

        setAngebotBesonderheitenValues(
            (previous) => ({
                ...previous,
                [teilnahmeId]: value.slice(0, 50)
            })
        );
    };


    /* =====================================================
       ANGEBOTE – BESONDERHEITEN SPEICHERN
       ===================================================== */

    const handleAngebotBesonderheitenSave = async (
        teilnahmeId
    ) => {

        try {

            setSavingAngebotBesonderheitenId(
                teilnahmeId
            );

            await onUpdateAngebotBesonderheiten(
                teilnahmeId,
                angebotBesonderheitenValues[teilnahmeId] ?? ''
            );

        } catch (error) {

            console.error(
                'Angebot-Besonderheiten konnten nicht gespeichert werden:',
                error
            );

        } finally {

            setSavingAngebotBesonderheitenId(null);
        }
    };


    /* =====================================================
       ANWESENHEITSFILTER ZURÜCKSETZEN
       ===================================================== */

    const resetAnwesenheitFilter = () => {

        setAnwesenheitDatumFilter('');
        setAnwesenheitKursFilter('');
        setAnwesenheitStatusFilter('');
    };


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="student-detail-view">

            {/* =========================================
                ZURÜCK
               ========================================= */}

            <button
                type="button"
                className="back-button"
                onClick={onClose}
            >
                Zurück zur Übersicht
            </button>


            {/* =========================================
                SCHÜLER HEADER
               ========================================= */}

            <div className="detail-header">

                <h2>
                    {student.nachname},{' '}
                    {student.vorname}
                </h2>

                <p>
                    Schülerdetails
                </p>

            </div>


            {/* =========================================
                ALLGEMEINE INFORMATIONEN
               ========================================= */}

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

                </div>

            </section>


            {/* =========================================
                KONTAKT 1
               ========================================= */}

            <section className="detail-section">

                <h3>
                    Kontakt 1
                </h3>

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


            {/* =========================================
                KONTAKT 2
               ========================================= */}

            <section className="detail-section">

                <h3>
                    Kontakt 2
                </h3>

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


            {/* =========================================
                BUCHUNGEN ANGEBOTE
               ========================================= */}

            <section className="detail-section">

                <h3>
                    Buchungen Angebote
                </h3>


                {/* =====================================
                    ANGEBOT ZUWEISEN
                   ===================================== */}

                <div className="assign-kurs-box">

                    <div className="assign-kurs-field">

                        <label htmlFor="angebot-wochentag">
                            Wochentag
                        </label>

                        <select
                            id="angebot-wochentag"
                            value={selectedAngebotWochentag}
                            onChange={handleAngebotWochentagChange}
                        >

                            <option value="">
                                Wochentag auswählen...
                            </option>

                            {WOCHENTAGE.map((tag) => (

                                <option
                                    key={tag}
                                    value={tag}
                                >
                                    {tag}
                                </option>

                            ))}

                        </select>

                    </div>


                    <div className="assign-kurs-field">

                        <label htmlFor="angebot-auswahl">
                            Angebot
                        </label>

                        <select
                            id="angebot-auswahl"
                            value={selectedAngebotId}
                            onChange={handleAngebotChange}
                            disabled={!selectedAngebotWochentag}
                        >

                            <option value="">

                                {!selectedAngebotWochentag
                                    ? 'Zuerst Wochentag auswählen...'
                                    : 'Angebot auswählen...'}

                            </option>

                            {filteredAngebote.map((angebot) => (

                                <option
                                    key={angebot.id}
                                    value={angebot.id}
                                >
                                    {angebot.name}

                                    {angebot.beginn && angebot.ende
                                        ? ` | ${angebot.beginn} - ${angebot.ende}`
                                        : ''}
                                </option>

                            ))}

                        </select>

                    </div>


                    <button
                        type="button"
                        className="assign-kurs-button"
                        onClick={handleAssignAngebot}
                        disabled={
                            !selectedAngebotId ||
                            assigningAngebot
                        }
                    >
                        {assigningAngebot
                            ? 'Wird hinzugefügt...'
                            : 'Angebot hinzufügen'}
                    </button>

                </div>


                {selectedAngebotWochentag &&
                    filteredAngebote.length === 0 && (

                        <p className="empty-text">
                            Für {selectedAngebotWochentag} sind
                            keine weiteren Angebote verfügbar.
                        </p>

                    )}


                {/* =====================================
                    BESTEHENDE ANGEBOTSBUCHUNGEN
                   ===================================== */}

                {angebotTeilnahmen.length > 0 ? (

                    <div className="detail-table-scroll">

                        <table className="detail-table kursbuchungen-table">

                            <thead>

                            <tr>
                                <th>Angebot</th>
                                <th>Angebotsart</th>
                                <th>Angebotsleitung</th>
                                <th>Wochentag</th>
                                <th>Beginn</th>
                                <th>Ende</th>
                                <th>Besonderheiten</th>
                                <th>Aktionen</th>
                            </tr>

                            </thead>


                            <tbody>

                            {angebotTeilnahmen.map((teilnahme) => {

                                const angebot = teilnahme.angebot;

                                return (

                                    <tr key={teilnahme.id}>

                                        <td>
                                            {angebot?.name || '–'}
                                        </td>

                                        <td>
                                            {angebot?.angebotsart || '–'}
                                        </td>

                                        <td>
                                            {angebot?.angebotsleitung || '–'}
                                        </td>

                                        <td>
                                            {angebot?.wochentag || '–'}
                                        </td>

                                        <td>
                                            {angebot?.beginn || '–'}
                                        </td>

                                        <td>
                                            {angebot?.ende || '–'}
                                        </td>


                                        {/* BESONDERHEITEN */}

                                        <td>

                                            <div className="besonderheiten-editor">

                                                <input
                                                    type="text"
                                                    className="besonderheiten-input"
                                                    value={
                                                        angebotBesonderheitenValues[
                                                            teilnahme.id
                                                            ] ?? ''
                                                    }
                                                    maxLength={50}
                                                    placeholder="Hinweis..."
                                                    onChange={(event) =>
                                                        handleAngebotBesonderheitenChange(
                                                            teilnahme.id,
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                                <div className="besonderheiten-footer">

                                                    <span className="besonderheiten-counter">
                                                        {(
                                                            angebotBesonderheitenValues[
                                                                teilnahme.id
                                                                ] ?? ''
                                                        ).length} / 50
                                                    </span>

                                                    <button
                                                        type="button"
                                                        className="btn-save-besonderheiten"
                                                        disabled={
                                                            savingAngebotBesonderheitenId ===
                                                            teilnahme.id
                                                        }
                                                        onClick={() =>
                                                            handleAngebotBesonderheitenSave(
                                                                teilnahme.id
                                                            )
                                                        }
                                                    >
                                                        {savingAngebotBesonderheitenId === teilnahme.id
                                                            ? 'Speichert...'
                                                            : 'Speichern'}
                                                    </button>

                                                </div>

                                            </div>

                                        </td>


                                        {/* ANGEBOT ENTFERNEN */}

                                        <td>

                                            <button
                                                type="button"
                                                className="btn-remove-kurs"
                                                onClick={() =>
                                                    onDeleteAngebotTeilnahme(
                                                        teilnahme.id
                                                    )
                                                }
                                            >
                                                Entfernen
                                            </button>

                                        </td>

                                    </tr>

                                );

                            })}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <p className="empty-text">
                        Noch keine Angebotsbuchungen vorhanden.
                    </p>

                )}

            </section>


            {/* =========================================
                BUCHUNGEN ANA
               ========================================= */}

            <section className="detail-section">

                <h3>
                    Buchungen ANA
                </h3>


                {/* =====================================
                    KURS ZUWEISEN
                   ===================================== */}

                <div className="assign-kurs-box">

                    <div className="assign-kurs-field">

                        <label htmlFor="kurs-wochentag">
                            Wochentag
                        </label>

                        <select
                            id="kurs-wochentag"
                            value={selectedWochentag}
                            onChange={handleWochentagChange}
                        >

                            <option value="">
                                Wochentag auswählen...
                            </option>

                            {WOCHENTAGE.map((tag) => (

                                <option
                                    key={tag}
                                    value={tag}
                                >
                                    {tag}
                                </option>

                            ))}

                        </select>

                    </div>


                    <div className="assign-kurs-field">

                        <label htmlFor="kurs-auswahl">
                            Kurs
                        </label>

                        <select
                            id="kurs-auswahl"
                            value={selectedKursId}
                            onChange={handleKursChange}
                            disabled={!selectedWochentag}
                        >

                            <option value="">

                                {!selectedWochentag
                                    ? 'Zuerst Wochentag auswählen...'
                                    : 'Kurs auswählen...'}

                            </option>

                            {filteredKurse.map((kurs) => (

                                <option
                                    key={kurs.id}
                                    value={kurs.id}
                                >
                                    {kurs.name}

                                    {kurs.uhrzeit
                                        ? ` | ${kurs.uhrzeit}`
                                        : ''}
                                </option>

                            ))}

                        </select>

                    </div>


                    <button
                        type="button"
                        className="assign-kurs-button"
                        onClick={handleAssign}
                        disabled={!selectedKursId}
                    >
                        Kurs hinzufügen
                    </button>

                </div>


                {selectedWochentag &&
                    filteredKurse.length === 0 && (

                        <p className="empty-text">
                            Für {selectedWochentag} sind
                            keine Kurse vorhanden.
                        </p>

                    )}


                {/* =====================================
                    BESTEHENDE ANA-BUCHUNGEN
                   ===================================== */}

                {buchungen.length > 0 ? (

                    <div className="detail-table-scroll">

                        <table className="detail-table kursbuchungen-table">

                            <thead>

                            <tr>
                                <th>Kurs</th>
                                <th>Kursleitung</th>
                                <th>Wochentag</th>
                                <th>Uhrzeit</th>
                                <th>Buchungsart</th>
                                <th>Gebühr</th>
                                <th>Besonderheiten</th>
                                <th>Aktionen</th>
                            </tr>

                            </thead>


                            <tbody>

                            {buchungen.map((buchung) => (

                                <tr key={buchung.id}>

                                    <td>
                                        {buchung.kurs?.name || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.kursleitung || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.wochentag || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.uhrzeit || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.buchungsart || '–'}
                                    </td>

                                    <td>
                                        {buchung.kurs?.kursgebuehr != null
                                            ? `${buchung.kurs.kursgebuehr} €`
                                            : '–'}
                                    </td>


                                    {/* BESONDERHEITEN */}

                                    <td>

                                        <div className="besonderheiten-editor">

                                            <input
                                                type="text"
                                                className="besonderheiten-input"
                                                value={
                                                    besonderheitenValues[
                                                        buchung.id
                                                        ] ?? ''
                                                }
                                                maxLength={50}
                                                placeholder="Hinweis..."
                                                onChange={(event) =>
                                                    handleBesonderheitenChange(
                                                        buchung.id,
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <div className="besonderheiten-footer">

                                                <span className="besonderheiten-counter">
                                                    {(
                                                        besonderheitenValues[
                                                            buchung.id
                                                            ] ?? ''
                                                    ).length} / 50
                                                </span>

                                                <button
                                                    type="button"
                                                    className="btn-save-besonderheiten"
                                                    disabled={
                                                        savingBesonderheitenId ===
                                                        buchung.id
                                                    }
                                                    onClick={() =>
                                                        handleBesonderheitenSave(
                                                            buchung.id
                                                        )
                                                    }
                                                >
                                                    {savingBesonderheitenId === buchung.id
                                                        ? 'Speichert...'
                                                        : 'Speichern'}
                                                </button>

                                            </div>

                                        </div>

                                    </td>


                                    {/* BUCHUNG ENTFERNEN */}

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

                            ))}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <p className="empty-text">
                        Noch keine Kursbuchungen vorhanden.
                    </p>

                )}

            </section>


            {/* =========================================
                ANWESENHEIT
               ========================================= */}

            <section className="detail-section">

                <div className="detail-anwesenheit-header">

                    <div>

                        <h3>
                            Anwesenheit
                        </h3>

                        <p>
                            Anwesenheiten nach Datum,
                            Kurs oder Status filtern
                        </p>

                    </div>


                    {hasAnwesenheitFilter && (

                        <button
                            type="button"
                            className="detail-filter-reset"
                            onClick={resetAnwesenheitFilter}
                        >
                            Filter zurücksetzen
                        </button>

                    )}

                </div>


                {/* =====================================
                    ANWESENHEITSFILTER
                   ===================================== */}

                <div className="detail-anwesenheit-filter">

                    <div className="detail-filter-field">

                        <label htmlFor="anwesenheit-datum">
                            Datum
                        </label>

                        <input
                            id="anwesenheit-datum"
                            type="date"
                            value={anwesenheitDatumFilter}
                            onChange={(event) =>
                                setAnwesenheitDatumFilter(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <div className="detail-filter-field">

                        <label htmlFor="anwesenheit-kurs">
                            Kurs
                        </label>

                        <select
                            id="anwesenheit-kurs"
                            value={anwesenheitKursFilter}
                            onChange={(event) =>
                                setAnwesenheitKursFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                Alle Kurse
                            </option>

                            {anwesenheitKurse.map((kurs) => (

                                <option
                                    key={kurs.id}
                                    value={kurs.id}
                                >
                                    {kurs.name}
                                </option>

                            ))}

                        </select>

                    </div>


                    <div className="detail-filter-field">

                        <label htmlFor="anwesenheit-status">
                            Status
                        </label>

                        <select
                            id="anwesenheit-status"
                            value={anwesenheitStatusFilter}
                            onChange={(event) =>
                                setAnwesenheitStatusFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                Alle Status
                            </option>

                            {anwesenheitStatus.map((status) => (

                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status}
                                </option>

                            ))}

                        </select>

                    </div>

                </div>


                {/* =====================================
                    ANZAHL ANWESENHEITEN
                   ===================================== */}

                <div className="detail-anwesenheit-count">

                    <strong>
                        {filteredAnwesenheiten.length}
                    </strong>

                    {' '}

                    {filteredAnwesenheiten.length === 1
                        ? 'Eintrag'
                        : 'Einträge'}

                </div>


                {/* =====================================
                    ANWESENHEITSTABELLE
                   ===================================== */}

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

                            {filteredAnwesenheiten.map((anwesenheit) => (

                                <tr key={anwesenheit.id}>

                                    <td>
                                        {anwesenheit.datum || '–'}
                                    </td>

                                    <td>
                                        {anwesenheit.kurs?.name || '–'}
                                    </td>

                                    <td>
                                        {anwesenheit.status || '–'}
                                    </td>

                                    <td>
                                        {anwesenheit.bemerkung || '–'}
                                    </td>

                                </tr>

                            ))}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <p className="empty-text">

                        {anwesenheiten.length > 0
                            ? 'Keine Anwesenheiten für die aktuelle Filterauswahl gefunden.'
                            : 'Noch keine Anwesenheitsdaten vorhanden.'}

                    </p>

                )}

            </section>

        </div>
    );
}

export default StudentDetailView;