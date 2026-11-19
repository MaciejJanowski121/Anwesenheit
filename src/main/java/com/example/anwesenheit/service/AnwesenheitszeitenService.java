package com.example.anwesenheit.service;

import com.example.anwesenheit.dto.AnwesenheitszeitenResponse;
import com.example.anwesenheit.model.*;
import com.example.anwesenheit.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnwesenheitszeitenService {

    private final StudentRepository studentRepository;

    private final KlasseRepository klasseRepository;

    private final KlassenAnwesenheitszeitRepository
            klassenAnwesenheitszeitRepository;

    private final BuchungRepository buchungRepository;

    private final KursRepository kursRepository;

    private final AngebotRepository angebotRepository;

    private final AngebotTeilnahmeRepository
            angebotTeilnahmeRepository;

    private final TagesAnwesenheitRepository
            tagesAnwesenheitRepository;


    /* =====================================================
       KONFIGURATION
       ===================================================== */

    private static final LocalTime STARTZEIT =
            LocalTime.of(8, 0);

    private static final LocalTime ENDZEIT =
            LocalTime.of(16, 0);

    private static final int INTERVALL_MINUTEN = 15;


    /* =====================================================
       INTERNE DATENSTRUKTUREN
       ===================================================== */

    private record UnterrichtsKey(

            Long klasseId,

            Integer jahrgang,

            DayOfWeek wochentag

    ) {
    }


    private record SchuelerZeitplan(

            Long studentId,

            LocalTime beginn,

            LocalTime ende,

            TagesAnwesenheit anwesenheit

    ) {
    }


    private record FilterErgebnis(

            List<Student> students,

            String filterName

    ) {
    }


    /* =====================================================
       HAUPTMETHODE
       ===================================================== */

    public AnwesenheitszeitenResponse berechneAnwesenheitszeiten(

            LocalDate datum,

            AnwesenheitszeitenFilter filterTyp,

            Long filterId

    ) {

        if (datum == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Das Datum muss angegeben werden."
            );
        }

        if (filterTyp == null) {

            filterTyp = AnwesenheitszeitenFilter.ALLE;
        }

        List<String> hinweise =
                new ArrayList<>();


        /* =================================================
           SCHÜLER FILTERN
           ================================================= */

        FilterErgebnis filterErgebnis =
                filterStudents(
                        datum,
                        filterTyp,
                        filterId,
                        hinweise
                );

        List<Student> students =
                filterErgebnis.students();


        /* =================================================
           WOCHENENDE
           ================================================= */

        if (
                datum.getDayOfWeek() == DayOfWeek.SATURDAY ||
                        datum.getDayOfWeek() == DayOfWeek.SUNDAY
        ) {

            hinweise.add(
                    "Für Wochenenden sind keine regulären Unterrichtszeiten vorgesehen."
            );

            return new AnwesenheitszeitenResponse(

                    datum,

                    filterTyp.name(),

                    filterId,

                    filterErgebnis.filterName(),

                    students.size(),

                    0,

                    erstelleLeereIntervalle(),

                    hinweise
            );
        }


        /* =================================================
           UNTERRICHTSZEITEN LADEN
           ================================================= */

        Map<UnterrichtsKey, KlassenAnwesenheitszeit>
                unterrichtszeiten =
                ladeUnterrichtszeiten(
                        datum.getDayOfWeek()
                );


        /* =================================================
           ANA BUCHUNGEN LADEN
           ================================================= */

        Map<Long, List<Buchung>> buchungenByStudent =
                ladeBuchungen(datum);


        /* =================================================
           TAGESANWESENHEITEN LADEN
           ================================================= */

        Map<Long, TagesAnwesenheit> anwesenheiten =
                tagesAnwesenheitRepository
                        .findByDatum(datum)
                        .stream()
                        .filter(eintrag ->
                                eintrag.getStudent() != null
                        )
                        .collect(
                                Collectors.toMap(

                                        eintrag ->
                                                eintrag
                                                        .getStudent()
                                                        .getId(),

                                        eintrag -> eintrag,

                                        (first, second) -> first
                                )
                        );


        /* =================================================
           ZEITPLÄNE ERSTELLEN
           ================================================= */

        List<SchuelerZeitplan> zeitplaene =
                new ArrayList<>();

        int anzahlOhneUnterrichtszeiten = 0;

        int ungueltigeAnaZeiten = 0;


        for (Student student : students) {

            if (
                    student.getKlasseEntity() == null ||
                            student.getJahrgang() == null
            ) {

                anzahlOhneUnterrichtszeiten++;

                continue;
            }

            UnterrichtsKey key =
                    new UnterrichtsKey(

                            student
                                    .getKlasseEntity()
                                    .getId(),

                            student.getJahrgang(),

                            datum.getDayOfWeek()
                    );

            KlassenAnwesenheitszeit unterricht =
                    unterrichtszeiten.get(key);


            /* =============================================
               UNTERRICHTSZEITEN PRÜFEN
               ============================================= */

            if (
                    unterricht == null ||
                            unterricht.getBeginn() == null ||
                            unterricht.getEnde() == null ||
                            !unterricht.getBeginn()
                                    .isBefore(unterricht.getEnde())
            ) {

                anzahlOhneUnterrichtszeiten++;

                continue;
            }

            LocalTime beginn =
                    unterricht.getBeginn();

            LocalTime ende =
                    unterricht.getEnde();


            /* =============================================
               ANA ZEITEN BERÜCKSICHTIGEN
               ============================================= */

            List<Buchung> anaBuchungen =
                    buchungenByStudent.getOrDefault(

                            student.getId(),

                            Collections.emptyList()
                    );

            for (Buchung buchung : anaBuchungen) {

                Kurs kurs =
                        buchung.getKurs();

                LocalTime anaBeginn =
                        parseTime(
                                kurs.getUhrzeit()
                        );

                LocalTime anaEnde =
                        parseTime(
                                kurs.getUhrzeitEnde()
                        );

                if (
                        anaBeginn == null ||
                                anaEnde == null ||
                                !anaBeginn.isBefore(anaEnde)
                ) {

                    ungueltigeAnaZeiten++;

                    continue;
                }

                /*
                 * Falls ANA vor dem Unterricht beginnt,
                 * wird auch diese Zeit berücksichtigt.
                 */

                if (anaBeginn.isBefore(beginn)) {

                    beginn = anaBeginn;
                }

                /*
                 * Die Anwesenheit wird bis zum Ende
                 * des letzten ANA-Angebots verlängert.
                 *
                 * Die Mittagspause zwischen Unterricht
                 * und ANA bleibt dadurch enthalten.
                 */

                if (anaEnde.isAfter(ende)) {

                    ende = anaEnde;
                }
            }


            /* =============================================
               TAGESANWESENHEIT
               ============================================= */

            TagesAnwesenheit anwesenheit =
                    anwesenheiten.get(
                            student.getId()
                    );


            zeitplaene.add(

                    new SchuelerZeitplan(

                            student.getId(),

                            beginn,

                            ende,

                            anwesenheit
                    )
            );
        }


        /* =================================================
           HINWEISE
           ================================================= */

        if (anzahlOhneUnterrichtszeiten > 0) {

            hinweise.add(

                    "Für " +
                            anzahlOhneUnterrichtszeiten +
                            " Schüler fehlen gültige Unterrichtszeiten. " +
                            "Diese Schüler wurden bei der Berechnung " +
                            "nicht berücksichtigt."
            );
        }

        if (ungueltigeAnaZeiten > 0) {

            hinweise.add(

                    ungueltigeAnaZeiten +
                            " ANA-Buchungen konnten aufgrund " +
                            "fehlender oder ungültiger Uhrzeiten " +
                            "nicht vollständig berücksichtigt werden."
            );
        }


        /* =================================================
           ZEITINTERVALLE BERECHNEN
           ================================================= */

        List<AnwesenheitszeitenResponse.Zeitintervall>
                zeitintervalle =
                berechneIntervalle(zeitplaene);


        /* =================================================
           RESPONSE
           ================================================= */

        return new AnwesenheitszeitenResponse(

                datum,

                filterTyp.name(),

                filterId,

                filterErgebnis.filterName(),

                students.size(),

                anzahlOhneUnterrichtszeiten,

                zeitintervalle,

                hinweise
        );
    }


    /* =====================================================
       SCHÜLER FILTERN
       ===================================================== */

    private FilterErgebnis filterStudents(

            LocalDate datum,

            AnwesenheitszeitenFilter filterTyp,

            Long filterId,

            List<String> hinweise

    ) {

        return switch (filterTyp) {

            case ALLE -> new FilterErgebnis(

                    studentRepository.findAll(),

                    "Alle Schüler"
            );

            case KLASSE -> filterKlasse(
                    filterId
            );

            case ANGEBOT -> filterAngebot(

                    datum,

                    filterId,

                    hinweise
            );

            case ANA -> filterAna(

                    datum,

                    filterId,

                    hinweise
            );
        };
    }


    /* =====================================================
       FILTER KLASSE
       ===================================================== */

    private FilterErgebnis filterKlasse(
            Long klasseId
    ) {

        validateFilterId(klasseId);

        Klasse klasse =
                klasseRepository
                        .findById(klasseId)
                        .orElseThrow(() ->

                                new ResponseStatusException(

                                        HttpStatus.NOT_FOUND,

                                        "Die Klasse wurde nicht gefunden."
                                )
                        );

        List<Student> students =
                studentRepository
                        .findAll()
                        .stream()
                        .filter(student ->

                                student.getKlasseEntity() != null &&

                                        Objects.equals(

                                                student
                                                        .getKlasseEntity()
                                                        .getId(),

                                                klasseId
                                        )
                        )
                        .toList();

        return new FilterErgebnis(

                students,

                klasse.getName()
        );
    }


    /* =====================================================
       FILTER ANGEBOT
       ===================================================== */

    private FilterErgebnis filterAngebot(

            LocalDate datum,

            Long angebotId,

            List<String> hinweise

    ) {

        validateFilterId(angebotId);

        Angebot angebot =
                angebotRepository
                        .findById(angebotId)
                        .orElseThrow(() ->

                                new ResponseStatusException(

                                        HttpStatus.NOT_FOUND,

                                        "Das Angebot wurde nicht gefunden."
                                )
                        );

        if (
                !matchesWochentag(
                        angebot.getWochentag(),
                        datum.getDayOfWeek()
                )
        ) {

            hinweise.add(

                    "Das ausgewählte Angebot findet " +
                            "am gewählten Wochentag nicht statt."
            );

            return new FilterErgebnis(

                    Collections.emptyList(),

                    angebot.getName()
            );
        }

        List<Student> students =
                angebotTeilnahmeRepository
                        .findByAngebotId(angebotId)
                        .stream()
                        .map(
                                AngebotTeilnahme::getStudent
                        )
                        .filter(Objects::nonNull)
                        .toList();

        return new FilterErgebnis(

                distinctStudents(students),

                angebot.getName()
        );
    }


    /* =====================================================
       FILTER ANA
       ===================================================== */

    private FilterErgebnis filterAna(

            LocalDate datum,

            Long kursId,

            List<String> hinweise

    ) {

        validateFilterId(kursId);

        Kurs kurs =
                kursRepository
                        .findById(kursId)
                        .orElseThrow(() ->

                                new ResponseStatusException(

                                        HttpStatus.NOT_FOUND,

                                        "Das ANA-Angebot wurde nicht gefunden."
                                )
                        );

        if (
                !matchesWochentag(

                        kurs.getWochentag(),

                        datum.getDayOfWeek()
                )
        ) {

            hinweise.add(

                    "Das ausgewählte ANA-Angebot findet " +
                            "am gewählten Wochentag nicht statt."
            );

            return new FilterErgebnis(

                    Collections.emptyList(),

                    kurs.getName()
            );
        }

        List<Student> students =
                buchungRepository
                        .findByKursId(kursId)
                        .stream()
                        .map(Buchung::getStudent)
                        .filter(Objects::nonNull)
                        .toList();

        return new FilterErgebnis(

                distinctStudents(students),

                kurs.getName()
        );
    }


    /* =====================================================
       UNTERRICHTSZEITEN LADEN
       ===================================================== */

    private Map<UnterrichtsKey, KlassenAnwesenheitszeit>
    ladeUnterrichtszeiten(
            DayOfWeek wochentag
    ) {

        return klassenAnwesenheitszeitRepository

                .findAll()

                .stream()

                .filter(zeit ->

                        zeit.getWochentag() == wochentag &&

                                zeit.getKlasse() != null
                )

                .collect(

                        Collectors.toMap(

                                zeit -> new UnterrichtsKey(

                                        zeit
                                                .getKlasse()
                                                .getId(),

                                        zeit.getJahrgang(),

                                        zeit.getWochentag()
                                ),

                                zeit -> zeit,

                                (first, second) -> first
                        )
                );
    }


    /* =====================================================
       ANA BUCHUNGEN LADEN
       ===================================================== */

    private Map<Long, List<Buchung>> ladeBuchungen(
            LocalDate datum
    ) {

        return buchungRepository

                .findAll()

                .stream()

                .filter(buchung ->

                        buchung.getStudent() != null &&

                                buchung.getKurs() != null
                )

                .filter(buchung ->

                        matchesWochentag(

                                buchung
                                        .getKurs()
                                        .getWochentag(),

                                datum.getDayOfWeek()
                        )
                )

                .collect(

                        Collectors.groupingBy(

                                buchung ->
                                        buchung
                                                .getStudent()
                                                .getId()
                        )
                );
    }


    /* =====================================================
       INTERVALLE BERECHNEN
       ===================================================== */

    private List<AnwesenheitszeitenResponse.Zeitintervall>
    berechneIntervalle(

            List<SchuelerZeitplan> zeitplaene

    ) {

        List<AnwesenheitszeitenResponse.Zeitintervall>
                result =
                new ArrayList<>();

        LocalTime von =
                STARTZEIT;

        while (von.isBefore(ENDZEIT)) {

            LocalTime bis =
                    von.plusMinutes(
                            INTERVALL_MINUTEN
                    );

            int plan = 0;

            int soll = 0;

            int ist = 0;

            int ungeprueft = 0;


            for (SchuelerZeitplan zeitplan : zeitplaene) {


                /* =========================================
                   PLAN
                   ========================================= */

                if (
                        !istGeplantAnwesend(
                                zeitplan,
                                von
                        )
                ) {

                    continue;
                }

                plan++;


                /* =========================================
                   ABWESENHEIT
                   ========================================= */

                if (
                        istAbwesend(

                                zeitplan.anwesenheit(),

                                von
                        )
                ) {

                    continue;
                }


                /* =========================================
                   SOLL
                   ========================================= */

                soll++;


                /* =========================================
                   IST
                   ========================================= */

                TagesAnwesenheit anwesenheit =
                        zeitplan.anwesenheit();

                if (
                        anwesenheit != null &&

                                "ANWESEND".equalsIgnoreCase(
                                        anwesenheit.getStatus()
                                )
                ) {

                    ist++;

                } else {

                    ungeprueft++;
                }
            }


            result.add(

                    new AnwesenheitszeitenResponse.Zeitintervall(

                            von,

                            bis,

                            plan,

                            soll,

                            ist,

                            ungeprueft
                    )
            );

            von = bis;
        }

        return result;
    }


    /* =====================================================
       GEPLANTE ANWESENHEIT
       ===================================================== */

    private boolean istGeplantAnwesend(

            SchuelerZeitplan zeitplan,

            LocalTime uhrzeit

    ) {

        return

                !uhrzeit.isBefore(
                        zeitplan.beginn()
                )

                        &&

                        uhrzeit.isBefore(
                                zeitplan.ende()
                        );
    }


    /* =====================================================
       ABWESENHEIT PRÜFEN
       ===================================================== */

    private boolean istAbwesend(

            TagesAnwesenheit anwesenheit,

            LocalTime uhrzeit

    ) {

        if (anwesenheit == null) {

            return false;
        }


        /* =================================================
           GANZTÄGIG FEHLEND
           ================================================= */

        if (
                "FEHLT".equalsIgnoreCase(
                        anwesenheit.getStatus()
                )
        ) {

            return true;
        }


        LocalTime ab =
                anwesenheit.getAbwesendAb();

        LocalTime bis =
                anwesenheit.getAbwesendBis();


        /* =================================================
           ABWESEND AB UND BIS
           ================================================= */

        if (ab != null && bis != null) {

            return

                    !uhrzeit.isBefore(ab)

                            &&

                            uhrzeit.isBefore(bis);
        }


        /* =================================================
           ABWESEND AB
           ================================================= */

        if (ab != null) {

            return !uhrzeit.isBefore(ab);
        }


        /* =================================================
           ABWESEND BIS
           ================================================= */

        if (bis != null) {

            return uhrzeit.isBefore(bis);
        }


        return false;
    }


    /* =====================================================
       LEERE INTERVALLE
       ===================================================== */

    private List<AnwesenheitszeitenResponse.Zeitintervall>
    erstelleLeereIntervalle() {

        return berechneIntervalle(
                Collections.emptyList()
        );
    }


    /* =====================================================
       WOCHENTAG VERGLEICHEN
       ===================================================== */

    private boolean matchesWochentag(

            String value,

            DayOfWeek wochentag

    ) {

        if (value == null) {

            return false;
        }

        String normalized =
                value
                        .trim()
                        .toLowerCase(Locale.ROOT)
                        .replace(".", "");

        DayOfWeek parsed = switch (normalized) {

            case "montag", "mo", "monday", "mon" ->
                    DayOfWeek.MONDAY;

            case "dienstag", "di", "tuesday", "tue" ->
                    DayOfWeek.TUESDAY;

            case "mittwoch", "mi", "wednesday", "wed" ->
                    DayOfWeek.WEDNESDAY;

            case "donnerstag", "do", "thursday", "thu" ->
                    DayOfWeek.THURSDAY;

            case "freitag", "fr", "friday", "fri" ->
                    DayOfWeek.FRIDAY;

            case "samstag", "sa", "saturday", "sat" ->
                    DayOfWeek.SATURDAY;

            case "sonntag", "so", "sunday", "sun" ->
                    DayOfWeek.SUNDAY;

            default -> null;
        };

        return parsed == wochentag;
    }


    /* =====================================================
       UHRZEIT KONVERTIEREN
       ===================================================== */

    private LocalTime parseTime(
            String value
    ) {

        if (
                value == null ||
                        value.isBlank()
        ) {

            return null;
        }

        try {

            String normalized =
                    value.trim();

            /*
             * Unterstützt beispielsweise:
             *
             * 8:00
             * 08:00
             * 08:00:00
             */

            if (
                    normalized.matches(
                            "^\\d:\\d{2}(:\\d{2})?$"
                    )
            ) {

                normalized =
                        "0" + normalized;
            }

            return LocalTime.parse(
                    normalized
            );

        } catch (DateTimeParseException exception) {

            return null;
        }
    }


    /* =====================================================
       DOPPELTE SCHÜLER ENTFERNEN
       ===================================================== */

    private List<Student> distinctStudents(

            List<Student> students

    ) {

        Map<Long, Student> result =
                new LinkedHashMap<>();

        for (Student student : students) {

            result.putIfAbsent(

                    student.getId(),

                    student
            );
        }

        return new ArrayList<>(
                result.values()
        );
    }


    /* =====================================================
       FILTER ID VALIDIEREN
       ===================================================== */

    private void validateFilterId(
            Long filterId
    ) {

        if (
                filterId == null ||
                        filterId <= 0
        ) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Für den ausgewählten Filter " +
                            "muss eine gültige ID angegeben werden."
            );
        }
    }
}