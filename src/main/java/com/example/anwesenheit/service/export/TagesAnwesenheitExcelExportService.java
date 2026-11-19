package com.example.anwesenheit.service.export;

import com.example.anwesenheit.model.*;
import com.example.anwesenheit.repository.*;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.text.Collator;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.TextStyle;

import java.util.*;
import java.util.stream.Collectors;


@Service
@Transactional(readOnly = true)
public class TagesAnwesenheitExcelExportService {

    /* =====================================================
       REPOSITORIES
       ===================================================== */

    private final TagesAnwesenheitRepository
            tagesAnwesenheitRepository;

    private final StudentRepository studentRepository;

    private final KlasseRepository klasseRepository;

    private final KursRepository kursRepository;

    private final BuchungRepository buchungRepository;

    private final AngebotRepository angebotRepository;

    private final AngebotTeilnahmeRepository
            angebotTeilnahmeRepository;


    public TagesAnwesenheitExcelExportService(

            TagesAnwesenheitRepository
                    tagesAnwesenheitRepository,

            StudentRepository studentRepository,

            KlasseRepository klasseRepository,

            KursRepository kursRepository,

            BuchungRepository buchungRepository,

            AngebotRepository angebotRepository,

            AngebotTeilnahmeRepository
                    angebotTeilnahmeRepository

    ) {

        this.tagesAnwesenheitRepository =
                tagesAnwesenheitRepository;

        this.studentRepository =
                studentRepository;

        this.klasseRepository =
                klasseRepository;

        this.kursRepository =
                kursRepository;

        this.buchungRepository =
                buchungRepository;

        this.angebotRepository =
                angebotRepository;

        this.angebotTeilnahmeRepository =
                angebotTeilnahmeRepository;
    }


    /* =====================================================
       STATUS
       ===================================================== */

    private enum ExportStatus {

        ANWESEND("Anwesend"),

        FEHLT("Fehlt"),

        TEILWEISE_ABWESEND("Teilweise abwesend"),

        UNGEPRUEFT("Ungeprüft");


        private final String label;


        ExportStatus(String label) {

            this.label = label;
        }


        public String getLabel() {

            return label;
        }
    }


    /* =====================================================
       FILTERERGEBNIS
       ===================================================== */

    private record FilterErgebnis(

            String name,

            Set<Long> studentIds,

            DayOfWeek wochentag

    ) {
    }


    /* =====================================================
       EXCEL STYLES
       ===================================================== */

    private record ExcelStyles(

            CellStyle title,

            CellStyle header,

            CellStyle text,

            CellStyle date,

            CellStyle time,

            CellStyle number,

            CellStyle anwesend,

            CellStyle fehlt,

            CellStyle teilweise,

            CellStyle ungeprueft

    ) {
    }


    /* =====================================================
       EXCEL EXPORT
       ===================================================== */

    public byte[] exportAnwesenheitsverlauf(

            LocalDate von,

            LocalDate bis,

            AnwesenheitsverlaufFilter filterTyp,

            Long filterId

    ) throws IOException {

        validateZeitraum(von, bis);

        if (filterTyp == null) {

            filterTyp =
                    AnwesenheitsverlaufFilter.ALLE;
        }


        /* =============================================
           FILTER AUFLÖSEN
           ============================================= */

        FilterErgebnis filter =
                resolveFilter(

                        filterTyp,

                        filterId
                );


        /* =============================================
           ANWESENHEITEN LADEN
           ============================================= */

        List<TagesAnwesenheit> eintraege =
                tagesAnwesenheitRepository
                        .findByDatumBetweenOrderByDatumAsc(
                                von,
                                bis
                        );


        /* =============================================
           ANWESENHEITEN FILTERN
           ============================================= */

        List<TagesAnwesenheit> gefilterteEintraege =
                eintraege.stream()

                        .filter(entity ->
                                entity.getStudent() != null
                        )

                        .filter(entity ->
                                filter.studentIds() == null

                                        ||

                                        filter.studentIds().contains(
                                                entity.getStudent().getId()
                                        )
                        )

                        .filter(entity ->
                                filter.wochentag() == null

                                        ||

                                        entity.getDatum().getDayOfWeek()
                                                == filter.wochentag()
                        )

                        .collect(
                                Collectors.toCollection(
                                        ArrayList::new
                                )
                        );


        /* =============================================
           ANWESENHEITEN SORTIEREN
           ============================================= */

        Collator collator =
                Collator.getInstance(Locale.GERMAN);

        gefilterteEintraege.sort(

                Comparator

                        .comparing(
                                TagesAnwesenheit::getDatum
                        )

                        .thenComparing(
                                entity ->
                                        getKlassenName(
                                                entity.getStudent()
                                        ),
                                collator
                        )

                        .thenComparing(
                                entity ->
                                        safe(
                                                entity.getStudent()
                                                        .getNachname()
                                        ),
                                collator
                        )

                        .thenComparing(
                                entity ->
                                        safe(
                                                entity.getStudent()
                                                        .getVorname()
                                        ),
                                collator
                        )

                        .thenComparing(
                                entity ->
                                        entity.getStudent().getId()
                        )
        );


        /* =============================================
           ANA-BUCHUNGEN LADEN
           ============================================= */

        Map<Long, List<Buchung>> anaByStudent =
                buchungRepository.findAll()

                        .stream()

                        .filter(buchung ->
                                buchung.getStudent() != null

                                        &&

                                        buchung.getKurs() != null
                        )

                        .collect(
                                Collectors.groupingBy(
                                        buchung ->
                                                buchung.getStudent()
                                                        .getId()
                                )
                        );


        /* =============================================
           ANGEBOTSTEILNAHMEN LADEN
           ============================================= */

        Map<Long, List<AngebotTeilnahme>>
                angeboteByStudent =

                angebotTeilnahmeRepository.findAll()

                        .stream()

                        .filter(teilnahme ->
                                teilnahme.getStudent() != null

                                        &&

                                        teilnahme.getAngebot() != null
                        )

                        .collect(
                                Collectors.groupingBy(
                                        teilnahme ->
                                                teilnahme.getStudent()
                                                        .getId()
                                )
                        );


        /* =============================================
           EXCEL DATEI ERSTELLEN
           ============================================= */

        try (

                Workbook workbook =
                        new XSSFWorkbook();

                ByteArrayOutputStream outputStream =
                        new ByteArrayOutputStream()

        ) {

            ExcelStyles styles =
                    createStyles(workbook);


            /* =========================================
               ARBEITSBLÄTTER
               ========================================= */

            Sheet verlaufSheet =
                    workbook.createSheet(
                            "Anwesenheitsverlauf"
                    );

            Sheet statistikSheet =
                    workbook.createSheet(
                            "Zusammenfassung"
                    );


            /* =========================================
               ANWESENHEITSVERLAUF
               ========================================= */

            createVerlaufSheet(

                    verlaufSheet,

                    styles,

                    gefilterteEintraege,

                    anaByStudent,

                    angeboteByStudent
            );


            /* =========================================
               ZUSAMMENFASSUNG
               ========================================= */

            createZusammenfassungSheet(

                    statistikSheet,

                    styles,

                    gefilterteEintraege,

                    von,

                    bis,

                    filter.name()
            );


            workbook.write(outputStream);

            return outputStream.toByteArray();
        }
    }


    /* =====================================================
       ANWESENHEITSVERLAUF ARBEITSBLATT
       ===================================================== */

    private void createVerlaufSheet(

            Sheet sheet,

            ExcelStyles styles,

            List<TagesAnwesenheit> eintraege,

            Map<Long, List<Buchung>> anaByStudent,

            Map<Long, List<AngebotTeilnahme>>
                    angeboteByStudent

    ) {

        String[] headers = {

                "Datum",

                "Wochentag",

                "ID_Kind",

                "Nachname",

                "Vorname",

                "Klasse",

                "Jahrgang",

                "Angebote",

                "ANA",

                "Status",

                "Abwesend ab",

                "Abwesend bis",

                "Grund Abwesenheit",

                "ANA-Anwesenheitskontrolle",

                "Bemerkung"
        };


        /*
         * Excel unterstützt maximal 1.048.576 Zeilen.
         * Eine Zeile wird für den Tabellenkopf benötigt.
         */
        if (eintraege.size() > 1_048_575) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Der Export enthält zu viele Einträge. "
                            + "Bitte wählen Sie einen kleineren Zeitraum."
            );
        }


        /* =============================================
           TABELLENHEADER
           ============================================= */

        Row headerRow =
                sheet.createRow(0);

        headerRow.setHeightInPoints(30);

        for (int i = 0; i < headers.length; i++) {

            writeText(

                    headerRow,

                    i,

                    headers[i],

                    styles.header()
            );
        }


        /* =============================================
           DATENZEILEN
           ============================================= */

        int rowIndex = 1;

        for (TagesAnwesenheit entity : eintraege) {

            Student student =
                    entity.getStudent();

            LocalDate datum =
                    entity.getDatum();

            Long studentId =
                    student.getId();

            Row row =
                    sheet.createRow(rowIndex++);

            ExportStatus status =
                    getExportStatus(entity);


            /* Datum */

            writeDate(

                    row,

                    0,

                    datum,

                    styles.date()
            );


            /* Wochentag */

            writeText(

                    row,

                    1,

                    datum.getDayOfWeek()
                            .getDisplayName(
                                    TextStyle.FULL,
                                    Locale.GERMAN
                            ),

                    styles.text()
            );


            /* ID_Kind */

            writeText(

                    row,

                    2,

                    student.getIdKind() == null

                            ? ""

                            : student.getIdKind().toString(),

                    styles.text()
            );


            /* Nachname */

            writeText(

                    row,

                    3,

                    student.getNachname(),

                    styles.text()
            );


            /* Vorname */

            writeText(

                    row,

                    4,

                    student.getVorname(),

                    styles.text()
            );


            /* Klasse */

            writeText(

                    row,

                    5,

                    getKlassenName(student),

                    styles.text()
            );


            /* Jahrgang */

            writeNumber(

                    row,

                    6,

                    student.getJahrgang(),

                    styles.number()
            );


            /* Angebote */

            writeText(

                    row,

                    7,

                    getAngeboteText(

                            angeboteByStudent.getOrDefault(
                                    studentId,
                                    List.of()
                            ),

                            datum
                    ),

                    styles.text()
            );


            /* ANA */

            writeText(

                    row,

                    8,

                    getAnaText(

                            anaByStudent.getOrDefault(
                                    studentId,
                                    List.of()
                            ),

                            datum
                    ),

                    styles.text()
            );


            /* Status */

            writeText(

                    row,

                    9,

                    status.getLabel(),

                    getStatusStyle(
                            status,
                            styles
                    )
            );


            /* Abwesend ab */

            writeTime(

                    row,

                    10,

                    entity.getAbwesendAb(),

                    styles.time()
            );


            /* Abwesend bis */

            writeTime(

                    row,

                    11,

                    entity.getAbwesendBis(),

                    styles.time()
            );


            /* Grund Abwesenheit */

            writeText(

                    row,

                    12,

                    entity.getGrundAbwesenheit(),

                    styles.text()
            );


            /* ANA Anwesenheitskontrolle */

            writeText(

                    row,

                    13,

                    Boolean.TRUE.equals(
                            entity.getAnaAnwesenheitskontrolle()
                    )

                            ? "Ja"

                            : "Nein",

                    styles.text()
            );


            /* Bemerkung */

            writeText(

                    row,

                    14,

                    entity.getBemerkung(),

                    styles.text()
            );
        }


        /* =============================================
           FILTER UND FIXIERUNG
           ============================================= */

        sheet.createFreezePane(0, 1);

        sheet.setAutoFilter(

                new CellRangeAddress(

                        0,

                        Math.max(0, rowIndex - 1),

                        0,

                        headers.length - 1
                )
        );


        /* =============================================
           SPALTENBREITEN
           ============================================= */

        int[] widths = {

                14,     // Datum

                16,     // Wochentag

                15,     // ID_Kind

                24,     // Nachname

                22,     // Vorname

                18,     // Klasse

                12,     // Jahrgang

                40,     // Angebote

                40,     // ANA

                24,     // Status

                16,     // Abwesend ab

                16,     // Abwesend bis

                35,     // Grund Abwesenheit

                28,     // ANA Kontrolle

                55      // Bemerkung
        };

        for (int i = 0; i < widths.length; i++) {

            sheet.setColumnWidth(

                    i,

                    widths[i] * 256
            );
        }
    }


    /* =====================================================
       ZUSAMMENFASSUNG
       ===================================================== */

    private void createZusammenfassungSheet(

            Sheet sheet,

            ExcelStyles styles,

            List<TagesAnwesenheit> eintraege,

            LocalDate von,

            LocalDate bis,

            String filterName

    ) {

        Map<ExportStatus, Long> statistik =
                new EnumMap<>(ExportStatus.class);

        for (ExportStatus status : ExportStatus.values()) {

            statistik.put(status, 0L);
        }

        for (TagesAnwesenheit entity : eintraege) {

            statistik.merge(

                    getExportStatus(entity),

                    1L,

                    Long::sum
            );
        }


        long anzahlSchueler =
                eintraege.stream()

                        .map(entity ->
                                entity.getStudent().getId()
                        )

                        .distinct()

                        .count();

        long anaKontrolliert =
                eintraege.stream()

                        .filter(entity ->
                                Boolean.TRUE.equals(
                                        entity.getAnaAnwesenheitskontrolle()
                                )
                        )

                        .count();


        /* =============================================
           TITEL
           ============================================= */

        Row titleRow =
                sheet.createRow(0);

        titleRow.setHeightInPoints(30);

        writeText(

                titleRow,

                0,

                "Anwesenheitsverlauf – Zusammenfassung",

                styles.title()
        );

        sheet.addMergedRegion(

                new CellRangeAddress(
                        0,
                        0,
                        0,
                        1
                )
        );


        /* =============================================
           EXPORTPARAMETER
           ============================================= */

        Row vonRow =
                sheet.createRow(2);

        writeText(

                vonRow,

                0,

                "Von",

                styles.text()
        );

        writeDate(

                vonRow,

                1,

                von,

                styles.date()
        );


        Row bisRow =
                sheet.createRow(3);

        writeText(

                bisRow,

                0,

                "Bis",

                styles.text()
        );

        writeDate(

                bisRow,

                1,

                bis,

                styles.date()
        );


        Row filterRow =
                sheet.createRow(4);

        writeText(

                filterRow,

                0,

                "Filter",

                styles.text()
        );

        writeText(

                filterRow,

                1,

                filterName,

                styles.text()
        );


        /* =============================================
           STATISTIK HEADER
           ============================================= */

        Row headerRow =
                sheet.createRow(6);

        writeText(

                headerRow,

                0,

                "Kennzahl",

                styles.header()
        );

        writeText(

                headerRow,

                1,

                "Anzahl",

                styles.header()
        );


        /* =============================================
           STATISTIKWERTE
           ============================================= */

        int rowIndex = 7;

        addStatistikRow(

                sheet,

                rowIndex++,

                "Gespeicherte Anwesenheitseinträge",

                eintraege.size(),

                styles.text(),

                styles.number()
        );

        addStatistikRow(

                sheet,

                rowIndex++,

                "Schüler mit Einträgen",

                anzahlSchueler,

                styles.text(),

                styles.number()
        );


        for (ExportStatus status : ExportStatus.values()) {

            addStatistikRow(

                    sheet,

                    rowIndex++,

                    status.getLabel(),

                    statistik.get(status),

                    getStatusStyle(
                            status,
                            styles
                    ),

                    styles.number()
            );
        }


        addStatistikRow(

                sheet,

                rowIndex++,

                "ANA-Anwesenheitskontrolle: Ja",

                anaKontrolliert,

                styles.text(),

                styles.number()
        );

        addStatistikRow(

                sheet,

                rowIndex++,

                "ANA-Anwesenheitskontrolle: Nein",

                eintraege.size() - anaKontrolliert,

                styles.text(),

                styles.number()
        );


        /* =============================================
           HINWEISE
           ============================================= */

        rowIndex += 2;

        addHinweis(

                sheet,

                rowIndex++,

                "Es werden ausschließlich gespeicherte "
                        + "Anwesenheitseinträge berücksichtigt.",

                styles.text()
        );

        addHinweis(

                sheet,

                rowIndex++,

                "Tage ohne Eintrag werden nicht als "
                        + "Fehlt oder Anwesend gezählt.",

                styles.text()
        );

        addHinweis(

                sheet,

                rowIndex++,

                "Teilweise abwesende Schüler werden "
                        + "nicht zusätzlich als Anwesend gezählt.",

                styles.text()
        );

        addHinweis(

                sheet,

                rowIndex++,

                "Klassen und Buchungen entsprechen "
                        + "den aktuellen Zuordnungen.",

                styles.text()
        );

        addHinweis(

                sheet,

                rowIndex,

                "Die ANA-Anwesenheitskontrolle hat "
                        + "keinen Einfluss auf den Anwesenheitsstatus.",

                styles.text()
        );


        sheet.setColumnWidth(0, 55 * 256);

        sheet.setColumnWidth(1, 40 * 256);
    }


    private void addStatistikRow(

            Sheet sheet,

            int rowIndex,

            String label,

            long value,

            CellStyle labelStyle,

            CellStyle valueStyle

    ) {

        Row row =
                sheet.createRow(rowIndex);

        writeText(

                row,

                0,

                label,

                labelStyle
        );

        writeNumber(

                row,

                1,

                value,

                valueStyle
        );
    }


    private void addHinweis(

            Sheet sheet,

            int rowIndex,

            String text,

            CellStyle style

    ) {

        Row row =
                sheet.createRow(rowIndex);

        row.setHeightInPoints(30);

        writeText(

                row,

                0,

                text,

                style
        );

        sheet.addMergedRegion(

                new CellRangeAddress(

                        rowIndex,

                        rowIndex,

                        0,

                        1
                )
        );
    }


    /* =====================================================
       FILTER AUFLÖSEN
       ===================================================== */

    private FilterErgebnis resolveFilter(

            AnwesenheitsverlaufFilter filterTyp,

            Long filterId

    ) {

        if (filterTyp == AnwesenheitsverlaufFilter.ALLE) {

            return new FilterErgebnis(

                    "Gesamt",

                    null,

                    null
            );
        }


        if (filterId == null || filterId <= 0) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Für diesen Filter muss eine gültige ID angegeben werden."
            );
        }


        return switch (filterTyp) {

            case KLASSE ->
                    resolveKlasseFilter(filterId);

            case ANGEBOT ->
                    resolveAngebotFilter(filterId);

            case ANA ->
                    resolveAnaFilter(filterId);

            case SCHUELER ->
                    resolveSchuelerFilter(filterId);

            case ALLE ->
                    new FilterErgebnis(
                            "Gesamt",
                            null,
                            null
                    );
        };
    }


    /* =====================================================
       KLASSENFILTER
       ===================================================== */

    private FilterErgebnis resolveKlasseFilter(

            Long klasseId

    ) {

        Klasse klasse =
                klasseRepository.findById(klasseId)

                        .orElseThrow(() ->
                                new ResponseStatusException(

                                        HttpStatus.NOT_FOUND,

                                        "Klasse nicht gefunden."
                                )
                        );

        Set<Long> studentIds =
                studentRepository.findAll()

                        .stream()

                        .filter(student -> {

                            if (student.getKlasseEntity() != null) {

                                return Objects.equals(

                                        student.getKlasseEntity().getId(),

                                        klasseId
                                );
                            }

                            return safe(student.getKlasse())
                                    .equalsIgnoreCase(
                                            safe(klasse.getName())
                                    );
                        })

                        .map(Student::getId)

                        .collect(Collectors.toSet());

        return new FilterErgebnis(

                "Klasse: " + klasse.getName(),

                studentIds,

                null
        );
    }


    /* =====================================================
       ANGEBOTSFILTER
       ===================================================== */

    private FilterErgebnis resolveAngebotFilter(

            Long angebotId

    ) {

        Angebot angebot =
                angebotRepository.findById(angebotId)

                        .orElseThrow(() ->
                                new ResponseStatusException(

                                        HttpStatus.NOT_FOUND,

                                        "Angebot nicht gefunden."
                                )
                        );

        Set<Long> studentIds =
                angebotTeilnahmeRepository

                        .findByAngebotId(angebotId)

                        .stream()

                        .filter(teilnahme ->
                                teilnahme.getStudent() != null
                        )

                        .map(teilnahme ->
                                teilnahme.getStudent().getId()
                        )

                        .collect(Collectors.toSet());

        DayOfWeek wochentag =
                requireWochentag(

                        angebot.getWochentag(),

                        angebot.getName()
                );

        return new FilterErgebnis(

                "Angebot: " + angebot.getName(),

                studentIds,

                wochentag
        );
    }


    /* =====================================================
       ANA FILTER
       ===================================================== */

    private FilterErgebnis resolveAnaFilter(

            Long kursId

    ) {

        Kurs kurs =
                kursRepository.findById(kursId)

                        .orElseThrow(() ->
                                new ResponseStatusException(

                                        HttpStatus.NOT_FOUND,

                                        "ANA-Kurs nicht gefunden."
                                )
                        );

        Set<Long> studentIds =
                buchungRepository.findByKursId(kursId)

                        .stream()

                        .filter(buchung ->
                                buchung.getStudent() != null
                        )

                        .map(buchung ->
                                buchung.getStudent().getId()
                        )

                        .collect(Collectors.toSet());

        DayOfWeek wochentag =
                requireWochentag(

                        kurs.getWochentag(),

                        kurs.getName()
                );

        return new FilterErgebnis(

                "ANA: " + kurs.getName(),

                studentIds,

                wochentag
        );
    }


    /* =====================================================
       SCHÜLERFILTER
       ===================================================== */

    private FilterErgebnis resolveSchuelerFilter(

            Long studentId

    ) {

        Student student =
                studentRepository.findById(studentId)

                        .orElseThrow(() ->
                                new ResponseStatusException(

                                        HttpStatus.NOT_FOUND,

                                        "Schüler nicht gefunden."
                                )
                        );

        return new FilterErgebnis(

                "Schüler: "

                        + safe(student.getNachname())

                        + ", "

                        + safe(student.getVorname()),

                Set.of(studentId),

                null
        );
    }


    /* =====================================================
       ANGEBOTE EINES TAGES
       ===================================================== */

    private String getAngeboteText(

            List<AngebotTeilnahme> teilnahmen,

            LocalDate datum

    ) {

        return teilnahmen.stream()

                .map(AngebotTeilnahme::getAngebot)

                .filter(Objects::nonNull)

                .filter(angebot ->
                        parseWochentag(
                                angebot.getWochentag()
                        ) == datum.getDayOfWeek()
                )

                .map(Angebot::getName)

                .filter(Objects::nonNull)

                .filter(name -> !name.isBlank())

                .distinct()

                .sorted(
                        Collator.getInstance(Locale.GERMAN)
                )

                .collect(
                        Collectors.joining(", ")
                );
    }


    /* =====================================================
       ANA EINES TAGES
       ===================================================== */

    private String getAnaText(

            List<Buchung> buchungen,

            LocalDate datum

    ) {

        return buchungen.stream()

                .map(Buchung::getKurs)

                .filter(Objects::nonNull)

                .filter(kurs ->
                        parseWochentag(
                                kurs.getWochentag()
                        ) == datum.getDayOfWeek()
                )

                .map(Kurs::getName)

                .filter(Objects::nonNull)

                .filter(name -> !name.isBlank())

                .distinct()

                .sorted(
                        Collator.getInstance(Locale.GERMAN)
                )

                .collect(
                        Collectors.joining(", ")
                );
    }


    /* =====================================================
       ANWESENHEITSSTATUS

       Jeder Eintrag gehört genau zu einer Kategorie.
       ===================================================== */

    private ExportStatus getExportStatus(

            TagesAnwesenheit entity

    ) {

        String status =
                safe(entity.getStatus());

        if ("FEHLT".equalsIgnoreCase(status)) {

            return ExportStatus.FEHLT;
        }

        if (

                entity.getAbwesendAb() != null

                        ||

                        entity.getAbwesendBis() != null

        ) {

            return ExportStatus.TEILWEISE_ABWESEND;
        }

        if ("ANWESEND".equalsIgnoreCase(status)) {

            return ExportStatus.ANWESEND;
        }

        return ExportStatus.UNGEPRUEFT;
    }


    private CellStyle getStatusStyle(

            ExportStatus status,

            ExcelStyles styles

    ) {

        return switch (status) {

            case ANWESEND ->
                    styles.anwesend();

            case FEHLT ->
                    styles.fehlt();

            case TEILWEISE_ABWESEND ->
                    styles.teilweise();

            case UNGEPRUEFT ->
                    styles.ungeprueft();
        };
    }


    /* =====================================================
       EXCEL STYLES ERSTELLEN
       ===================================================== */

    private ExcelStyles createStyles(

            Workbook workbook

    ) {

        DataFormat dataFormat =
                workbook.createDataFormat();


        /* Standard Font */

        Font normalFont =
                workbook.createFont();

        normalFont.setFontName("Calibri");

        normalFont.setFontHeightInPoints((short) 11);


        /* Header Font */

        Font headerFont =
                workbook.createFont();

        headerFont.setFontName("Calibri");

        headerFont.setFontHeightInPoints((short) 11);

        headerFont.setBold(true);

        headerFont.setColor(
                IndexedColors.WHITE.getIndex()
        );


        /* Title Font */

        Font titleFont =
                workbook.createFont();

        titleFont.setFontName("Calibri");

        titleFont.setFontHeightInPoints((short) 16);

        titleFont.setBold(true);


        /* Title */

        CellStyle title =
                workbook.createCellStyle();

        title.setFont(titleFont);

        title.setVerticalAlignment(
                VerticalAlignment.CENTER
        );


        /* Header */

        CellStyle header =
                workbook.createCellStyle();

        header.setFont(headerFont);

        header.setFillForegroundColor(
                IndexedColors.DARK_BLUE.getIndex()
        );

        header.setFillPattern(
                FillPatternType.SOLID_FOREGROUND
        );

        header.setAlignment(
                HorizontalAlignment.CENTER
        );

        header.setVerticalAlignment(
                VerticalAlignment.CENTER
        );

        header.setWrapText(true);


        /* Standard Text */

        CellStyle text =
                workbook.createCellStyle();

        text.setFont(normalFont);

        text.setVerticalAlignment(
                VerticalAlignment.TOP
        );

        text.setWrapText(true);

        applyBorders(text);


        /* Datum */

        CellStyle date =
                workbook.createCellStyle();

        date.cloneStyleFrom(text);

        date.setDataFormat(
                dataFormat.getFormat("dd.MM.yyyy")
        );

        date.setAlignment(
                HorizontalAlignment.CENTER
        );


        /* Uhrzeit */

        CellStyle time =
                workbook.createCellStyle();

        time.cloneStyleFrom(text);

        time.setDataFormat(
                dataFormat.getFormat("hh:mm")
        );

        time.setAlignment(
                HorizontalAlignment.CENTER
        );


        /* Zahlen */

        CellStyle number =
                workbook.createCellStyle();

        number.cloneStyleFrom(text);

        number.setDataFormat(
                dataFormat.getFormat("0")
        );

        number.setAlignment(
                HorizontalAlignment.CENTER
        );


        /* Statusfarben */

        CellStyle anwesend =
                createStatusStyle(

                        workbook,

                        text,

                        IndexedColors.LIGHT_GREEN
                );

        CellStyle fehlt =
                createStatusStyle(

                        workbook,

                        text,

                        IndexedColors.ROSE
                );

        CellStyle teilweise =
                createStatusStyle(

                        workbook,

                        text,

                        IndexedColors.LIGHT_ORANGE
                );

        CellStyle ungeprueft =
                createStatusStyle(

                        workbook,

                        text,

                        IndexedColors.GREY_25_PERCENT
                );


        return new ExcelStyles(

                title,

                header,

                text,

                date,

                time,

                number,

                anwesend,

                fehlt,

                teilweise,

                ungeprueft
        );
    }


    private CellStyle createStatusStyle(

            Workbook workbook,

            CellStyle baseStyle,

            IndexedColors color

    ) {

        CellStyle style =
                workbook.createCellStyle();

        style.cloneStyleFrom(baseStyle);

        style.setFillForegroundColor(
                color.getIndex()
        );

        style.setFillPattern(
                FillPatternType.SOLID_FOREGROUND
        );

        return style;
    }


    private void applyBorders(CellStyle style) {

        style.setBorderBottom(BorderStyle.THIN);

        style.setBorderTop(BorderStyle.THIN);

        style.setBorderLeft(BorderStyle.THIN);

        style.setBorderRight(BorderStyle.THIN);

        short color =
                IndexedColors.GREY_25_PERCENT.getIndex();

        style.setBottomBorderColor(color);

        style.setTopBorderColor(color);

        style.setLeftBorderColor(color);

        style.setRightBorderColor(color);
    }


    /* =====================================================
       ZELLEN SCHREIBEN
       ===================================================== */

    private void writeText(

            Row row,

            int column,

            String value,

            CellStyle style

    ) {

        Cell cell =
                row.createCell(column);

        String text =
                value == null ? "" : value;

        /*
         * Excel erlaubt maximal 32.767 Zeichen pro Zelle.
         */
        if (text.length() > 32_767) {

            text =
                    text.substring(0, 32_764) + "...";
        }

        cell.setCellValue(text);

        cell.setCellStyle(style);
    }


    private void writeDate(

            Row row,

            int column,

            LocalDate value,

            CellStyle style

    ) {

        Cell cell =
                row.createCell(column);

        if (value != null) {

            cell.setCellValue(
                    value.atStartOfDay()
            );
        }

        cell.setCellStyle(style);
    }


    private void writeTime(

            Row row,

            int column,

            LocalTime value,

            CellStyle style

    ) {

        Cell cell =
                row.createCell(column);

        if (value != null) {

            double excelTime =
                    value.toNanoOfDay()

                            /

                            86_400_000_000_000.0;

            cell.setCellValue(excelTime);
        }

        cell.setCellStyle(style);
    }


    private void writeNumber(

            Row row,

            int column,

            Number value,

            CellStyle style

    ) {

        Cell cell =
                row.createCell(column);

        if (value != null) {

            cell.setCellValue(
                    value.doubleValue()
            );
        }

        cell.setCellStyle(style);
    }


    /* =====================================================
       KLASSENNAME
       ===================================================== */

    private String getKlassenName(Student student) {

        if (

                student.getKlasseEntity() != null

                        &&

                        !safe(
                                student.getKlasseEntity().getName()
                        ).isBlank()

        ) {

            return student.getKlasseEntity().getName();
        }

        String klasse =
                safe(student.getKlasse());

        return klasse.isBlank()

                ? "Ohne Klasse"

                : klasse;
    }


    /* =====================================================
       WOCHENTAG
       ===================================================== */

    private DayOfWeek parseWochentag(String value) {

        String normalized =
                safe(value)

                        .toLowerCase(Locale.GERMAN)

                        .replace(".", "")

                        .trim();

        return switch (normalized) {

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
    }


    private DayOfWeek requireWochentag(

            String value,

            String gruppenName

    ) {

        DayOfWeek wochentag =
                parseWochentag(value);

        if (wochentag == null) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Für die Gruppe "

                            + safe(gruppenName)

                            + " ist kein gültiger Wochentag hinterlegt."
            );
        }

        return wochentag;
    }


    /* =====================================================
       ZEITRAUM VALIDIEREN
       ===================================================== */

    private void validateZeitraum(

            LocalDate von,

            LocalDate bis

    ) {

        if (von == null || bis == null) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Von-Datum und Bis-Datum sind erforderlich."
            );
        }

        if (von.isAfter(bis)) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Das Von-Datum darf nicht nach dem Bis-Datum liegen."
            );
        }
    }


    /* =====================================================
       NULL SAFE
       ===================================================== */

    private String safe(String value) {

        return value == null

                ? ""

                : value.trim();
    }
}