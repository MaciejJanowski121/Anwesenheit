import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    getSchuelerinfos
} from '../../services/schuelerinfoService';

import {
    getKlassen
} from '../../services/klasseService';

import {
    getAngebote
} from '../../services/angebotService';

import {
    getKurse
} from '../../services/kursService';

import {
    getTeilnahmenByAngebot
} from '../../services/angebotTeilnahmeService';

import {
    getBuchungenByKurs
} from '../../services/buchungService';

import {
    getTagesAnwesenheitenByDatum,
    updateTagesAnwesenheit,
    saveSammelTagesAnwesenheitZeitraum
} from '../../services/tagesAnwesenheitService';

import AnwesenheitFilter from './AnwesenheitFilter';
import AnwesenheitTabelle from './AnwesenheitTabelle';
import AnwesenheitSammelerfassung from './AnwesenheitSammelerfassung';

import {
    getToday,
    getWochentag,
    matchesWochentag,
    getStudentName,
    normalizeAnwesenheit,
    createEmptyAnwesenheit,
    getChangedFields,
    validateAnwesenheit,
    getErrorMessage
} from './AnwesenheitUtils';

/* =====================================================
   HILFSFUNKTIONEN
   ===================================================== */

const asArray = value =>
    Array.isArray(value) ? value : [];

const normalizeId = value =>
    String(value ?? '');

const normalizeText = value =>
    String(value ?? '')
        .trim()
        .toLocaleLowerCase('de');

/* =====================================================
   ANWESENHEIT ERFASSEN
   ===================================================== */

function AnwesenheitErfassung() {

    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [datum, setDatum] = useState(getToday);

    const [students, setStudents] = useState([]);
    const [klassen, setKlassen] = useState([]);
    const [angebote, setAngebote] = useState([]);
    const [kurse, setKurse] = useState([]);

    const [angebotTeilnahmen, setAngebotTeilnahmen] =
        useState([]);

    const [buchungen, setBuchungen] =
        useState([]);

    /* =====================================================
       ANWESENHEITSDATEN
       ===================================================== */

    const [originalAnwesenheiten, setOriginalAnwesenheiten] =
        useState({});

    const [anwesenheiten, setAnwesenheiten] =
        useState({});

    /* =====================================================
       FILTER
       ===================================================== */

    const [filterMode, setFilterMode] =
        useState('klasse');

    const [selectedKlasseId, setSelectedKlasseId] =
        useState('');

    const [selectedAngebotId, setSelectedAngebotId] =
        useState('');

    const [selectedKursId, setSelectedKursId] =
        useState('');

    const [search, setSearch] =
        useState('');

    const [jahrgangFilter, setJahrgangFilter] =
        useState('');

    const [klasseFilter, setKlasseFilter] =
        useState('');

    /* =====================================================
       SORTIERUNG
       ===================================================== */

    const [sortKey, setSortKey] =
        useState('name');

    const [sortDirection, setSortDirection] =
        useState('asc');

    /* =====================================================
       SCHÜLERAUSWAHL
       ===================================================== */

    const [selectedStudentIds, setSelectedStudentIds] =
        useState([]);

    /* =====================================================
       STATUS
       ===================================================== */

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const [message, setMessage] =
        useState('');

    const [loadError, setLoadError] =
        useState(false);

    const [reloadVersion, setReloadVersion] =
        useState(0);

    /* =====================================================
       DATEN LADEN
       ===================================================== */

    useEffect(() => {

        let active = true;

        const loadData = async () => {

            try {

                setLoading(true);
                setLoadError(false);
                setError('');
                setMessage('');
                setSelectedStudentIds([]);

                const [
                    studentData,
                    klassenData,
                    angeboteData,
                    kurseData,
                    anwesenheitData
                ] = await Promise.all([

                    getSchuelerinfos(),
                    getKlassen(),
                    getAngebote(),
                    getKurse(),
                    getTagesAnwesenheitenByDatum(datum)

                ]);

                const alleStudents =
                    asArray(studentData);

                const alleKlassen =
                    asArray(klassenData);

                const alleAngebote =
                    asArray(angeboteData);

                const alleKurse =
                    asArray(kurseData);

                /*
                 * Nur Angebote und ANA des
                 * ausgewählten Wochentages laden.
                 */

                const tagesAngebote =
                    alleAngebote.filter(angebot =>
                        matchesWochentag(
                            angebot.wochentag,
                            datum
                        )
                    );

                const tagesKurse =
                    alleKurse.filter(kurs =>
                        matchesWochentag(
                            kurs.wochentag,
                            datum
                        )
                    );

                /* =========================================
                   ANGEBOTSTEILNAHMEN
                   ========================================= */

                const angebotResults =
                    await Promise.all(

                        tagesAngebote.map(async angebot => {

                            const result =
                                await getTeilnahmenByAngebot(
                                    angebot.id
                                );

                            return asArray(result).map(
                                teilnahme => ({
                                    ...teilnahme,
                                    angebot
                                })
                            );
                        })
                    );

                /* =========================================
                   ANA BUCHUNGEN
                   ========================================= */

                const kursResults =
                    await Promise.all(

                        tagesKurse.map(async kurs => {

                            const result =
                                await getBuchungenByKurs(
                                    kurs.id
                                );

                            return asArray(result).map(
                                buchung => ({
                                    ...buchung,
                                    kurs
                                })
                            );
                        })
                    );

                if (!active) {
                    return;
                }

                setStudents(alleStudents);
                setKlassen(alleKlassen);
                setAngebote(tagesAngebote);
                setKurse(tagesKurse);

                setAngebotTeilnahmen(
                    angebotResults.flat()
                );

                setBuchungen(
                    kursResults.flat()
                );

                /* =========================================
                   ANWESENHEITEN ZUORDNEN
                   ========================================= */

                const attendanceMap = {};

                asArray(anwesenheitData).forEach(
                    eintrag => {

                        const studentId =
                            eintrag.student?.id;

                        if (studentId == null) {
                            return;
                        }

                        attendanceMap[
                            normalizeId(studentId)
                            ] = normalizeAnwesenheit(
                            eintrag
                        );
                    }
                );

                setOriginalAnwesenheiten(
                    attendanceMap
                );

                setAnwesenheiten({
                    ...attendanceMap
                });

                /* =========================================
                   FILTER INITIALISIEREN
                   ========================================= */

                setSelectedKlasseId(previous => {

                    const exists =
                        alleKlassen.some(klasse =>
                            normalizeId(klasse.id) ===
                            normalizeId(previous)
                        );

                    return exists
                        ? previous
                        : normalizeId(
                            alleKlassen[0]?.id
                        );
                });

                setSelectedAngebotId(previous => {

                    const exists =
                        tagesAngebote.some(angebot =>
                            normalizeId(angebot.id) ===
                            normalizeId(previous)
                        );

                    return exists
                        ? previous
                        : normalizeId(
                            tagesAngebote[0]?.id
                        );
                });

                setSelectedKursId(previous => {

                    const exists =
                        tagesKurse.some(kurs =>
                            normalizeId(kurs.id) ===
                            normalizeId(previous)
                        );

                    return exists
                        ? previous
                        : normalizeId(
                            tagesKurse[0]?.id
                        );
                });

            } catch (err) {

                if (!active) {
                    return;
                }

                console.error(
                    'Anwesenheitsdaten konnten nicht geladen werden:',
                    err
                );

                setLoadError(true);

                setError(
                    getErrorMessage(
                        err,
                        'Anwesenheitsdaten konnten nicht geladen werden.'
                    )
                );

            } finally {

                if (active) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            active = false;
        };

    }, [datum, reloadVersion]);

    /* =====================================================
       ANGEBOTE PRO SCHÜLER
       ===================================================== */

    const angeboteByStudent = useMemo(() => {

        const result = {};

        angebotTeilnahmen.forEach(teilnahme => {

            const studentId =
                normalizeId(
                    teilnahme.student?.id
                );

            if (!studentId) {
                return;
            }

            if (!result[studentId]) {
                result[studentId] = [];
            }

            result[studentId].push(
                teilnahme
            );
        });

        return result;

    }, [angebotTeilnahmen]);

    /* =====================================================
       ANA PRO SCHÜLER
       ===================================================== */

    const anaByStudent = useMemo(() => {

        const result = {};

        buchungen.forEach(buchung => {

            const studentId =
                normalizeId(
                    buchung.student?.id
                );

            if (!studentId) {
                return;
            }

            if (!result[studentId]) {
                result[studentId] = [];
            }

            result[studentId].push(
                buchung
            );
        });

        return result;

    }, [buchungen]);

    /* =====================================================
       JAHRGÄNGE
       ===================================================== */

    const jahrgaenge = useMemo(() => {

        return [
            ...new Set(
                students
                    .map(student => student.jahrgang)
                    .filter(value =>
                        value !== null &&
                        value !== undefined
                    )
            )
        ].sort((a, b) =>
            Number(a) - Number(b)
        );

    }, [students]);

    /* =====================================================
       TABELLENZEILEN ERSTELLEN
       ===================================================== */

    const rows = useMemo(() => {

        return students.map(student => {

            const studentId =
                normalizeId(student.id);

            const studentAngebote =
                angeboteByStudent[studentId] || [];

            const studentAna =
                anaByStudent[studentId] || [];

            const gruppen = [
                ...studentAngebote.map(teilnahme => ({
                    id: teilnahme.angebot?.id,
                    name: teilnahme.angebot?.name,
                    typ: 'Angebot',
                    besonderheiten:
                    teilnahme.besonderheiten
                })),

                ...studentAna.map(buchung => ({
                    id: buchung.kurs?.id,
                    name: buchung.kurs?.name,
                    typ: 'ANA',
                    besonderheiten:
                    buchung.besonderheiten
                }))
            ];

            let sichtbareGruppen = gruppen;

            if (filterMode === 'angebote') {

                sichtbareGruppen = gruppen.filter(
                    gruppe =>
                        gruppe.typ === 'Angebot' &&
                        normalizeId(gruppe.id) ===
                        normalizeId(selectedAngebotId)
                );

            } else if (filterMode === 'ana') {

                sichtbareGruppen = gruppen.filter(
                    gruppe =>
                        gruppe.typ === 'ANA' &&
                        normalizeId(gruppe.id) ===
                        normalizeId(selectedKursId)
                );
            }

            return {

                studentId: student.id,

                student,

                name: getStudentName(student),

                jahrgang: student.jahrgang,

                klasse: student.klasse,

                angebote: studentAngebote,

                ana: studentAna,

                gruppen: sichtbareGruppen,

                gruppenText: sichtbareGruppen
                    .map(gruppe =>
                        `${gruppe.typ}: ${gruppe.name}`
                    )
                    .join(' · '),

                besonderheiten: sichtbareGruppen
                    .filter(gruppe =>
                        gruppe.besonderheiten
                    )
                    .map(gruppe =>
                        `${gruppe.name}: ${gruppe.besonderheiten}`
                    )
                    .join(' · '),

                anwesenheit:
                    anwesenheiten[studentId] ||
                    createEmptyAnwesenheit()
            };
        });

    }, [
        students,
        angeboteByStudent,
        anaByStudent,
        anwesenheiten,
        filterMode,
        selectedAngebotId,
        selectedKursId
    ]);

    /* =====================================================
       FILTERN
       ===================================================== */

    const filteredRows = useMemo(() => {

        const selectedKlasse =
            klassen.find(klasse =>
                normalizeId(klasse.id) ===
                normalizeId(selectedKlasseId)
            );

        const term =
            normalizeText(search);

        return rows.filter(row => {

            /* =========================================
               KLASSENFILTER
               ========================================= */

            if (filterMode === 'klasse') {

                if (!selectedKlasse) {
                    return false;
                }

                if (
                    normalizeText(row.klasse) !==
                    normalizeText(selectedKlasse.name)
                ) {
                    return false;
                }
            }

            /* =========================================
               ANGEBOTSFILTER
               ========================================= */

            if (filterMode === 'angebote') {

                if (!selectedAngebotId) {
                    return false;
                }

                const assigned =
                    row.angebote.some(teilnahme =>
                        normalizeId(
                            teilnahme.angebot?.id
                        ) ===
                        normalizeId(selectedAngebotId)
                    );

                if (!assigned) {
                    return false;
                }
            }

            /* =========================================
               ANA FILTER
               ========================================= */

            if (filterMode === 'ana') {

                if (!selectedKursId) {
                    return false;
                }

                const assigned =
                    row.ana.some(buchung =>
                        normalizeId(
                            buchung.kurs?.id
                        ) ===
                        normalizeId(selectedKursId)
                    );

                if (!assigned) {
                    return false;
                }
            }

            /* =========================================
               JAHRGANG
               ========================================= */

            if (
                jahrgangFilter &&
                normalizeId(row.jahrgang) !==
                normalizeId(jahrgangFilter)
            ) {
                return false;
            }

            /* =========================================
               ZUSÄTZLICHER KLASSENFILTER
               ========================================= */

            if (
                filterMode === 'alle' &&
                klasseFilter &&
                normalizeText(row.klasse) !==
                normalizeText(klasseFilter)
            ) {
                return false;
            }

            /* =========================================
               FREITEXTSUCHE
               ========================================= */

            if (!term) {
                return true;
            }

            const suchwerte = [

                row.name,

                row.student.vorname,

                row.student.nachname,

                `${row.student.vorname ?? ''} ${row.student.nachname ?? ''}`,

                row.klasse,

                row.jahrgang,

                ...row.angebote.map(
                    teilnahme =>
                        teilnahme.angebot?.name
                ),

                ...row.ana.map(
                    buchung =>
                        buchung.kurs?.name
                ),

                row.besonderheiten
            ];

            return suchwerte.some(value =>
                normalizeText(value)
                    .includes(term)
            );
        });

    }, [
        rows,
        klassen,
        filterMode,
        selectedKlasseId,
        selectedAngebotId,
        selectedKursId,
        search,
        jahrgangFilter,
        klasseFilter
    ]);

    /* =====================================================
       SORTIEREN
       ===================================================== */

    const sortedRows = useMemo(() => {

        const direction =
            sortDirection === 'asc' ? 1 : -1;

        return [...filteredRows].sort((a, b) => {

            let result = 0;

            const attendanceA = a.anwesenheit;
            const attendanceB = b.anwesenheit;

            switch (sortKey) {

                /* =========================================
                   JAHRGANG
                   ========================================= */

                case 'jahrgang':

                    result =
                        Number(a.jahrgang ?? 0) -
                        Number(b.jahrgang ?? 0);

                    break;

                /* =========================================
                   ANWESEND
                   ========================================= */

                case 'anwesend':

                    result =
                        Number(attendanceA.status === 'ANWESEND') -
                        Number(attendanceB.status === 'ANWESEND');

                    break;

                /* =========================================
                   FEHLT
                   ========================================= */

                case 'fehlt':

                    result =
                        Number(attendanceA.status === 'FEHLT') -
                        Number(attendanceB.status === 'FEHLT');

                    break;

                /* =========================================
                   ABWESENHEITSZEITEN
                   ========================================= */

                case 'abwesendAb':
                case 'abwesendBis': {

                    const timeA =
                        attendanceA[sortKey] || '';

                    const timeB =
                        attendanceB[sortKey] || '';

                    /*
                     * Leere Uhrzeiten bleiben unabhängig
                     * von der Sortierrichtung am Ende.
                     */

                    if (!timeA && timeB) {
                        return 1;
                    }

                    if (timeA && !timeB) {
                        return -1;
                    }

                    result = timeA.localeCompare(timeB);

                    break;
                }

                /* =========================================
                   ANA ANWESENHEITSKONTROLLE
                   ========================================= */

                case 'anaAnwesenheitskontrolle':

                    result =
                        Number(
                            attendanceA.anaAnwesenheitskontrolle === true
                        ) -
                        Number(
                            attendanceB.anaAnwesenheitskontrolle === true
                        );

                    break;

                /* =========================================
                   STANDARD TEXTSORTIERUNG
                   ========================================= */

                default:

                    result = String(
                        a[sortKey] ?? ''
                    ).localeCompare(
                        String(b[sortKey] ?? ''),
                        'de',
                        {
                            numeric: true,
                            sensitivity: 'base'
                        }
                    );

                    break;
            }

            /* =============================================
               BEI GLEICHEN WERTEN NACH NAMEN SORTIEREN
               ============================================= */

            if (result === 0) {

                return a.name.localeCompare(
                    b.name,
                    'de',
                    {
                        sensitivity: 'base'
                    }
                );
            }

            return result * direction;
        });

    }, [
        filteredRows,
        sortKey,
        sortDirection
    ]);

    /* =====================================================
       SORTIERRICHTUNG ÄNDERN
       ===================================================== */

    const handleSort = key => {

        if (sortKey === key) {

            setSortDirection(previous =>
                previous === 'asc'
                    ? 'desc'
                    : 'asc'
            );

        } else {

            setSortKey(key);

            /*
             * Bei Checkbox-Spalten werden zunächst
             * die ausgewählten Schüler angezeigt.
             */

            const checkboxColumns = [
                'anwesend',
                'fehlt',
                'anaAnwesenheitskontrolle'
            ];

            setSortDirection(
                checkboxColumns.includes(key)
                    ? 'desc'
                    : 'asc'
            );
        }
    };

    /* =====================================================
       GEÄNDERTE ANWESENHEITEN
       ===================================================== */

    const changedEntries = useMemo(() => {

        return Object.entries(anwesenheiten)

            .map(([studentId, current]) => ({

                studentId,

                changes: getChangedFields(
                    originalAnwesenheiten[studentId],
                    current
                ),

                current
            }))

            .filter(entry =>
                Object.keys(entry.changes).length > 0
            );

    }, [
        anwesenheiten,
        originalAnwesenheiten
    ]);

    const hasUnsavedChanges =
        changedEntries.length > 0;

    /* =====================================================
       BROWSER WARNUNG
       ===================================================== */

    useEffect(() => {

        if (!hasUnsavedChanges) {
            return;
        }

        const handleBeforeUnload = event => {

            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener(
            'beforeunload',
            handleBeforeUnload
        );

        return () => {

            window.removeEventListener(
                'beforeunload',
                handleBeforeUnload
            );
        };

    }, [hasUnsavedChanges]);

    /* =====================================================
       DATUM ÄNDERN
       ===================================================== */

    const handleDatumChange = value => {

        if (!value || saving || loading) {
            return;
        }

        if (
            hasUnsavedChanges &&
            !window.confirm(
                'Es gibt ungespeicherte Änderungen. Möchten Sie das Datum trotzdem ändern?'
            )
        ) {
            return;
        }

        setDatum(value);
    };

    /* =====================================================
       DATEN NEU LADEN
       ===================================================== */

    const handleReload = () => {

        if (saving || loading) {
            return;
        }

        if (
            hasUnsavedChanges &&
            !window.confirm(
                'Ungespeicherte Änderungen werden verworfen. Fortfahren?'
            )
        ) {
            return;
        }

        setReloadVersion(previous =>
            previous + 1
        );
    };

    /* =====================================================
       FILTERMODUS ÄNDERN
       ===================================================== */

    const handleFilterModeChange = mode => {

        setFilterMode(mode);
        setSearch('');
        setJahrgangFilter('');
        setKlasseFilter('');
        setSelectedStudentIds([]);
    };

    /* =====================================================
       SCHÜLERAUSWAHL BEI FILTERÄNDERUNG
       ===================================================== */

    useEffect(() => {

        setSelectedStudentIds([]);

    }, [
        selectedKlasseId,
        selectedAngebotId,
        selectedKursId,
        search,
        jahrgangFilter,
        klasseFilter
    ]);

    /* =====================================================
       EINZELNEN SCHÜLER AUSWÄHLEN
       ===================================================== */

    const handleSelectStudent = studentId => {

        const id =
            normalizeId(studentId);

        setSelectedStudentIds(previous =>

            previous.includes(id)

                ? previous.filter(value =>
                    value !== id
                )

                : [...previous, id]
        );
    };

    /* =====================================================
       ALLE SICHTBAREN AUSWÄHLEN
       ===================================================== */

    const handleSelectAllVisible = () => {

        const visibleIds =
            sortedRows.map(row =>
                normalizeId(row.studentId)
            );

        const allSelected =
            visibleIds.length > 0 &&
            visibleIds.every(id =>
                selectedStudentIds.includes(id)
            );

        setSelectedStudentIds(

            allSelected
                ? []
                : visibleIds
        );
    };

    /* =====================================================
       ANWESENHEIT ÄNDERN
       ===================================================== */

    const handleAnwesenheitChange = (
        studentId,
        field,
        value
    ) => {

        if (saving || loading || loadError) {
            return;
        }

        const id =
            normalizeId(studentId);

        setAnwesenheiten(previous => {

            const current =
                previous[id] ||
                createEmptyAnwesenheit();

            const next = {
                ...current,
                [field]: value
            };

            /*
             * Bei vollständiger Abwesenheit
             * werden beide Abwesenheitszeiträume entfernt.
             */

            if (
                field === 'status' &&
                value === 'FEHLT'
            ) {

                next.abwesendAb = '';
                next.abwesendBis = '';

                next.abwesendAb2 = '';
                next.abwesendBis2 = '';
            }

            return {
                ...previous,
                [id]: next
            };
        });

        setMessage('');
    };

    /* =====================================================
       STATUS CHECKBOX
       ===================================================== */

    const handleStatusChange = (
        studentId,
        status
    ) => {

        const current =
            anwesenheiten[
                normalizeId(studentId)
                ] || createEmptyAnwesenheit();

        handleAnwesenheitChange(

            studentId,

            'status',

            current.status === status
                ? ''
                : status
        );
    };

    /* =====================================================
       EINZELÄNDERUNGEN SPEICHERN
       ===================================================== */

    const handleSave = async () => {

        if (
            saving ||
            loading ||
            loadError ||
            changedEntries.length === 0
        ) {
            return;
        }

        /* =========================================
           VALIDIERUNG
           ========================================= */

        for (const entry of changedEntries) {

            const validationError =
                validateAnwesenheit(
                    entry.current
                );

            if (validationError) {

                const student =
                    students.find(item =>
                        normalizeId(item.id) ===
                        entry.studentId
                    );

                setError(
                    `${getStudentName(student)}: ${validationError}`
                );

                return;
            }
        }

        try {

            setSaving(true);
            setError('');
            setMessage('');

            let savedCount = 0;

            /*
             * Nur geänderte Felder übertragen.
             */

            for (const entry of changedEntries) {

                const saved =
                    await updateTagesAnwesenheit(

                        entry.studentId,

                        datum,

                        entry.changes
                    );

                const normalized =
                    normalizeAnwesenheit(saved);

                setOriginalAnwesenheiten(previous => ({

                    ...previous,

                    [entry.studentId]: normalized
                }));

                setAnwesenheiten(previous => ({

                    ...previous,

                    [entry.studentId]: normalized
                }));

                savedCount++;
            }

            setMessage(
                `${savedCount} Anwesenheiten wurden gespeichert.`
            );

        } catch (err) {

            console.error(
                'Speichern fehlgeschlagen:',
                err
            );

            setError(
                getErrorMessage(
                    err,
                    'Nicht alle Änderungen konnten gespeichert werden.'
                )
            );

        } finally {

            setSaving(false);
        }
    };

    /* =====================================================
       SAMMELAKTUALISIERUNG EINES ZEITRAUMS
       ===================================================== */

    const handleSammelSave = async (
        aenderungen,
        zeitraum
    ) => {

        /* =====================================================
           AKTUELLEN STATUS PRÜFEN
           ===================================================== */

        if (
            saving ||
            loading ||
            loadError
        ) {

            throw new Error(
                'Die Sammelerfassung ist momentan nicht verfügbar.'
            );
        }

        if (selectedStudentIds.length === 0) {

            throw new Error(
                'Bitte wählen Sie mindestens einen Schüler aus.'
            );
        }

        if (
            !aenderungen ||
            Object.keys(aenderungen).length === 0
        ) {

            throw new Error(
                'Bitte wählen Sie mindestens eine Änderung aus.'
            );
        }

        /* =====================================================
           OFFENE EINZELÄNDERUNGEN PRÜFEN
           ===================================================== */

        if (hasUnsavedChanges) {

            throw new Error(
                'Bitte speichern Sie zuerst die offenen Einzeländerungen.'
            );
        }

        /* =====================================================
           ZEITRAUM VALIDIEREN
           ===================================================== */

        if (
            !zeitraum ||
            !zeitraum.von ||
            !zeitraum.bis
        ) {

            throw new Error(
                'Bitte wählen Sie ein Start- und Enddatum.'
            );
        }

        if (zeitraum.von > zeitraum.bis) {

            throw new Error(
                'Das Von-Datum darf nicht nach dem Bis-Datum liegen.'
            );
        }

        if (
            !Array.isArray(zeitraum.wochentage) ||
            zeitraum.wochentage.length === 0
        ) {

            throw new Error(
                'Bitte wählen Sie mindestens einen Wochentag aus.'
            );
        }

        /* =====================================================
           PAYLOAD ERSTELLEN
           ===================================================== */

        const payload = {
            ...aenderungen
        };

        /*
         * Bei vollständiger Abwesenheit werden
         * beide Abwesenheitszeiträume entfernt.
         */

        if (payload.status === 'FEHLT') {

            payload.abwesendAb = null;
            payload.abwesendBis = null;

            payload.abwesendAb2 = null;
            payload.abwesendBis2 = null;
        }

        /* =====================================================
           ABWESENHEITSGRUND VALIDIEREN
           ===================================================== */

        if (
            typeof payload.grundAbwesenheit === 'string' &&
            payload.grundAbwesenheit.length > 50
        ) {

            throw new Error(
                'Der Abwesenheitsgrund darf maximal 50 Zeichen enthalten.'
            );
        }

        /* =====================================================
           UHRZEITEN VALIDIEREN
           ===================================================== */

        if (
            payload.abwesendAb &&
            payload.abwesendBis &&
            payload.abwesendAb >= payload.abwesendBis
        ) {

            throw new Error(
                'Abwesend ab muss vor Abwesend bis liegen.'
            );
        }

        /* =====================================================
           AUSGEWÄHLTE SCHÜLER ERMITTELN
           ===================================================== */

        const visibleStudentIds = new Set(

            sortedRows.map(row =>
                normalizeId(row.studentId)
            )
        );

        const studentIds = [

            ...new Set(

                selectedStudentIds.filter(id =>
                    visibleStudentIds.has(id)
                )
            )

        ].map(Number);

        if (
            studentIds.length === 0 ||
            studentIds.some(id =>
                !Number.isSafeInteger(id) ||
                id <= 0
            )
        ) {

            throw new Error(
                'Die Schülerauswahl ist ungültig.'
            );
        }

        /* =====================================================
           SAMMELAKTUALISIERUNG SPEICHERN
           ===================================================== */

        try {

            setSaving(true);
            setError('');
            setMessage('');

            const result =
                await saveSammelTagesAnwesenheitZeitraum(

                    zeitraum.von,

                    zeitraum.bis,

                    zeitraum.wochentage,

                    studentIds,

                    payload
                );

            /* =====================================================
               ERFOLGSMELDUNG ERSTELLEN
               ===================================================== */

            const successMessage =

                `${result.anzahlEintraege} Anwesenheitseinträge ` +

                `für ${result.anzahlSchueler} Schüler ` +

                `an ${result.anzahlTage} Tagen ` +

                'wurden erfolgreich gespeichert.';

            /* =====================================================
               AKTUELL ANGEZEIGTEN TAG PRÜFEN
               ===================================================== */

            const aktuellerTagBetroffen =

                Array.isArray(result.gespeicherteTage) &&

                result.gespeicherteTage.includes(datum);

            /*
             * Die Tabelle zeigt weiterhin nur
             * die Anwesenheiten des aktuell
             * ausgewählten Datums an.
             *
             * Nur wenn dieses Datum betroffen ist,
             * müssen die Anwesenheiten neu geladen werden.
             */

            if (aktuellerTagBetroffen) {

                try {

                    const attendanceData =
                        await getTagesAnwesenheitenByDatum(
                            datum
                        );

                    const attendanceMap = {};

                    asArray(attendanceData).forEach(
                        eintrag => {

                            const studentId =
                                eintrag.student?.id;

                            if (studentId == null) {
                                return;
                            }

                            attendanceMap[
                                normalizeId(studentId)
                                ] = normalizeAnwesenheit(
                                eintrag
                            );
                        }
                    );

                    setOriginalAnwesenheiten(
                        attendanceMap
                    );

                    setAnwesenheiten({
                        ...attendanceMap
                    });

                } catch (reloadError) {

                    /*
                     * Die Speicherung war erfolgreich.
                     * Nur das erneute Laden ist fehlgeschlagen.
                     */

                    console.error(
                        'Anwesenheiten konnten nach dem Speichern nicht geladen werden:',
                        reloadError
                    );

                    setMessage(successMessage);

                    setError(
                        'Die Sammelerfassung wurde gespeichert, ' +
                        'aber die aktuelle Ansicht konnte nicht ' +
                        'aktualisiert werden. Bitte laden Sie ' +
                        'die Ansicht erneut.'
                    );

                    setLoadError(true);
                    setSelectedStudentIds([]);

                    return;
                }
            }

            /* =====================================================
               ERFOLG ANZEIGEN
               ===================================================== */

            setMessage(successMessage);

            setSelectedStudentIds([]);

        } catch (err) {

            console.error(
                'Sammelaktualisierung fehlgeschlagen:',
                err
            );

            const errorMessage = getErrorMessage(

                err,

                'Die Sammelaktualisierung ist fehlgeschlagen.'
            );

            setError(errorMessage);

            throw new Error(errorMessage);

        } finally {

            setSaving(false);
        }
    };

    /* =====================================================
       ANZAHL ERFASSTER SCHÜLER
       ===================================================== */

    const erfasstCount = useMemo(() => {

        return sortedRows.filter(row =>

            row.anwesenheit.status ||
            row.anwesenheit.abwesendAb ||
            row.anwesenheit.abwesendBis ||
            row.anwesenheit.abwesendAb2 ||
            row.anwesenheit.abwesendBis2

        ).length;

    }, [sortedRows]);

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <section className="anwesenheit-section">

            {/* HEADER */}

            <div className="anwesenheit-section-header">

                <div>

                    <h2>Anwesenheit erfassen</h2>

                    <p>
                        {getWochentag(datum)}
                        {' · '}
                        Anwesenheitskontrolle für Klassen,
                        Angebote und ANA
                    </p>

                </div>

                <span className="anwesenheit-count">

                    {erfasstCount} / {sortedRows.length}
                    {' erfasst'}

                </span>

            </div>

            {/* FEHLER */}

            {error && (

                <div
                    className="anwesenheit-message error"
                    role="alert"
                >
                    <span className="anwesenheit-message-icon">
                        !
                    </span>

                    {error}
                </div>

            )}

            {/* ERFOLG */}

            {message && (

                <div className="anwesenheit-message success">

                    <span className="anwesenheit-message-icon">
                        ✓
                    </span>

                    {message}

                </div>

            )}

            {/* FILTER */}

            <AnwesenheitFilter

                datum={datum}

                onDatumChange={handleDatumChange}

                filterMode={filterMode}

                onFilterModeChange={
                    handleFilterModeChange
                }

                klassen={klassen}

                angebote={angebote}

                kurse={kurse}

                jahrgaenge={jahrgaenge}

                selectedKlasseId={
                    selectedKlasseId
                }

                onKlasseChange={
                    setSelectedKlasseId
                }

                selectedAngebotId={
                    selectedAngebotId
                }

                onAngebotChange={
                    setSelectedAngebotId
                }

                selectedKursId={
                    selectedKursId
                }

                onKursChange={
                    setSelectedKursId
                }

                search={search}

                onSearchChange={setSearch}

                jahrgangFilter={
                    jahrgangFilter
                }

                onJahrgangFilterChange={
                    setJahrgangFilter
                }

                klasseFilter={
                    klasseFilter
                }

                onKlasseFilterChange={
                    setKlasseFilter
                }

                onReload={handleReload}

                disabled={loading || saving}

            />

            {/* INHALT */}

            {loading ? (

                <div className="anwesenheit-empty">

                    Anwesenheitsdaten werden geladen...

                </div>

            ) : loadError ? (

                <div className="anwesenheit-empty">

                    Die Daten konnten nicht geladen werden.
                    Bitte laden Sie die Ansicht erneut.

                </div>

            ) : sortedRows.length === 0 ? (

                <div className="anwesenheit-empty">

                    Keine Schüler für die ausgewählte
                    Ansicht gefunden.

                </div>

            ) : (

                <>

                    {/* SAMMELERFASSUNG */}

                    <AnwesenheitSammelerfassung

                        selectedCount={
                            selectedStudentIds.length
                        }

                        totalCount={
                            sortedRows.length
                        }

                        onSelectAll={
                            handleSelectAllVisible
                        }

                        onClearSelection={() =>
                            setSelectedStudentIds([])
                        }

                        onSave={handleSammelSave}

                        disabled={
                            saving ||
                            hasUnsavedChanges
                        }

                    />

                    {/* TABELLE */}

                    <AnwesenheitTabelle

                        key={datum}

                        rows={sortedRows}

                        selectedStudentIds={
                            selectedStudentIds
                        }

                        onSelectStudent={
                            handleSelectStudent
                        }

                        onSelectAll={
                            handleSelectAllVisible
                        }

                        onChange={
                            handleAnwesenheitChange
                        }

                        onStatusChange={
                            handleStatusChange
                        }

                        sortKey={sortKey}

                        sortDirection={
                            sortDirection
                        }

                        onSort={handleSort}

                        disabled={saving}

                    />

                    {/* SPEICHERN */}

                    <div className="anwesenheit-actions">

                        <span className="anwesenheit-unsaved-count">

                            {hasUnsavedChanges

                                ? `${changedEntries.length} ungespeicherte Änderungen`

                                : 'Alle Änderungen gespeichert'}

                        </span>

                        <button

                            type="button"

                            className="save-button"

                            disabled={
                                saving ||
                                !hasUnsavedChanges
                            }

                            onClick={handleSave}

                        >

                            {saving

                                ? 'Wird gespeichert...'

                                : 'Anwesenheit speichern'}

                        </button>

                    </div>

                </>

            )}

        </section>
    );
}

export default AnwesenheitErfassung;