/* =====================================================
   ANWESENHEIT STATUS
   ===================================================== */

export const ANWESENHEIT_STATUS = {
    ANWESEND: 'ANWESEND',
    FEHLT: 'FEHLT'
};

/* =====================================================
   FILTERMODI
   ===================================================== */

export const FILTER_MODES = [
    { key: 'klasse', label: 'Klasse' },
    { key: 'angebote', label: 'Angebote' },
    { key: 'ana', label: 'ANA' },
    { key: 'alle', label: 'Alle Schüler' }
];

/* =====================================================
   HEUTIGES DATUM - LOKALE ZEIT
   ===================================================== */

export const getToday = () => {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        now.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/* =====================================================
   WOCHENTAG
   ===================================================== */

export const getWochentag = (datum) => {

    if (!datum) {
        return '';
    }

    const date = new Date(
        `${datum}T12:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleDateString(
        'de-DE',
        {
            weekday: 'long'
        }
    );
};

/* =====================================================
   WOCHENTAG NORMALISIEREN
   ===================================================== */

export const normalizeWochentag = (value) => {

    const normalized = String(
        value ?? ''
    ).trim().toLowerCase();

    const mapping = {
        monday: 'montag',
        tuesday: 'dienstag',
        wednesday: 'mittwoch',
        thursday: 'donnerstag',
        friday: 'freitag',
        saturday: 'samstag',
        sunday: 'sonntag',
        mo: 'montag',
        di: 'dienstag',
        mi: 'mittwoch',
        do: 'donnerstag',
        fr: 'freitag',
        sa: 'samstag',
        so: 'sonntag'
    };

    return mapping[normalized] || normalized;
};

/* =====================================================
   WOCHENTAG VERGLEICHEN
   ===================================================== */

export const matchesWochentag = (
    value,
    datum
) => {

    return normalizeWochentag(value) ===
        normalizeWochentag(
            getWochentag(datum)
        );
};

/* =====================================================
   UHRZEITEN 08:00 - 16:00
   15 MINUTEN
   ===================================================== */

export const TIME_OPTIONS = Array.from(
    { length: 33 },
    (_, index) => {

        const minutes = 8 * 60 + index * 15;

        const hours = Math.floor(
            minutes / 60
        );

        const remainingMinutes =
            minutes % 60;

        return (
            String(hours).padStart(2, '0') +
            ':' +
            String(remainingMinutes).padStart(2, '0')
        );
    }
);

/* =====================================================
   UHRZEIT FORMATIEREN
   ===================================================== */

export const formatTime = (value) => {

    if (!value) {
        return '';
    }

    return String(value).slice(0, 5);
};

/* =====================================================
   DATUM FORMATIEREN
   ===================================================== */

export const formatDatum = (datum) => {

    if (!datum) {
        return '–';
    }

    const date = new Date(
        `${datum}T12:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return datum;
    }

    return date.toLocaleDateString('de-DE');
};

/* =====================================================
   SCHÜLERNAME
   ===================================================== */

export const getStudentName = (student) => {

    if (!student) {
        return '–';
    }

    return [
        student.nachname,
        student.vorname
    ]
        .filter(Boolean)
        .join(', ') || '–';
};

/* =====================================================
   SCHÜLER SORTIEREN
   ===================================================== */

export const compareStudents = (a, b) => {

    const nachname = String(
        a.nachname ?? ''
    ).localeCompare(
        String(b.nachname ?? ''),
        'de',
        {
            sensitivity: 'base'
        }
    );

    if (nachname !== 0) {
        return nachname;
    }

    return String(
        a.vorname ?? ''
    ).localeCompare(
        String(b.vorname ?? ''),
        'de',
        {
            sensitivity: 'base'
        }
    );
};

/* =====================================================
   KLASSENFARBE
   ===================================================== */

export const getKlasseClassName = (klasse) => {

    if (!klasse) {
        return '';
    }

    return `klasse-${String(klasse)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}`;
};

/* =====================================================
   LEERE ANWESENHEIT
   ===================================================== */

export const createEmptyAnwesenheit = () => ({

    status: '',
    abwesendAb: '',
    abwesendBis: '',
    grundAbwesenheit: '',
    anaAnwesenheitskontrolle: false,
    bemerkung: ''
});

/* =====================================================
   GESPEICHERTE ANWESENHEIT NORMALISIEREN
   ===================================================== */

export const normalizeAnwesenheit = (
    anwesenheit
) => ({

    status:
        anwesenheit?.status || '',

    abwesendAb:
        formatTime(anwesenheit?.abwesendAb),

    abwesendBis:
        formatTime(anwesenheit?.abwesendBis),

    grundAbwesenheit:
        anwesenheit?.grundAbwesenheit || '',

    anaAnwesenheitskontrolle:
        anwesenheit?.anaAnwesenheitskontrolle === true,

    bemerkung:
        anwesenheit?.bemerkung || ''
});

/* =====================================================
   API PAYLOAD
   ===================================================== */

export const createAnwesenheitPayload = (
    datum,
    anwesenheit
) => ({

    datum,

    status:
        anwesenheit.status || null,

    abwesendAb:
        anwesenheit.abwesendAb || null,

    abwesendBis:
        anwesenheit.abwesendBis || null,

    grundAbwesenheit:
        anwesenheit.grundAbwesenheit || null,

    anaAnwesenheitskontrolle:
        anwesenheit.anaAnwesenheitskontrolle === true,

    bemerkung:
        anwesenheit.bemerkung || null
});

/* =====================================================
   GEÄNDERTE FELDER ERMITTELN
   ===================================================== */

export const getChangedFields = (
    original,
    current
) => {

    const previous = normalizeAnwesenheit(
        original
    );

    const next = normalizeAnwesenheit(
        current
    );

    const changes = {};

    Object.keys(next).forEach(key => {

        if (previous[key] !== next[key]) {

            changes[key] =
                next[key] === ''
                    ? null
                    : next[key];
        }
    });

    return changes;
};

/* =====================================================
   ANWESENHEIT VALIDIEREN
   ===================================================== */

export const validateAnwesenheit = (
    anwesenheit
) => {

    if (
        anwesenheit.status &&
        !Object.values(
            ANWESENHEIT_STATUS
        ).includes(anwesenheit.status)
    ) {

        return 'Ungültiger Anwesenheitsstatus.';
    }

    if (
        anwesenheit.status ===
        ANWESENHEIT_STATUS.FEHLT &&
        (
            anwesenheit.abwesendAb ||
            anwesenheit.abwesendBis
        )
    ) {

        return 'Bei vollständiger Abwesenheit sind keine Abwesenheitszeiten erforderlich.';
    }

    if (
        anwesenheit.abwesendAb &&
        !TIME_OPTIONS.includes(
            anwesenheit.abwesendAb
        )
    ) {

        return 'Ungültige Uhrzeit für Abwesend ab.';
    }

    if (
        anwesenheit.abwesendBis &&
        !TIME_OPTIONS.includes(
            anwesenheit.abwesendBis
        )
    ) {

        return 'Ungültige Uhrzeit für Abwesend bis.';
    }

    if (
        anwesenheit.abwesendAb &&
        anwesenheit.abwesendBis &&
        anwesenheit.abwesendAb >=
        anwesenheit.abwesendBis
    ) {

        return 'Abwesend ab muss vor Abwesend bis liegen.';
    }

    if (
        String(
            anwesenheit.grundAbwesenheit ?? ''
        ).length > 50
    ) {

        return 'Der Abwesenheitsgrund darf maximal 50 Zeichen enthalten.';
    }

    return null;
};

/* =====================================================
   API FEHLERMELDUNG
   ===================================================== */

export const getErrorMessage = (
    error,
    fallback = 'Ein Fehler ist aufgetreten.'
) => {

    return (
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
};