import React, { useEffect, useMemo, useState } from 'react';

import { getKurse } from '../services/kursService';

import {
    updateBesonderheiten
} from '../services/buchungService';

import {
    createAnwesenheit,
    getAnwesenheitenByZeitraum,
    deleteAnwesenheit,
    exportAnwesenheiten
} from '../services/anwesenheitService';

import './AnwesenheitPage.css';

const wochentage = [
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag'
];

const getToday = () => {
    return new Date()
        .toISOString()
        .split('T')[0];
};

/* =====================================================
   WOCHENTAG AUS DATUM ERMITTELN
   ===================================================== */

const getWochentagFromDate = (dateString) => {

    if (!dateString) {
        return '';
    }

    /*
     * T12:00:00 verhindert mögliche Probleme
     * durch Zeitzonen beim Erstellen des Datums.
     */
    const date = new Date(
        `${dateString}T12:00:00`
    );

    const day = date.getDay();

    switch (day) {

        case 1:
            return 'Montag';

        case 2:
            return 'Dienstag';

        case 3:
            return 'Mittwoch';

        case 4:
            return 'Donnerstag';

        case 5:
            return 'Freitag';

        case 6:
            return 'Samstag';

        case 0:
            return 'Sonntag';

        default:
            return '';
    }
};

function AnwesenheitPage() {

    /* =====================================================
       GRUNDDATEN
       ===================================================== */

    const [kurse, setKurse] = useState([]);
    const [selectedKurs, setSelectedKurs] = useState('');
    const [students, setStudents] = useState([]);
    const [statuses, setStatuses] = useState({});
    const [bemerkungen, setBemerkungen] = useState({});
    const [savedAnwesenheiten, setSavedAnwesenheiten] = useState([]);

    /* =====================================================
       BESONDERHEITEN
       ===================================================== */

    const [besonderheiten, setBesonderheiten] = useState({});

    const [
        savingBesonderheitenId,
        setSavingBesonderheitenId
    ] = useState(null);

    /* =====================================================
       SCHÜLER FILTER / SORTIERUNG
       ===================================================== */

    const [studentSearch, setStudentSearch] = useState('');

    const [
        studentJahrgangFilter,
        setStudentJahrgangFilter
    ] = useState('');

    const [
        studentKlasseFilter,
        setStudentKlasseFilter
    ] = useState('');

    const [studentSort, setStudentSort] = useState({
        key: 'name',
        direction: 'asc'
    });

    /* =====================================================
       MELDUNGEN
       ===================================================== */

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const showSuccess = (text) => {
        setMessageType('success');
        setMessage(text);
    };

    const showError = (text) => {
        setMessageType('error');
        setMessage(text);
    };

    const clearMessage = () => {
        setMessage('');
    };

    /* =====================================================
       TABS
       ===================================================== */

    const [activeTab, setActiveTab] = useState('erfassen');

    /* =====================================================
       ANWESENHEIT ERFASSEN
       ===================================================== */

    const [datum, setDatum] = useState(getToday());

    const [saveLoading, setSaveLoading] =
        useState(false);

    const [studentsLoading, setStudentsLoading] =
        useState(false);

    /* =====================================================
       VERLAUF
       ===================================================== */

    const [filterVon, setFilterVon] = useState(getToday());
    const [filterBis, setFilterBis] = useState(getToday());
    const [filterKurs, setFilterKurs] = useState('');

    const [anzeigeModus, setAnzeigeModus] =
        useState('gesamt');

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [exportLoading, setExportLoading] =
        useState(false);

    /* =====================================================
       BEARBEITUNG
       ===================================================== */

    const [editingId, setEditingId] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editBemerkung, setEditBemerkung] = useState('');

    /* =====================================================
       INITIALISIERUNG
       ===================================================== */

    useEffect(() => {

        loadKurse();

        loadZeitraum(
            getToday(),
            getToday(),
            false
        );

    }, []);

    /* =====================================================
       HILFSFUNKTIONEN
       ===================================================== */

    const formatStudentName = (student) => {

        if (!student) {
            return '–';
        }

        const nachname =
            student.nachname || '';

        const vorname =
            student.vorname || '';

        if (!nachname && !vorname) {
            return '–';
        }

        return `${nachname}, ${vorname}`;
    };

    const formatStatus = (status) => {

        switch (status) {

            case 'ANWESEND':
                return 'Anwesend';

            case 'FEHLT':
                return 'Fehlt';

            case 'ENTSCHULDIGT':
                return 'Entschuldigt';

            default:
                return status || '–';
        }
    };

    /* =====================================================
       FARBE NACH KLASSE
       ===================================================== */

    const getKlasseColorClass = (klasse) => {

        if (!klasse) {
            return '';
        }

        switch (
            String(klasse)
                .trim()
                .toLowerCase()
            ) {

            case 'erde':
                return 'klasse-erde';

            case 'feuer':
                return 'klasse-feuer';

            case 'luft':
                return 'klasse-luft';

            case 'wasser':
                return 'klasse-wasser';

            case 'mars':
                return 'klasse-mars';

            case 'merkur':
                return 'klasse-merkur';

            case 'saturn':
                return 'klasse-saturn';

            default:
                return '';
        }
    };

    /* =====================================================
       KURSE LADEN
       ===================================================== */

    const loadKurse = async () => {

        try {

            const data =
                await getKurse();

            setKurse(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {

            console.error(error);

            showError(
                'Kurse konnten nicht geladen werden.'
            );
        }
    };

    /* =====================================================
       ZEITRAUM LADEN
       ===================================================== */

    const loadZeitraum = async (
        von = filterVon,
        bis = filterBis,
        resetMessage = true
    ) => {

        if (!von || !bis) {

            showError(
                'Bitte Von- und Bis-Datum auswählen.'
            );

            return false;
        }

        if (von > bis) {

            showError(
                'Das Von-Datum darf nicht nach dem Bis-Datum liegen.'
            );

            return false;
        }

        try {

            setHistoryLoading(true);

            if (resetMessage) {
                clearMessage();
            }

            const data =
                await getAnwesenheitenByZeitraum(
                    von,
                    bis
                );

            setSavedAnwesenheiten(
                Array.isArray(data)
                    ? data
                    : []
            );

            return true;

        } catch (error) {

            console.error(error);

            setSavedAnwesenheiten([]);

            showError(
                'Anwesenheiten für den Zeitraum konnten nicht geladen werden.'
            );

            return false;

        } finally {

            setHistoryLoading(false);
        }
    };

    /* =====================================================
       KURSE NACH WOCHENTAG
       ===================================================== */

    const getKurseByWochentag = (wochentag) => {

        return kurse.filter(
            (kurs) =>
                kurs.wochentag ===
                wochentag
        );
    };

    /* =====================================================
       WOCHENTAG DES AUSGEWÄHLTEN DATUMS
       ===================================================== */

    const selectedWochentag =
        useMemo(() => {

            return getWochentagFromDate(
                datum
            );

        }, [datum]);

    /* =====================================================
       KURSE DES AUSGEWÄHLTEN DATUMS
       ===================================================== */

    const kurseFuerDatum =
        useMemo(() => {

            if (!selectedWochentag) {
                return [];
            }

            return kurse
                .filter(
                    (kurs) =>
                        String(
                            kurs.wochentag ?? ''
                        ) ===
                        String(
                            selectedWochentag
                        )
                )
                .sort(
                    (a, b) => {

                        const nameComparison =
                            String(
                                a.name ?? ''
                            ).localeCompare(
                                String(
                                    b.name ?? ''
                                ),
                                'de'
                            );

                        if (
                            nameComparison !== 0
                        ) {
                            return nameComparison;
                        }

                        return String(
                            a.uhrzeit ?? ''
                        ).localeCompare(
                            String(
                                b.uhrzeit ?? ''
                            ),
                            'de'
                        );
                    }
                );

        }, [
            kurse,
            selectedWochentag
        ]);

    /* =====================================================
       SCHÜLER + BESONDERHEITEN + ANWESENHEIT LADEN
       ===================================================== */

    const loadStudentsForKurs = async (
        kursId,
        selectedDatum
    ) => {

        if (!kursId) {

            setStudents([]);
            setStatuses({});
            setBemerkungen({});
            setBesonderheiten({});

            return;
        }

        try {

            setStudentsLoading(true);

            const response =
                await fetch(
                    `/api/buchungen/kurs/${kursId}`
                );

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const buchungen =
                await response.json();

            /*
             * Wichtig:
             * buchungId speichern, weil Besonderheiten
             * zur Buchung und nicht zum Student gehören.
             */
            const studentList =
                (
                    Array.isArray(buchungen)
                        ? buchungen
                        : []
                )
                    .filter(
                        (buchung) =>
                            Boolean(
                                buchung.student
                            )
                    )
                    .map(
                        (buchung) => ({
                            ...buchung.student,

                            buchungId:
                            buchung.id,

                            besonderheiten:
                                buchung.besonderheiten ??
                                ''
                        })
                    );

            const anwesenheitenData =
                await getAnwesenheitenByZeitraum(
                    selectedDatum,
                    selectedDatum
                );

            const anwesenheiten =
                Array.isArray(
                    anwesenheitenData
                )
                    ? anwesenheitenData
                    : [];

            const kursAnwesenheiten =
                anwesenheiten.filter(
                    (anwesenheit) =>
                        Number(
                            anwesenheit.kurs?.id
                        ) ===
                        Number(kursId)
                );

            const initialStatuses = {};
            const initialBemerkungen = {};
            const initialBesonderheiten = {};

            studentList.forEach(
                (student) => {

                    const existing =
                        kursAnwesenheiten.find(
                            (anwesenheit) =>
                                Number(
                                    anwesenheit.student?.id
                                ) ===
                                Number(
                                    student.id
                                )
                        );

                    if (existing) {

                        initialStatuses[
                            student.id
                            ] =
                            existing.status ||
                            'ANWESEND';

                        initialBemerkungen[
                            student.id
                            ] =
                            existing.bemerkung ||
                            '';

                    } else {

                        initialStatuses[
                            student.id
                            ] =
                            'ANWESEND';

                        initialBemerkungen[
                            student.id
                            ] =
                            '';
                    }

                    initialBesonderheiten[
                        student.id
                        ] =
                        student.besonderheiten ||
                        '';
                }
            );

            setStudents(
                studentList
            );

            setStatuses(
                initialStatuses
            );

            setBemerkungen(
                initialBemerkungen
            );

            setBesonderheiten(
                initialBesonderheiten
            );

        } catch (error) {

            console.error(
                'Fehler beim Laden der Schüler/Anwesenheiten:',
                error
            );

            setStudents([]);
            setStatuses({});
            setBemerkungen({});
            setBesonderheiten({});

            showError(
                'Schüler oder gespeicherte Anwesenheiten konnten nicht geladen werden.'
            );

        } finally {

            setStudentsLoading(false);
        }
    };

    /* =====================================================
       KURS AUSWÄHLEN
       ===================================================== */

    const handleKursChange = async (
        kursId
    ) => {

        setSelectedKurs(
            kursId
        );

        clearMessage();

        setStudentSearch('');
        setStudentJahrgangFilter('');
        setStudentKlasseFilter('');

        await loadStudentsForKurs(
            kursId,
            datum
        );
    };

    /* =====================================================
       DATUM ÄNDERN
       ===================================================== */

    const handleDatumChange = async (
        newDatum
    ) => {

        setDatum(
            newDatum
        );

        clearMessage();

        /*
         * Den Wochentag des neuen Datums bestimmen.
         */
        const newWochentag =
            getWochentagFromDate(
                newDatum
            );

        /*
         * Aktuell ausgewählten Kurs suchen.
         */
        const currentKurs =
            kurse.find(
                (kurs) =>
                    Number(
                        kurs.id
                    ) ===
                    Number(
                        selectedKurs
                    )
            );

        /*
         * Prüfen, ob der aktuell ausgewählte
         * Kurs auch am neuen Wochentag angeboten wird.
         */
        const kursIstAmNeuenTag =
            Boolean(
                currentKurs &&
                String(
                    currentKurs.wochentag ?? ''
                ) ===
                String(
                    newWochentag
                )
            );

        if (
            selectedKurs &&
            kursIstAmNeuenTag
        ) {

            /*
             * Der Kurs gehört weiterhin zum
             * ausgewählten Wochentag.
             *
             * Deshalb werden die Anwesenheiten
             * für das neue Datum geladen.
             */
            await loadStudentsForKurs(
                selectedKurs,
                newDatum
            );

            return;
        }

        /*
         * Der bisherige Kurs gehört nicht zum
         * neu ausgewählten Datum.
         *
         * Deshalb Auswahl und Schülerliste leeren.
         */
        setSelectedKurs('');

        setStudents([]);
        setStatuses({});
        setBemerkungen({});
        setBesonderheiten({});

        setStudentSearch('');
        setStudentJahrgangFilter('');
        setStudentKlasseFilter('');
    };

    /* =====================================================
       STATUS ÄNDERN
       ===================================================== */

    const handleStatusChange = (
        studentId,
        status
    ) => {

        setStatuses(
            (previous) => ({
                ...previous,
                [studentId]: status
            })
        );
    };

    /* =====================================================
       BEMERKUNG ÄNDERN
       ===================================================== */

    const handleBemerkungChange = (
        studentId,
        bemerkung
    ) => {

        setBemerkungen(
            (previous) => ({
                ...previous,
                [studentId]: bemerkung
            })
        );
    };

    /* =====================================================
       BESONDERHEITEN ÄNDERN
       ===================================================== */

    const handleBesonderheitenChange = (
        studentId,
        value
    ) => {

        setBesonderheiten(
            (previous) => ({
                ...previous,
                [studentId]:
                    value.slice(
                        0,
                        50
                    )
            })
        );
    };

    /* =====================================================
       BESONDERHEITEN SPEICHERN
       ===================================================== */

    const handleBesonderheitenSave = async (
        student
    ) => {

        if (!student.buchungId) {

            showError(
                'Die Kursbuchung konnte nicht gefunden werden.'
            );

            return;
        }

        try {

            setSavingBesonderheitenId(
                student.id
            );

            clearMessage();

            await updateBesonderheiten(
                student.buchungId,
                besonderheiten[
                    student.id
                    ] || ''
            );

            setStudents(
                (previous) =>
                    previous.map(
                        (currentStudent) =>
                            currentStudent.id ===
                            student.id
                                ? {
                                    ...currentStudent,
                                    besonderheiten:
                                        besonderheiten[
                                            student.id
                                            ] || ''
                                }
                                : currentStudent
                    )
            );

            showSuccess(
                'Besonderheiten wurden erfolgreich gespeichert.'
            );

        } catch (error) {

            console.error(
                'Besonderheiten konnten nicht gespeichert werden:',
                error
            );

            showError(
                'Besonderheiten konnten nicht gespeichert werden.'
            );

        } finally {

            setSavingBesonderheitenId(
                null
            );
        }
    };

    /* =====================================================
       JAHRGÄNGE FÜR FILTER
       ===================================================== */

    const studentJahrgaenge =
        useMemo(() => {

            return [
                ...new Set(
                    students
                        .map(
                            (student) =>
                                student.jahrgang
                        )
                        .filter(
                            (jahrgang) =>
                                jahrgang !== null &&
                                jahrgang !== undefined &&
                                jahrgang !== ''
                        )
                )
            ].sort(
                (a, b) =>
                    Number(a) -
                    Number(b)
            );

        }, [students]);

    /* =====================================================
       KLASSEN FÜR FILTER
       ===================================================== */

    const studentKlassen =
        useMemo(() => {

            return [
                ...new Set(
                    students
                        .map(
                            (student) =>
                                student.klasse
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

        }, [students]);

    /* =====================================================
       SCHÜLER FILTERN / SORTIEREN
       ===================================================== */

    const filteredStudents =
        useMemo(() => {

            const search =
                studentSearch
                    .trim()
                    .toLowerCase();

            const result =
                students.filter(
                    (student) => {

                        const name =
                            formatStudentName(
                                student
                            ).toLowerCase();

                        const matchesSearch =
                            !search ||
                            name.includes(
                                search
                            );

                        const matchesJahrgang =
                            !studentJahrgangFilter ||
                            String(
                                student.jahrgang ??
                                ''
                            ) ===
                            String(
                                studentJahrgangFilter
                            );

                        const matchesKlasse =
                            !studentKlasseFilter ||
                            String(
                                student.klasse ??
                                ''
                            ) ===
                            String(
                                studentKlasseFilter
                            );

                        return (
                            matchesSearch &&
                            matchesJahrgang &&
                            matchesKlasse
                        );
                    }
                );

            result.sort(
                (a, b) => {

                    let valueA = '';
                    let valueB = '';

                    switch (
                        studentSort.key
                        ) {

                        case 'jahrgang':

                            valueA =
                                Number(
                                    a.jahrgang ??
                                    0
                                );

                            valueB =
                                Number(
                                    b.jahrgang ??
                                    0
                                );

                            break;

                        case 'klasse':

                            valueA =
                                String(
                                    a.klasse ??
                                    ''
                                );

                            valueB =
                                String(
                                    b.klasse ??
                                    ''
                                );

                            break;

                        case 'name':
                        default:

                            valueA =
                                formatStudentName(
                                    a
                                );

                            valueB =
                                formatStudentName(
                                    b
                                );

                            break;
                    }

                    let comparison = 0;

                    if (
                        typeof valueA ===
                        'number' &&
                        typeof valueB ===
                        'number'
                    ) {

                        comparison =
                            valueA -
                            valueB;

                    } else {

                        comparison =
                            String(valueA)
                                .localeCompare(
                                    String(valueB),
                                    'de'
                                );
                    }

                    return studentSort.direction ===
                    'asc'
                        ? comparison
                        : -comparison;
                }
            );

            return result;

        }, [
            students,
            studentSearch,
            studentJahrgangFilter,
            studentKlasseFilter,
            studentSort
        ]);

    /* =====================================================
       SORTIERUNG ÄNDERN
       ===================================================== */

    const handleStudentSort = (key) => {

        setStudentSort(
            (previous) => {

                if (
                    previous.key ===
                    key
                ) {

                    return {
                        key,
                        direction:
                            previous.direction ===
                            'asc'
                                ? 'desc'
                                : 'asc'
                    };
                }

                return {
                    key,
                    direction: 'asc'
                };
            }
        );
    };

    /* =====================================================
       SORTIERUNG SYMBOL
       ===================================================== */

    const getSortSymbol = (key) => {

        if (
            studentSort.key !==
            key
        ) {
            return '';
        }

        return studentSort.direction ===
        'asc'
            ? ' ↑'
            : ' ↓';
    };

    /* =====================================================
       ANWESENHEIT SPEICHERN
       ===================================================== */

    const handleSave = async () => {

        if (!selectedKurs) {

            showError(
                'Bitte zuerst einen Kurs auswählen.'
            );

            return;
        }

        if (students.length === 0) {

            showError(
                'Für diesen Kurs gibt es keine Schüler.'
            );

            return;
        }

        /*
         * Zusätzliche Sicherheitsprüfung:
         * Der ausgewählte Kurs muss zum Datum passen.
         */
        const currentKurs =
            kurse.find(
                (kurs) =>
                    Number(
                        kurs.id
                    ) ===
                    Number(
                        selectedKurs
                    )
            );

        if (
            !currentKurs ||
            String(
                currentKurs.wochentag ??
                ''
            ) !==
            String(
                selectedWochentag
            )
        ) {

            showError(
                'Der ausgewählte Kurs findet am gewählten Datum nicht statt.'
            );

            return;
        }

        try {

            setSaveLoading(true);

            clearMessage();

            for (
                const student of students
                ) {

                const anwesenheit = {

                    datum,

                    status:
                        statuses[
                            student.id
                            ] ||
                        'ANWESEND',

                    bemerkung:
                        bemerkungen[
                            student.id
                            ] ||
                        ''
                };

                await createAnwesenheit(
                    student.id,
                    selectedKurs,
                    anwesenheit
                );
            }

            showSuccess(
                'Anwesenheit wurde erfolgreich gespeichert.'
            );

            await loadStudentsForKurs(
                selectedKurs,
                datum
            );

            if (
                datum >= filterVon &&
                datum <= filterBis
            ) {

                await loadZeitraum(
                    filterVon,
                    filterBis,
                    false
                );
            }

        } catch (error) {

            console.error(error);

            showError(
                'Anwesenheit konnte nicht gespeichert werden.'
            );

        } finally {

            setSaveLoading(false);
        }
    };

    /* =====================================================
       VERLAUF FILTERN
       ===================================================== */

    const filteredAnwesenheiten =
        useMemo(() => {

            return savedAnwesenheiten
                .filter(
                    (anwesenheit) => {

                        return (
                            !filterKurs ||
                            Number(
                                anwesenheit.kurs?.id
                            ) ===
                            Number(
                                filterKurs
                            )
                        );
                    }
                )
                .sort(
                    (a, b) => {

                        const datumA =
                            String(
                                a.datum ??
                                ''
                            );

                        const datumB =
                            String(
                                b.datum ??
                                ''
                            );

                        return datumB
                            .localeCompare(
                                datumA
                            );
                    }
                );

        }, [
            savedAnwesenheiten,
            filterKurs
        ]);

    /* =====================================================
       NACH KURS GRUPPIEREN
       ===================================================== */

    const gruppiertNachKurs =
        useMemo(() => {

            const gruppen = {};

            filteredAnwesenheiten.forEach(
                (anwesenheit) => {

                    const kursId =
                        anwesenheit.kurs?.id ??
                        'ohne-kurs';

                    if (
                        !gruppen[
                            kursId
                            ]
                    ) {

                        gruppen[
                            kursId
                            ] = {
                            kurs:
                            anwesenheit.kurs,
                            eintraege: []
                        };
                    }

                    gruppen[
                        kursId
                        ].eintraege.push(
                        anwesenheit
                    );
                }
            );

            return Object
                .values(
                    gruppen
                )
                .sort(
                    (a, b) =>
                        String(
                            a.kurs?.name ??
                            ''
                        ).localeCompare(
                            String(
                                b.kurs?.name ??
                                ''
                            ),
                            'de'
                        )
                );

        }, [filteredAnwesenheiten]);

    /* =====================================================
       NACH KIND GRUPPIEREN
       ===================================================== */

    const gruppiertNachKind =
        useMemo(() => {

            const gruppen = {};

            filteredAnwesenheiten.forEach(
                (anwesenheit) => {

                    const studentId =
                        anwesenheit.student?.id ??
                        'ohne-student';

                    if (
                        !gruppen[
                            studentId
                            ]
                    ) {

                        gruppen[
                            studentId
                            ] = {
                            student:
                            anwesenheit.student,
                            eintraege: []
                        };
                    }

                    gruppen[
                        studentId
                        ].eintraege.push(
                        anwesenheit
                    );
                }
            );

            return Object
                .values(
                    gruppen
                )
                .sort(
                    (a, b) =>
                        formatStudentName(
                            a.student
                        ).localeCompare(
                            formatStudentName(
                                b.student
                            ),
                            'de'
                        )
                );

        }, [filteredAnwesenheiten]);

    /* =====================================================
       BEARBEITUNG STARTEN
       ===================================================== */

    const handleEditStart = (
        anwesenheit
    ) => {

        setEditingId(
            anwesenheit.id
        );

        setEditStatus(
            anwesenheit.status ||
            'ANWESEND'
        );

        setEditBemerkung(
            anwesenheit.bemerkung ||
            ''
        );
    };

    /* =====================================================
       BEARBEITUNG ABBRECHEN
       ===================================================== */

    const handleEditCancel = () => {

        setEditingId(null);
        setEditStatus('');
        setEditBemerkung('');
    };

    /* =====================================================
       BEARBEITUNG SPEICHERN
       ===================================================== */

    const handleEditSave = async (
        anwesenheit
    ) => {

        try {

            await createAnwesenheit(
                anwesenheit.student.id,
                anwesenheit.kurs.id,
                {
                    datum:
                    anwesenheit.datum,

                    status:
                    editStatus,

                    bemerkung:
                    editBemerkung
                }
            );

            setEditingId(null);
            setEditStatus('');
            setEditBemerkung('');

            showSuccess(
                'Anwesenheit wurde erfolgreich aktualisiert.'
            );

            await loadZeitraum(
                filterVon,
                filterBis,
                false
            );

            if (
                String(
                    anwesenheit.datum
                ) ===
                String(datum) &&
                Number(
                    anwesenheit.kurs?.id
                ) ===
                Number(
                    selectedKurs
                )
            ) {

                await loadStudentsForKurs(
                    selectedKurs,
                    datum
                );
            }

        } catch (error) {

            console.error(error);

            showError(
                'Anwesenheit konnte nicht aktualisiert werden.'
            );
        }
    };

    /* =====================================================
       LÖSCHEN
       ===================================================== */

    const handleDelete = async (
        id
    ) => {

        const confirmed =
            window.confirm(
                'Möchten Sie diesen Anwesenheitseintrag wirklich löschen?'
            );

        if (!confirmed) {
            return;
        }

        try {

            await deleteAnwesenheit(
                id
            );

            showSuccess(
                'Anwesenheit wurde erfolgreich gelöscht.'
            );

            await loadZeitraum(
                filterVon,
                filterBis,
                false
            );

            if (selectedKurs) {

                await loadStudentsForKurs(
                    selectedKurs,
                    datum
                );
            }

        } catch (error) {

            console.error(error);

            showError(
                'Anwesenheit konnte nicht gelöscht werden.'
            );
        }
    };

    /* =====================================================
       EXCEL EXPORT
       ===================================================== */

    const handleExport = async () => {

        if (
            !filterVon ||
            !filterBis
        ) {

            showError(
                'Bitte einen Zeitraum für den Export auswählen.'
            );

            return;
        }

        if (
            filterVon >
            filterBis
        ) {

            showError(
                'Das Von-Datum darf nicht nach dem Bis-Datum liegen.'
            );

            return;
        }

        try {

            setExportLoading(
                true
            );

            clearMessage();

            const blob =
                await exportAnwesenheiten(
                    filterVon,
                    filterBis,
                    filterKurs
                );

            const url =
                window.URL
                    .createObjectURL(
                        blob
                    );

            const link =
                document
                    .createElement(
                        'a'
                    );

            link.href = url;

            link.download =
                `Anwesenheit_${filterVon}_bis_${filterBis}.xlsx`;

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            window.URL
                .revokeObjectURL(
                    url
                );

            showSuccess(
                'Excel-Export wurde erfolgreich erstellt.'
            );

        } catch (error) {

            console.error(
                'Fehler beim Excel-Export:',
                error
            );

            showError(
                'Excel-Export konnte nicht erstellt werden.'
            );

        } finally {

            setExportLoading(
                false
            );
        }
    };

    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="anwesenheit-page">

            <header className="page-header">

                <div className="page-header-content">

                    <h1>
                        Anwesenheit
                    </h1>

                    <p>
                        Anwesenheiten erfassen und bereits
                        gespeicherte Einträge verwalten
                    </p>

                </div>

            </header>

            {/* =================================================
                TABS
               ================================================= */}

            <div className="anwesenheit-tabs">

                <button
                    type="button"
                    className={
                        activeTab ===
                        'erfassen'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() => {

                        setActiveTab(
                            'erfassen'
                        );

                        clearMessage();
                    }}
                >
                    Anwesenheit erfassen
                </button>

                <button
                    type="button"
                    className={
                        activeTab ===
                        'verlauf'
                            ? 'tab-button active'
                            : 'tab-button'
                    }
                    onClick={() => {

                        setActiveTab(
                            'verlauf'
                        );

                        clearMessage();
                    }}
                >
                    Verlauf
                </button>

            </div>

            {/* =================================================
                MELDUNG
               ================================================= */}

            {message && (

                <div
                    className={
                        `anwesenheit-message ${messageType}`
                    }
                >

                    <span className="anwesenheit-message-icon">

                        {messageType ===
                        'success'
                            ? '✓'
                            : '!'}

                    </span>

                    <span>
                        {message}
                    </span>

                </div>

            )}

            {/* =================================================
                ANWESENHEIT ERFASSEN
               ================================================= */}

            {activeTab ===
                'erfassen' && (

                    <section className="anwesenheit-section">

                        <div className="anwesenheit-section-header">

                            <div>

                                <h2>
                                    Anwesenheit erfassen
                                </h2>

                                <p>
                                    Datum und Kurs auswählen und
                                    anschließend den Status der Schüler
                                    erfassen.
                                </p>

                            </div>

                        </div>

                        {/* DATUM / KURS */}

                        <div className="anwesenheit-toolbar">

                            <div className="anwesenheit-field">

                                <label htmlFor="anwesenheit-datum">
                                    Datum
                                </label>

                                <input
                                    id="anwesenheit-datum"
                                    type="date"
                                    value={datum}
                                    onChange={(event) =>
                                        handleDatumChange(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                            <div className="anwesenheit-field anwesenheit-field-large">

                                <label htmlFor="anwesenheit-kurs">
                                    Kurs
                                </label>

                                <select
                                    id="anwesenheit-kurs"
                                    value={selectedKurs}
                                    onChange={(event) =>
                                        handleKursChange(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        !datum ||
                                        kurseFuerDatum.length ===
                                        0
                                    }
                                >

                                    <option value="">

                                        {kurseFuerDatum.length >
                                        0
                                            ? 'Kurs auswählen...'
                                            : `Keine Kurse am ${selectedWochentag || 'gewählten Tag'}`}

                                    </option>

                                    {kurseFuerDatum.map(
                                        (kurs) => (

                                            <option
                                                key={
                                                    kurs.id
                                                }
                                                value={
                                                    kurs.id
                                                }
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

                        </div>

                        {/* SCHÜLER FILTER */}

                        {students.length >
                            0 && (

                                <div className="anwesenheit-student-filters">

                                    <div className="anwesenheit-field anwesenheit-student-search">

                                        <label>
                                            Schüler
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Name suchen..."
                                            value={
                                                studentSearch
                                            }
                                            onChange={(event) =>
                                                setStudentSearch(
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </div>

                                    <div className="anwesenheit-field">

                                        <label>
                                            Jahrgang
                                        </label>

                                        <select
                                            value={
                                                studentJahrgangFilter
                                            }
                                            onChange={(event) =>
                                                setStudentJahrgangFilter(
                                                    event.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Alle Jahrgänge
                                            </option>

                                            {studentJahrgaenge.map(
                                                (jahrgang) => (

                                                    <option
                                                        key={
                                                            jahrgang
                                                        }
                                                        value={
                                                            jahrgang
                                                        }
                                                    >
                                                        {jahrgang}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div className="anwesenheit-field">

                                        <label>
                                            Klasse
                                        </label>

                                        <select
                                            value={
                                                studentKlasseFilter
                                            }
                                            onChange={(event) =>
                                                setStudentKlasseFilter(
                                                    event.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Alle Klassen
                                            </option>

                                            {studentKlassen.map(
                                                (klasse) => (

                                                    <option
                                                        key={
                                                            klasse
                                                        }
                                                        value={
                                                            klasse
                                                        }
                                                    >
                                                        {klasse}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>

                            )}

                        {/* SCHÜLER */}

                        {studentsLoading ? (

                            <div className="anwesenheit-empty">
                                Schüler und Anwesenheiten werden geladen...
                            </div>

                        ) : students.length ===
                        0 ? (

                            <div className="anwesenheit-empty">

                                {selectedKurs
                                    ? 'Für diesen Kurs sind keine Schüler vorhanden.'
                                    : kurseFuerDatum.length === 0
                                        ? `Für ${selectedWochentag || 'den ausgewählten Tag'} sind keine Kurse vorhanden.`
                                        : 'Bitte einen Kurs auswählen.'}

                            </div>

                        ) : filteredStudents.length ===
                        0 ? (

                            <div className="anwesenheit-empty">
                                Keine Schüler entsprechen dem Filter.
                            </div>

                        ) : (

                            <>

                                <div className="anwesenheit-table-scroll">

                                    <table className="anwesenheit-table">

                                        <thead>

                                        <tr>

                                            <th
                                                className="sortable-header"
                                                onClick={() =>
                                                    handleStudentSort(
                                                        'name'
                                                    )
                                                }
                                            >
                                                Name
                                                {getSortSymbol(
                                                    'name'
                                                )}
                                            </th>

                                            <th
                                                className="sortable-header"
                                                onClick={() =>
                                                    handleStudentSort(
                                                        'jahrgang'
                                                    )
                                                }
                                            >
                                                Jahrgang
                                                {getSortSymbol(
                                                    'jahrgang'
                                                )}
                                            </th>

                                            <th
                                                className="sortable-header"
                                                onClick={() =>
                                                    handleStudentSort(
                                                        'klasse'
                                                    )
                                                }
                                            >
                                                Klasse
                                                {getSortSymbol(
                                                    'klasse'
                                                )}
                                            </th>

                                            <th className="besonderheiten-column">
                                                Besonderheiten
                                            </th>

                                            <th className="status-column">
                                                Anwesend
                                            </th>

                                            <th className="status-column">
                                                Entschuldigt
                                            </th>

                                            <th className="status-column">
                                                Fehlt
                                            </th>

                                            <th>
                                                Bemerkung
                                            </th>

                                        </tr>

                                        </thead>

                                        <tbody>

                                        {filteredStudents.map(
                                            (student) => (

                                                <tr
                                                    key={
                                                        student.id
                                                    }
                                                    className={
                                                        getKlasseColorClass(
                                                            student.klasse
                                                        )
                                                    }
                                                >

                                                    <td>
                                                        {formatStudentName(
                                                            student
                                                        )}
                                                    </td>

                                                    <td>
                                                        {student.jahrgang ??
                                                            '–'}
                                                    </td>

                                                    <td className="klasse-cell">
                                                        {student.klasse ||
                                                            '–'}
                                                    </td>

                                                    {/* BESONDERHEITEN */}

                                                    <td className="besonderheiten-cell">

                                                        <div className="besonderheiten-edit">

                                                            <input
                                                                type="text"
                                                                className="besonderheiten-input"
                                                                maxLength={
                                                                    50
                                                                }
                                                                placeholder="Hinweis..."
                                                                value={
                                                                    besonderheiten[
                                                                        student.id
                                                                        ] ||
                                                                    ''
                                                                }
                                                                onChange={(event) =>
                                                                    handleBesonderheitenChange(
                                                                        student.id,
                                                                        event.target.value
                                                                    )
                                                                }
                                                            />

                                                            <button
                                                                type="button"
                                                                className="besonderheiten-save-button"
                                                                disabled={
                                                                    savingBesonderheitenId ===
                                                                    student.id
                                                                }
                                                                onClick={() =>
                                                                    handleBesonderheitenSave(
                                                                        student
                                                                    )
                                                                }
                                                            >

                                                                {savingBesonderheitenId ===
                                                                student.id
                                                                    ? '...'
                                                                    : 'Speichern'}

                                                            </button>

                                                        </div>

                                                        <span className="besonderheiten-counter">

                                                        {
                                                            (
                                                                besonderheiten[
                                                                    student.id
                                                                    ] ||
                                                                ''
                                                            ).length
                                                        } / 50

                                                    </span>

                                                    </td>

                                                    {/* ANWESEND */}

                                                    <td className="attendance-checkbox-cell">

                                                        <input
                                                            type="checkbox"
                                                            className="attendance-checkbox"
                                                            checked={
                                                                statuses[
                                                                    student.id
                                                                    ] ===
                                                                'ANWESEND'
                                                            }
                                                            onChange={() =>
                                                                handleStatusChange(
                                                                    student.id,
                                                                    'ANWESEND'
                                                                )
                                                            }
                                                        />

                                                    </td>

                                                    {/* ENTSCHULDIGT */}

                                                    <td className="attendance-checkbox-cell">

                                                        <input
                                                            type="checkbox"
                                                            className="attendance-checkbox"
                                                            checked={
                                                                statuses[
                                                                    student.id
                                                                    ] ===
                                                                'ENTSCHULDIGT'
                                                            }
                                                            onChange={() =>
                                                                handleStatusChange(
                                                                    student.id,
                                                                    'ENTSCHULDIGT'
                                                                )
                                                            }
                                                        />

                                                    </td>

                                                    {/* FEHLT */}

                                                    <td className="attendance-checkbox-cell">

                                                        <input
                                                            type="checkbox"
                                                            className="attendance-checkbox"
                                                            checked={
                                                                statuses[
                                                                    student.id
                                                                    ] ===
                                                                'FEHLT'
                                                            }
                                                            onChange={() =>
                                                                handleStatusChange(
                                                                    student.id,
                                                                    'FEHLT'
                                                                )
                                                            }
                                                        />

                                                    </td>

                                                    {/* BEMERKUNG */}

                                                    <td>

                                                        <input
                                                            type="text"
                                                            className="bemerkung-input"
                                                            placeholder="Bemerkung..."
                                                            value={
                                                                bemerkungen[
                                                                    student.id
                                                                    ] ||
                                                                ''
                                                            }
                                                            onChange={(event) =>
                                                                handleBemerkungChange(
                                                                    student.id,
                                                                    event.target.value
                                                                )
                                                            }
                                                        />

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                        </tbody>

                                    </table>

                                </div>

                                <div className="anwesenheit-actions">

                                    <button
                                        type="button"
                                        className="save-button"
                                        onClick={
                                            handleSave
                                        }
                                        disabled={
                                            saveLoading
                                        }
                                    >

                                        {saveLoading
                                            ? 'Wird gespeichert...'
                                            : 'Anwesenheit speichern'}

                                    </button>

                                </div>

                            </>

                        )}

                    </section>

                )}

            {/* =================================================
                VERLAUF
               ================================================= */}

            {activeTab ===
                'verlauf' && (

                    <section className="anwesenheit-section">

                        <div className="anwesenheit-section-header">

                            <div>

                                <h2>
                                    Verlauf
                                </h2>

                                <p>
                                    Anwesenheiten nach Zeitraum anzeigen,
                                    filtern und auswerten.
                                </p>

                            </div>

                            <span className="anwesenheit-count">

                            {filteredAnwesenheiten.length}{' '}
                                Einträge

                        </span>

                        </div>

                        {/* FILTER */}

                        <div className="anwesenheit-toolbar">

                            <div className="anwesenheit-field">

                                <label htmlFor="filter-von">
                                    Von
                                </label>

                                <input
                                    id="filter-von"
                                    type="date"
                                    value={
                                        filterVon
                                    }
                                    onChange={(event) =>
                                        setFilterVon(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                            <div className="anwesenheit-field">

                                <label htmlFor="filter-bis">
                                    Bis
                                </label>

                                <input
                                    id="filter-bis"
                                    type="date"
                                    value={
                                        filterBis
                                    }
                                    onChange={(event) =>
                                        setFilterBis(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                            <div className="anwesenheit-field anwesenheit-field-large">

                                <label htmlFor="filter-kurs">
                                    Kurs
                                </label>

                                <select
                                    id="filter-kurs"
                                    value={
                                        filterKurs
                                    }
                                    onChange={(event) =>
                                        setFilterKurs(
                                            event.target.value
                                        )
                                    }
                                >

                                    <option value="">
                                        Alle Kurse
                                    </option>

                                    {wochentage.map(
                                        (tag) => {

                                            const kurseAmTag =
                                                getKurseByWochentag(
                                                    tag
                                                );

                                            if (
                                                kurseAmTag.length ===
                                                0
                                            ) {
                                                return null;
                                            }

                                            return (

                                                <optgroup
                                                    key={
                                                        tag
                                                    }
                                                    label={
                                                        tag
                                                    }
                                                >

                                                    {kurseAmTag.map(
                                                        (kurs) => (

                                                            <option
                                                                key={
                                                                    kurs.id
                                                                }
                                                                value={
                                                                    kurs.id
                                                                }
                                                            >
                                                                {kurs.name}
                                                            </option>

                                                        )
                                                    )}

                                                </optgroup>

                                            );
                                        }
                                    )}

                                </select>

                            </div>

                            <div className="anwesenheit-toolbar-actions">

                                <button
                                    type="button"
                                    className="anwesenheit-load-button"
                                    onClick={() =>
                                        loadZeitraum()
                                    }
                                    disabled={
                                        historyLoading
                                    }
                                >

                                    {historyLoading
                                        ? 'Wird geladen...'
                                        : 'Zeitraum anzeigen'}

                                </button>

                                <button
                                    type="button"
                                    className="anwesenheit-export-button"
                                    onClick={
                                        handleExport
                                    }
                                    disabled={
                                        exportLoading
                                    }
                                >

                                    {exportLoading
                                        ? 'Export läuft...'
                                        : 'Excel exportieren'}

                                </button>

                            </div>

                        </div>

                        {/* ANZEIGEMODUS */}

                        <div className="anwesenheit-view-switch">

                            <button
                                type="button"
                                className={
                                    anzeigeModus ===
                                    'gesamt'
                                        ? 'active'
                                        : ''
                                }
                                onClick={() =>
                                    setAnzeigeModus(
                                        'gesamt'
                                    )
                                }
                            >
                                Gesamt
                            </button>

                            <button
                                type="button"
                                className={
                                    anzeigeModus ===
                                    'kurse'
                                        ? 'active'
                                        : ''
                                }
                                onClick={() =>
                                    setAnzeigeModus(
                                        'kurse'
                                    )
                                }
                            >
                                Nach Kursen
                            </button>

                            <button
                                type="button"
                                className={
                                    anzeigeModus ===
                                    'kinder'
                                        ? 'active'
                                        : ''
                                }
                                onClick={() =>
                                    setAnzeigeModus(
                                        'kinder'
                                    )
                                }
                            >
                                Nach Kindern
                            </button>

                        </div>

                        {filteredAnwesenheiten.length ===
                        0 ? (

                            <div className="anwesenheit-empty">

                                Keine Anwesenheiten für den ausgewählten Zeitraum gefunden.

                            </div>

                        ) : (

                            <>

                                {/* GESAMT */}

                                {anzeigeModus ===
                                    'gesamt' && (

                                        <div className="anwesenheit-table-scroll">

                                            <table className="anwesenheit-table anwesenheit-history-table">

                                                <thead>

                                                <tr>
                                                    <th>Datum</th>
                                                    <th>Schüler</th>
                                                    <th>Kurs</th>
                                                    <th>Status</th>
                                                    <th>Bemerkung</th>
                                                    <th>Aktionen</th>
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
                                                                {anwesenheit.datum}
                                                            </td>

                                                            <td>
                                                                {formatStudentName(
                                                                    anwesenheit.student
                                                                )}
                                                            </td>

                                                            <td>
                                                                {anwesenheit.kurs?.name ||
                                                                    '–'}
                                                            </td>

                                                            {editingId ===
                                                            anwesenheit.id ? (

                                                                <>

                                                                    <td>

                                                                        <select
                                                                            className="status-select"
                                                                            value={
                                                                                editStatus
                                                                            }
                                                                            onChange={(event) =>
                                                                                setEditStatus(
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                        >

                                                                            <option value="ANWESEND">
                                                                                Anwesend
                                                                            </option>

                                                                            <option value="FEHLT">
                                                                                Fehlt
                                                                            </option>

                                                                            <option value="ENTSCHULDIGT">
                                                                                Entschuldigt
                                                                            </option>

                                                                        </select>

                                                                    </td>

                                                                    <td>

                                                                        <input
                                                                            className="bemerkung-input"
                                                                            value={
                                                                                editBemerkung
                                                                            }
                                                                            onChange={(event) =>
                                                                                setEditBemerkung(
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                        />

                                                                    </td>

                                                                    <td className="anwesenheit-action-cell">

                                                                        <button
                                                                            type="button"
                                                                            className="btn-save"
                                                                            onClick={() =>
                                                                                handleEditSave(
                                                                                    anwesenheit
                                                                                )
                                                                            }
                                                                        >
                                                                            Speichern
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            className="btn-cancel"
                                                                            onClick={
                                                                                handleEditCancel
                                                                            }
                                                                        >
                                                                            Abbrechen
                                                                        </button>

                                                                    </td>

                                                                </>

                                                            ) : (

                                                                <>

                                                                    <td>
                                                                        {formatStatus(
                                                                            anwesenheit.status
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {anwesenheit.bemerkung ||
                                                                            '–'}
                                                                    </td>

                                                                    <td className="anwesenheit-action-cell">

                                                                        <button
                                                                            type="button"
                                                                            className="btn-edit"
                                                                            onClick={() =>
                                                                                handleEditStart(
                                                                                    anwesenheit
                                                                                )
                                                                            }
                                                                        >
                                                                            Bearbeiten
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            className="btn-delete"
                                                                            onClick={() =>
                                                                                handleDelete(
                                                                                    anwesenheit.id
                                                                                )
                                                                            }
                                                                        >
                                                                            Löschen
                                                                        </button>

                                                                    </td>

                                                                </>

                                                            )}

                                                        </tr>

                                                    )
                                                )}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                {/* NACH KURSEN */}

                                {anzeigeModus ===
                                    'kurse' && (

                                        <div className="anwesenheit-group-list">

                                            {gruppiertNachKurs.map(
                                                (gruppe) => (

                                                    <div
                                                        key={
                                                            gruppe.kurs?.id ??
                                                            'ohne-kurs'
                                                        }
                                                        className="anwesenheit-group"
                                                    >

                                                        <div className="anwesenheit-group-header">

                                                            <h3>
                                                                {gruppe.kurs?.name ||
                                                                    'Ohne Kurs'}
                                                            </h3>

                                                            <span>
                                                        {gruppe.eintraege.length}{' '}
                                                                Einträge
                                                    </span>

                                                        </div>

                                                        <div className="anwesenheit-table-scroll">

                                                            <table className="anwesenheit-table">

                                                                <thead>

                                                                <tr>
                                                                    <th>Datum</th>
                                                                    <th>Schüler</th>
                                                                    <th>Status</th>
                                                                    <th>Bemerkung</th>
                                                                </tr>

                                                                </thead>

                                                                <tbody>

                                                                {gruppe.eintraege.map(
                                                                    (anwesenheit) => (

                                                                        <tr
                                                                            key={
                                                                                anwesenheit.id
                                                                            }
                                                                        >

                                                                            <td>
                                                                                {anwesenheit.datum}
                                                                            </td>

                                                                            <td>
                                                                                {formatStudentName(
                                                                                    anwesenheit.student
                                                                                )}
                                                                            </td>

                                                                            <td>
                                                                                {formatStatus(
                                                                                    anwesenheit.status
                                                                                )}
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

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    )}

                                {/* NACH KINDERN */}

                                {anzeigeModus ===
                                    'kinder' && (

                                        <div className="anwesenheit-group-list">

                                            {gruppiertNachKind.map(
                                                (gruppe) => (

                                                    <div
                                                        key={
                                                            gruppe.student?.id ??
                                                            'ohne-student'
                                                        }
                                                        className="anwesenheit-group"
                                                    >

                                                        <div className="anwesenheit-group-header">

                                                            <h3>
                                                                {formatStudentName(
                                                                    gruppe.student
                                                                )}
                                                            </h3>

                                                            <span>
                                                        {gruppe.eintraege.length}{' '}
                                                                Einträge
                                                    </span>

                                                        </div>

                                                        <div className="anwesenheit-table-scroll">

                                                            <table className="anwesenheit-table">

                                                                <thead>

                                                                <tr>
                                                                    <th>Datum</th>
                                                                    <th>Kurs</th>
                                                                    <th>Status</th>
                                                                    <th>Bemerkung</th>
                                                                </tr>

                                                                </thead>

                                                                <tbody>

                                                                {gruppe.eintraege.map(
                                                                    (anwesenheit) => (

                                                                        <tr
                                                                            key={
                                                                                anwesenheit.id
                                                                            }
                                                                        >

                                                                            <td>
                                                                                {anwesenheit.datum}
                                                                            </td>

                                                                            <td>
                                                                                {anwesenheit.kurs?.name ||
                                                                                    '–'}
                                                                            </td>

                                                                            <td>
                                                                                {formatStatus(
                                                                                    anwesenheit.status
                                                                                )}
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

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    )}

                            </>

                        )}

                    </section>

                )}

        </div>
    );
}

export default AnwesenheitPage;