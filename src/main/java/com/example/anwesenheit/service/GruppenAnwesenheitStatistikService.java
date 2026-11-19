package com.example.anwesenheit.service;

import com.example.anwesenheit.dto.GruppenAnwesenheitStatistikResponse;

import com.example.anwesenheit.model.Angebot;
import com.example.anwesenheit.model.AngebotTeilnahme;
import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.TagesAnwesenheit;

import com.example.anwesenheit.repository.AngebotRepository;
import com.example.anwesenheit.repository.AngebotTeilnahmeRepository;
import com.example.anwesenheit.repository.BuchungRepository;
import com.example.anwesenheit.repository.KursRepository;
import com.example.anwesenheit.repository.TagesAnwesenheitRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class GruppenAnwesenheitStatistikService {

    private final KursRepository kursRepository;

    private final BuchungRepository buchungRepository;

    private final AngebotRepository angebotRepository;

    private final AngebotTeilnahmeRepository
            angebotTeilnahmeRepository;

    private final TagesAnwesenheitRepository
            tagesAnwesenheitRepository;


    /* =====================================================
       KONSTRUKTOR
       ===================================================== */

    public GruppenAnwesenheitStatistikService(

            KursRepository kursRepository,

            BuchungRepository buchungRepository,

            AngebotRepository angebotRepository,

            AngebotTeilnahmeRepository
                    angebotTeilnahmeRepository,

            TagesAnwesenheitRepository
                    tagesAnwesenheitRepository

    ) {

        this.kursRepository =
                kursRepository;

        this.buchungRepository =
                buchungRepository;

        this.angebotRepository =
                angebotRepository;

        this.angebotTeilnahmeRepository =
                angebotTeilnahmeRepository;

        this.tagesAnwesenheitRepository =
                tagesAnwesenheitRepository;
    }


    /* =====================================================
       INTERNER ANWESENHEITSSTATUS
       ===================================================== */

    private enum GruppenStatus {

        ANWESEND,

        FEHLEND,

        TEILWEISE_ABWESEND,

        NICHT_ERFASST
    }


    /* =====================================================
       GRUPPENZEITEN
       ===================================================== */

    private record GruppenZeiten(

            DayOfWeek wochentag,

            LocalTime beginn,

            LocalTime ende

    ) {}


    /* =====================================================
       TEILNEHMER
       ===================================================== */

    private record Teilnehmer(

            Long studentId

    ) {}


    /* =====================================================
       ANA – STATISTIK
       ===================================================== */

    public List<GruppenAnwesenheitStatistikResponse>
    getAnaStatistik(Long kursId) {

        Kurs kurs = kursRepository
                .findById(kursId)
                .orElseThrow(() ->

                        new ResponseStatusException(

                                HttpStatus.NOT_FOUND,

                                "ANA-Kurs nicht gefunden."

                        )
                );


        GruppenZeiten gruppenZeiten =
                createGruppenZeiten(

                        kurs.getWochentag(),

                        kurs.getUhrzeit(),

                        kurs.getUhrzeitEnde()

                );


        List<Buchung> buchungen =
                buchungRepository.findByKursId(
                        kursId
                );


        List<Teilnehmer> teilnehmer =
                buchungen.stream()

                        .filter(Objects::nonNull)

                        .filter(buchung ->
                                buchung.getStudent() != null
                        )

                        .map(buchung ->

                                new Teilnehmer(

                                        buchung.getStudent()
                                                .getId()

                                )

                        )

                        .toList();


        return berechneStatistik(

                teilnehmer,

                gruppenZeiten

        );
    }


    /* =====================================================
       ANGEBOT – STATISTIK
       ===================================================== */

    public List<GruppenAnwesenheitStatistikResponse>
    getAngebotStatistik(Long angebotId) {

        Angebot angebot = angebotRepository

                .findById(angebotId)

                .orElseThrow(() ->

                        new ResponseStatusException(

                                HttpStatus.NOT_FOUND,

                                "Angebot nicht gefunden."

                        )
                );


        GruppenZeiten gruppenZeiten =
                createGruppenZeiten(

                        angebot.getWochentag(),

                        angebot.getBeginn(),

                        angebot.getEnde()

                );


        List<AngebotTeilnahme> teilnahmen =
                angebotTeilnahmeRepository

                        .findByAngebotId(
                                angebotId
                        );


        List<Teilnehmer> teilnehmer =
                teilnahmen.stream()

                        .filter(Objects::nonNull)

                        .filter(teilnahme ->
                                teilnahme.getStudent() != null
                        )

                        .map(teilnahme ->

                                new Teilnehmer(

                                        teilnahme.getStudent()
                                                .getId()

                                )

                        )

                        .toList();


        return berechneStatistik(

                teilnehmer,

                gruppenZeiten

        );
    }


    /* =====================================================
       GEMEINSAME STATISTIKBERECHNUNG
       ===================================================== */

    private List<GruppenAnwesenheitStatistikResponse>
    berechneStatistik(

            List<Teilnehmer> teilnehmer,

            GruppenZeiten gruppenZeiten

    ) {

        if (teilnehmer.isEmpty()) {

            return List.of();
        }


        /*
         * Doppelte Schüler vermeiden.
         */

        Map<Long, Teilnehmer> teilnehmerMap =
                new LinkedHashMap<>();


        for (Teilnehmer person : teilnehmer) {

            if (person.studentId() != null) {

                teilnehmerMap.putIfAbsent(

                        person.studentId(),

                        person

                );
            }
        }


        if (teilnehmerMap.isEmpty()) {

            return List.of();
        }


        List<Long> studentIds =
                new ArrayList<>(
                        teilnehmerMap.keySet()
                );


        /*
         * Alle Anwesenheiten der Teilnehmer
         * mit einer Repository-Abfrage laden.
         */

        List<TagesAnwesenheit> anwesenheiten =
                tagesAnwesenheitRepository

                        .findByStudentIdIn(
                                studentIds
                        );


        /*
         * Anwesenheiten nach Schüler-ID gruppieren.
         */

        Map<Long, List<TagesAnwesenheit>>
                anwesenheitenNachStudent =

                anwesenheiten.stream()

                        .filter(Objects::nonNull)

                        .filter(entity ->
                                entity.getStudent() != null
                        )

                        .collect(

                                Collectors.groupingBy(

                                        entity ->
                                                entity.getStudent()
                                                        .getId()

                                )
                        );


        List<GruppenAnwesenheitStatistikResponse>
                result = new ArrayList<>();


        LocalDate heute = LocalDate.now(

                ZoneId.of("Europe/Berlin")

        );


        /*
         * Statistik für jeden Teilnehmer berechnen.
         */

        for (Long studentId : studentIds) {

            List<TagesAnwesenheit> eintraege =
                    anwesenheitenNachStudent

                            .getOrDefault(

                                    studentId,

                                    List.of()

                            );


            long anwesend = 0;

            long fehlend = 0;

            long teilweiseAbwesend = 0;


            for (TagesAnwesenheit eintrag : eintraege) {

                if (eintrag.getDatum() == null) {

                    continue;
                }


                /*
                 * Zukünftige Anwesenheiten
                 * werden nicht berücksichtigt.
                 */

                if (eintrag.getDatum().isAfter(heute)) {

                    continue;
                }


                /*
                 * Nur der Wochentag des Kurses
                 * beziehungsweise Angebots zählt.
                 */

                if (eintrag.getDatum().getDayOfWeek()
                        != gruppenZeiten.wochentag()) {

                    continue;
                }


                GruppenStatus status =
                        ermittleGruppenStatus(

                                eintrag,

                                gruppenZeiten

                        );


                switch (status) {

                    case ANWESEND ->
                            anwesend++;

                    case FEHLEND ->
                            fehlend++;

                    case TEILWEISE_ABWESEND ->
                            teilweiseAbwesend++;

                    case NICHT_ERFASST -> {

                        /*
                         * Nicht erfasste Anwesenheiten
                         * werden nicht mitgezählt.
                         */
                    }
                }
            }


            result.add(

                    new GruppenAnwesenheitStatistikResponse(

                            studentId,

                            anwesend,

                            fehlend,

                            teilweiseAbwesend

                    )
            );
        }


        return result;
    }


    /* =====================================================
       ANWESENHEITSSTATUS INNERHALB DER GRUPPENZEIT
       ===================================================== */

    private GruppenStatus ermittleGruppenStatus(

            TagesAnwesenheit anwesenheit,

            GruppenZeiten gruppenZeiten

    ) {

        String status =
                anwesenheit.getStatus();


        /*
         * Vollständige Abwesenheit hat Vorrang.
         */

        if ("FEHLT".equals(status)) {

            return GruppenStatus.FEHLEND;
        }


        LocalTime gruppenBeginn =
                gruppenZeiten.beginn();

        LocalTime gruppenEnde =
                gruppenZeiten.ende();


        LocalTime abwesendAb =
                anwesenheit.getAbwesendAb();

        LocalTime abwesendBis =
                anwesenheit.getAbwesendBis();


        /*
         * Keine Abwesenheitszeiten vorhanden.
         */

        if (abwesendAb == null &&
                abwesendBis == null) {

            return "ANWESEND".equals(status)

                    ? GruppenStatus.ANWESEND

                    : GruppenStatus.NICHT_ERFASST;
        }


        /*
         * Abwesend ab:
         *
         * Schüler fehlt ab einer bestimmten Uhrzeit
         * bis zum Ende des Tages.
         *
         * Abwesend bis:
         *
         * Schüler fehlt vom Beginn des Tages
         * bis zu einer bestimmten Uhrzeit.
         *
         * Beide Werte:
         *
         * Schüler fehlt innerhalb eines Zeitraums.
         */

        LocalTime abwesenheitBeginn =
                abwesendAb != null

                        ? abwesendAb

                        : LocalTime.MIN;


        LocalTime abwesenheitEnde =
                abwesendBis != null

                        ? abwesendBis

                        : LocalTime.MAX;


        /*
         * Prüfen, ob sich die Abwesenheit
         * mit der Gruppenzeit überschneidet.
         *
         * Intervalle:
         * [Beginn, Ende)
         */

        boolean ueberschneidung =

                abwesenheitBeginn.isBefore(
                        gruppenEnde
                )

                        &&

                        abwesenheitEnde.isAfter(
                                gruppenBeginn
                        );


        /*
         * Keine Überschneidung.
         *
         * Beispiel:
         *
         * Abwesend bis 10:00
         * ANA von 14:00 bis 15:30
         */

        if (!ueberschneidung) {

            return "ANWESEND".equals(status)

                    ? GruppenStatus.ANWESEND

                    : GruppenStatus.NICHT_ERFASST;
        }


        /*
         * Vollständige Überschneidung.
         *
         * Beispiel:
         *
         * Abwesend ab 12:00
         * ANA von 14:00 bis 15:30
         */

        boolean vollstaendigAbwesend =

                !abwesenheitBeginn.isAfter(
                        gruppenBeginn
                )

                        &&

                        !abwesenheitEnde.isBefore(
                                gruppenEnde
                        );


        if (vollstaendigAbwesend) {

            return GruppenStatus.FEHLEND;
        }


        /*
         * Teilweise Überschneidung.
         *
         * Beispiel:
         *
         * Abwesend ab 15:00
         * ANA von 14:00 bis 15:30
         */

        return GruppenStatus.TEILWEISE_ABWESEND;
    }


    /* =====================================================
       GRUPPENZEITEN ERSTELLEN UND VALIDIEREN
       ===================================================== */

    private GruppenZeiten createGruppenZeiten(

            String wochentag,

            String beginn,

            String ende

    ) {

        DayOfWeek parsedWochentag =
                parseWochentag(
                        wochentag
                );


        LocalTime parsedBeginn =
                parseTime(
                        beginn
                );


        LocalTime parsedEnde =
                parseTime(
                        ende
                );


        if (parsedWochentag == null) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Für die Gruppe wurde kein gültiger Wochentag hinterlegt."

            );
        }


        if (parsedBeginn == null ||
                parsedEnde == null) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Für die Gruppe wurden keine gültigen Beginn- und Endzeiten hinterlegt."

            );
        }


        if (!parsedBeginn.isBefore(parsedEnde)) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Die Beginnzeit muss vor der Endzeit liegen."

            );
        }


        return new GruppenZeiten(

                parsedWochentag,

                parsedBeginn,

                parsedEnde

        );
    }


    /* =====================================================
       WOCHENTAG KONVERTIEREN
       ===================================================== */

    private DayOfWeek parseWochentag(
            String wochentag
    ) {

        if (wochentag == null ||
                wochentag.isBlank()) {

            return null;
        }


        String normalized = wochentag

                .trim()

                .toLowerCase(Locale.ROOT)

                .replace(".", "");


        return switch (normalized) {

            case "montag", "mo",
                 "monday", "mon" ->

                    DayOfWeek.MONDAY;


            case "dienstag", "di",
                 "tuesday", "tue" ->

                    DayOfWeek.TUESDAY;


            case "mittwoch", "mi",
                 "wednesday", "wed" ->

                    DayOfWeek.WEDNESDAY;


            case "donnerstag", "do",
                 "thursday", "thu" ->

                    DayOfWeek.THURSDAY;


            case "freitag", "fr",
                 "friday", "fri" ->

                    DayOfWeek.FRIDAY;


            case "samstag", "sa",
                 "saturday", "sat" ->

                    DayOfWeek.SATURDAY;


            case "sonntag", "so",
                 "sunday", "sun" ->

                    DayOfWeek.SUNDAY;


            default -> null;
        };
    }


    /* =====================================================
       UHRZEIT KONVERTIEREN
       ===================================================== */

    private LocalTime parseTime(
            String value
    ) {

        if (value == null ||
                value.isBlank()) {

            return null;
        }


        String normalized =
                value.trim();


        List<DateTimeFormatter> formatters =
                List.of(

                        DateTimeFormatter.ISO_LOCAL_TIME,

                        DateTimeFormatter.ofPattern("H:mm"),

                        DateTimeFormatter.ofPattern("H:mm:ss")

                );


        for (DateTimeFormatter formatter : formatters) {

            try {

                return LocalTime.parse(

                        normalized,

                        formatter

                );

            } catch (DateTimeParseException ignored) {

                /*
                 * Nächstes Zeitformat versuchen.
                 */
            }
        }


        return null;
    }
}