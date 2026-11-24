package com.example.anwesenheit.service.export;

import com.example.anwesenheit.model.Angebot;
import com.example.anwesenheit.model.AngebotTeilnahme;
import com.example.anwesenheit.model.Student;

import com.example.anwesenheit.repository.AngebotRepository;
import com.example.anwesenheit.repository.AngebotTeilnahmeRepository;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;

import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;

import java.text.Collator;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;


@Service
@Transactional(readOnly = true)
public class AngebotBuchungenPdfExportService {

    /* =====================================================
       REPOSITORIES
       ===================================================== */

    private final AngebotRepository angebotRepository;

    private final AngebotTeilnahmeRepository
            angebotTeilnahmeRepository;


    public AngebotBuchungenPdfExportService(
            AngebotRepository angebotRepository,
            AngebotTeilnahmeRepository angebotTeilnahmeRepository
    ) {

        this.angebotRepository =
                angebotRepository;

        this.angebotTeilnahmeRepository =
                angebotTeilnahmeRepository;
    }


    /* =====================================================
       FARBEN
       ===================================================== */

    private static final Color PRIMARY_COLOR =
            new Color(46, 125, 90);

    private static final Color SECONDARY_COLOR =
            new Color(224, 242, 232);

    private static final Color TABLE_HEADER_COLOR =
            new Color(235, 235, 235);

    private static final Color BORDER_COLOR =
            new Color(210, 210, 210);

    private static final Color ALTERNATE_ROW_COLOR =
            new Color(248, 248, 248);


    /* =====================================================
       SCHRIFTARTEN
       ===================================================== */

    private static final Font TITLE_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    18,
                    Color.BLACK
            );

    private static final Font SUBTITLE_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA,
                    10,
                    Color.DARK_GRAY
            );

    private static final Font DAY_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    13,
                    Color.WHITE
            );

    private static final Font ANGEBOT_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    11,
                    Color.BLACK
            );

    private static final Font HEADER_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    9,
                    Color.BLACK
            );

    private static final Font TEXT_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA,
                    9,
                    Color.BLACK
            );

    private static final Font MUTED_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA,
                    8,
                    Color.GRAY
            );


    /* =====================================================
       WOCHENTAGE
       ===================================================== */

    private static final List<String> WOCHENTAGE =
            List.of(
                    "Montag",
                    "Dienstag",
                    "Mittwoch",
                    "Donnerstag",
                    "Freitag",
                    "Samstag",
                    "Sonntag",
                    "Nicht zugeordnet"
            );


    /* =====================================================
       DATUMSFORMAT
       ===================================================== */

    private static final DateTimeFormatter DATUM_FORMAT =
            DateTimeFormatter.ofPattern(
                    "dd.MM.yyyy"
            );


    /* =====================================================
       PDF EXPORT
       ===================================================== */

    public byte[] exportAngebotBuchungen()
            throws DocumentException {

        /* =============================================
           DATEN LADEN
           ============================================= */

        List<Angebot> angebote =
                new ArrayList<>(
                        angebotRepository.findAll()
                );

        List<AngebotTeilnahme> teilnahmen =
                angebotTeilnahmeRepository.findAll();


        /* =============================================
           TEILNAHMEN NACH ANGEBOT GRUPPIEREN
           ============================================= */

        Map<Long, List<AngebotTeilnahme>>
                teilnahmenByAngebot =

                teilnahmen.stream()

                        .filter(Objects::nonNull)

                        .filter(teilnahme ->
                                teilnahme.getAngebot() != null
                                        &&
                                        teilnahme.getStudent() != null
                        )

                        .collect(
                                Collectors.groupingBy(
                                        teilnahme ->
                                                teilnahme
                                                        .getAngebot()
                                                        .getId()
                                )
                        );


        /* =============================================
           ANGEBOTE SORTIEREN
           ============================================= */

        Collator collator =
                Collator.getInstance(Locale.GERMAN);

        angebote.sort(

                Comparator

                        .comparingInt(
                                (Angebot angebot) ->
                                        getWochentagPosition(
                                                angebot.getWochentag()
                                        )
                        )

                        .thenComparingInt(
                                angebot ->
                                        getUhrzeitPosition(
                                                angebot.getBeginn()
                                        )
                        )

                        .thenComparing(
                                angebot ->
                                        safe(angebot.getName()),
                                collator
                        )
        );


        /* =============================================
           ANGEBOTE NACH WOCHENTAG GRUPPIEREN
           ============================================= */

        Map<String, List<Angebot>>
                angeboteByWochentag =
                new LinkedHashMap<>();

        for (String wochentag : WOCHENTAGE) {

            angeboteByWochentag.put(
                    wochentag,
                    new ArrayList<>()
            );
        }

        for (Angebot angebot : angebote) {

            String wochentag =
                    normalizeWochentag(
                            angebot.getWochentag()
                    );

            angeboteByWochentag

                    .get(wochentag)

                    .add(angebot);
        }


        /* =============================================
           GESAMTSTATISTIK
           ============================================= */

        long anzahlTeilnahmen =
                teilnahmenByAngebot.values()

                        .stream()

                        .mapToLong(List::size)

                        .sum();

        long anzahlSchueler =
                teilnahmenByAngebot.values()

                        .stream()

                        .flatMap(List::stream)

                        .map(teilnahme ->
                                teilnahme
                                        .getStudent()
                                        .getId()
                        )

                        .distinct()

                        .count();


        /* =============================================
           PDF DOKUMENT
           ============================================= */

        ByteArrayOutputStream outputStream =
                new ByteArrayOutputStream();

        Document document = new Document(

                PageSize.A4,

                28,

                28,

                28,

                28
        );

        PdfWriter.getInstance(
                document,
                outputStream
        );

        document.addTitle(
                "Angebotsbuchungen"
        );

        document.addCreator(
                "Anwesenheitsverwaltung"
        );

        document.open();

        try {

            /* =========================================
               TITEL
               ========================================= */

            Paragraph title = new Paragraph(

                    "Angebotsbuchungen",

                    TITLE_FONT
            );

            title.setAlignment(
                    Element.ALIGN_CENTER
            );

            title.setSpacingAfter(5);

            document.add(title);


            /* =========================================
               ERSTELLUNGSDATUM
               ========================================= */

            String datum =
                    LocalDate.now(
                            ZoneId.of("Europe/Berlin")
                    ).format(DATUM_FORMAT);

            Paragraph subtitle = new Paragraph(

                    "Stand: " + datum,

                    SUBTITLE_FONT
            );

            subtitle.setAlignment(
                    Element.ALIGN_CENTER
            );

            subtitle.setSpacingAfter(14);

            document.add(subtitle);


            /* =========================================
               GESAMTÜBERSICHT
               ========================================= */

            document.add(

                    createStatistikTabelle(

                            angebote.size(),

                            anzahlTeilnahmen,

                            anzahlSchueler
                    )
            );


            /* =========================================
               KEINE ANGEBOTE
               ========================================= */

            if (angebote.isEmpty()) {

                Paragraph empty = new Paragraph(

                        "Keine Angebote vorhanden.",

                        TEXT_FONT
                );

                empty.setSpacingBefore(15);

                document.add(empty);
            }


            /* =========================================
               WOCHENTAGE UND ANGEBOTE

               Jedes neue Angebot beginnt auf
               einer neuen Seite.
               ========================================= */

            boolean erstesAngebot = true;

            for (
                    Map.Entry<String, List<Angebot>> entry :
                    angeboteByWochentag.entrySet()
            ) {

                String wochentag =
                        entry.getKey();

                List<Angebot> tagesAngebote =
                        entry.getValue();

                if (tagesAngebote.isEmpty()) {

                    continue;
                }


                for (Angebot angebot : tagesAngebote) {

                    /* =================================
                       SEITENUMBRUCH VOR JEDEM ANGEBOT

                       Das erste Angebot bleibt unterhalb
                       der Gesamtstatistik.
                       ================================= */

                    if (!erstesAngebot) {

                        document.newPage();
                    }


                    /* =================================
                       TEILNAHMEN LADEN
                       ================================= */

                    List<AngebotTeilnahme>
                            angebotTeilnahmen =

                            new ArrayList<>(

                                    teilnahmenByAngebot
                                            .getOrDefault(

                                                    angebot.getId(),

                                                    List.of()
                                            )
                            );

                    sortTeilnahmen(

                            angebotTeilnahmen,

                            collator
                    );


                    /* =================================
                       ANGEBOTSTABELLE ERSTELLEN

                       Der Wochentag wird bei jedem
                       Angebot angezeigt.
                       ================================= */

                    PdfPTable angebotTabelle =
                            createAngebotTabelle(

                                    angebot,

                                    angebotTeilnahmen,

                                    wochentag,

                                    tagesAngebote.size()
                            );

                    document.add(
                            angebotTabelle
                    );

                    erstesAngebot = false;
                }
            }

        } finally {

            document.close();
        }

        return outputStream.toByteArray();
    }


    /* =====================================================
       GESAMTSTATISTIK
       ===================================================== */

    private PdfPTable createStatistikTabelle(

            long anzahlAngebote,

            long anzahlTeilnahmen,

            long anzahlSchueler

    ) {

        PdfPTable table =
                new PdfPTable(3);

        table.setWidthPercentage(100);

        table.setSpacingAfter(15);

        addStatistikCell(

                table,

                "Angebote",

                anzahlAngebote
        );

        addStatistikCell(

                table,

                "Teilnahmen",

                anzahlTeilnahmen
        );

        addStatistikCell(

                table,

                "Schüler",

                anzahlSchueler
        );

        return table;
    }


    private void addStatistikCell(

            PdfPTable table,

            String label,

            long value

    ) {

        PdfPCell cell = new PdfPCell(

                new Phrase(

                        label + ": " + value,

                        ANGEBOT_FONT
                )
        );

        cell.setBackgroundColor(
                SECONDARY_COLOR
        );

        cell.setBorderColor(
                BORDER_COLOR
        );

        cell.setHorizontalAlignment(
                Element.ALIGN_CENTER
        );

        cell.setPadding(10);

        table.addCell(cell);
    }


    /* =====================================================
       ANGEBOTSTABELLE
       ===================================================== */

    private PdfPTable createAngebotTabelle(

            Angebot angebot,

            List<AngebotTeilnahme> teilnahmen,

            String wochentag,

            int anzahlTagesAngebote

    ) throws DocumentException {

        PdfPTable table =
                new PdfPTable(5);

        table.setWidthPercentage(100);

        table.setWidths(

                new float[]{
                        0.6f,
                        3.2f,
                        1.5f,
                        1.2f,
                        3.5f
                }
        );

        table.setSpacingBefore(8);

        table.setSpacingAfter(8);


        /* =============================================
           SEITENUMBRÜCHE INNERHALB EINES ANGEBOTS

           Große Angebote dürfen mehrere Seiten belegen.
           Tabellenzeilen werden möglichst nicht geteilt.
           ============================================= */

        table.setSplitRows(true);

        table.setSplitLate(true);


        /* =============================================
           WOCHENTAG

           Wird bei jedem Angebot angezeigt.
           ============================================= */

        PdfPCell dayCell = new PdfPCell(

                new Phrase(

                        wochentag

                                + " – "

                                + anzahlTagesAngebote

                                + " Angebote",

                        DAY_FONT
                )
        );

        dayCell.setColspan(5);

        dayCell.setBackgroundColor(
                PRIMARY_COLOR
        );

        dayCell.setPadding(9);

        dayCell.setBorder(
                PdfPCell.NO_BORDER
        );

        table.addCell(dayCell);


        /* =============================================
           ANGEBOTSNAME
           ============================================= */

        String angebotName =
                safe(angebot.getName());

        if (angebotName.isBlank()) {

            angebotName =
                    "Unbenanntes Angebot";
        }

        long anzahlTeilnehmer =
                teilnahmen.stream()

                        .map(teilnahme ->
                                teilnahme
                                        .getStudent()
                                        .getId()
                        )

                        .distinct()

                        .count();

        PdfPCell angebotHeader = new PdfPCell(

                new Phrase(

                        angebotName

                                + " ("

                                + anzahlTeilnehmer

                                + " Schüler)",

                        ANGEBOT_FONT
                )
        );

        angebotHeader.setColspan(5);

        angebotHeader.setBackgroundColor(
                SECONDARY_COLOR
        );

        angebotHeader.setBorderColor(
                BORDER_COLOR
        );

        angebotHeader.setPadding(7);

        table.addCell(
                angebotHeader
        );


        /* =============================================
           ANGEBOTSINFORMATIONEN
           ============================================= */

        String angebotInformationen =

                "Uhrzeit: "

                        + formatZeitraum(

                        angebot.getBeginn(),

                        angebot.getEnde()
                )

                        + "    |    Angebotsleitung: "

                        + valueOrDash(
                        angebot.getAngebotsleitung()
                )

                        + "    |    Angebotsart: "

                        + valueOrDash(
                        angebot.getAngebotsart()
                );

        PdfPCell infoCell = new PdfPCell(

                new Phrase(

                        angebotInformationen,

                        TEXT_FONT
                )
        );

        infoCell.setColspan(5);

        infoCell.setPadding(6);

        infoCell.setBorderColor(
                BORDER_COLOR
        );

        table.addCell(infoCell);


        /* =============================================
           TABELLENHEADER
           ============================================= */

        addHeaderCell(table, "Nr.");

        addHeaderCell(table, "Schüler");

        addHeaderCell(table, "Klasse");

        addHeaderCell(table, "Jahrgang");

        addHeaderCell(table, "Besonderheiten");


        /* =============================================
           KOPFZEILEN WIEDERHOLEN

           1. Wochentag
           2. Angebotsname
           3. Angebotsinformationen
           4. Tabellenüberschriften
           ============================================= */

        table.setHeaderRows(4);


        /* =============================================
           KEINE TEILNEHMER
           ============================================= */

        if (teilnahmen.isEmpty()) {

            PdfPCell emptyCell = new PdfPCell(

                    new Phrase(

                            "Keine Schüler zugeordnet.",

                            MUTED_FONT
                    )
            );

            emptyCell.setColspan(5);

            emptyCell.setPadding(8);

            emptyCell.setBorderColor(
                    BORDER_COLOR
            );

            table.addCell(emptyCell);

            return table;
        }


        /* =============================================
           SCHÜLER
           ============================================= */

        int rowIndex = 1;

        for (AngebotTeilnahme teilnahme : teilnahmen) {

            Student student =
                    teilnahme.getStudent();

            boolean alternate =
                    rowIndex % 2 == 0;

            addTextCell(

                    table,

                    String.valueOf(rowIndex),

                    alternate,

                    true
            );

            addTextCell(

                    table,

                    getStudentName(student),

                    alternate,

                    false
            );

            addTextCell(

                    table,

                    getKlassenName(student),

                    alternate,

                    false
            );

            addTextCell(

                    table,

                    student.getJahrgang() == null

                            ? "–"

                            : String.valueOf(
                            student.getJahrgang()
                    ),

                    alternate,

                    true
            );

            addTextCell(

                    table,

                    safe(
                            teilnahme.getBesonderheiten()
                    ),

                    alternate,

                    false
            );

            rowIndex++;
        }

        return table;
    }


    /* =====================================================
       HEADER CELL
       ===================================================== */

    private void addHeaderCell(

            PdfPTable table,

            String text

    ) {

        PdfPCell cell = new PdfPCell(

                new Phrase(

                        text,

                        HEADER_FONT
                )
        );

        cell.setBackgroundColor(
                TABLE_HEADER_COLOR
        );

        cell.setBorderColor(
                BORDER_COLOR
        );

        cell.setPadding(5);

        table.addCell(cell);
    }


    /* =====================================================
       TEXT CELL
       ===================================================== */

    private void addTextCell(

            PdfPTable table,

            String text,

            boolean alternate,

            boolean centered

    ) {

        PdfPCell cell = new PdfPCell(

                new Phrase(

                        safe(text),

                        TEXT_FONT
                )
        );

        cell.setPadding(4);

        cell.setBorderColor(
                BORDER_COLOR
        );

        cell.setVerticalAlignment(
                Element.ALIGN_MIDDLE
        );

        if (alternate) {

            cell.setBackgroundColor(
                    ALTERNATE_ROW_COLOR
            );
        }

        if (centered) {

            cell.setHorizontalAlignment(
                    Element.ALIGN_CENTER
            );
        }

        table.addCell(cell);
    }


    /* =====================================================
       TEILNAHMEN SORTIEREN
       ===================================================== */

    private void sortTeilnahmen(

            List<AngebotTeilnahme> teilnahmen,

            Collator collator

    ) {

        teilnahmen.sort(

                Comparator

                        .comparing(

                                (AngebotTeilnahme teilnahme) ->
                                        getKlassenName(
                                                teilnahme.getStudent()
                                        ),

                                collator
                        )

                        .thenComparing(

                                teilnahme ->
                                        safe(
                                                teilnahme
                                                        .getStudent()
                                                        .getNachname()
                                        ),

                                collator
                        )

                        .thenComparing(

                                teilnahme ->
                                        safe(
                                                teilnahme
                                                        .getStudent()
                                                        .getVorname()
                                        ),

                                collator
                        )
        );
    }


    /* =====================================================
       SCHÜLERNAME
       ===================================================== */

    private String getStudentName(Student student) {

        if (student == null) {

            return "–";
        }

        String nachname =
                safe(student.getNachname());

        String vorname =
                safe(student.getVorname());

        if (nachname.isBlank()) {

            return valueOrDash(vorname);
        }

        if (vorname.isBlank()) {

            return nachname;
        }

        return nachname + ", " + vorname;
    }


    /* =====================================================
       KLASSENNAME
       ===================================================== */

    private String getKlassenName(Student student) {

        if (student == null) {

            return "–";
        }

        if (
                student.getKlasseEntity() != null
                        &&
                        !safe(
                                student.getKlasseEntity()
                                        .getName()
                        ).isBlank()
        ) {

            return student.getKlasseEntity()
                    .getName();
        }

        return valueOrDash(
                student.getKlasse()
        );
    }


    /* =====================================================
       WOCHENTAG NORMALISIEREN
       ===================================================== */

    private String normalizeWochentag(String value) {

        String normalized =
                safe(value)

                        .toLowerCase(Locale.GERMAN)

                        .replace(".", "")

                        .trim();

        return switch (normalized) {

            case "montag", "mo", "monday", "mon" ->
                    "Montag";

            case "dienstag", "di", "tuesday", "tue" ->
                    "Dienstag";

            case "mittwoch", "mi", "wednesday", "wed" ->
                    "Mittwoch";

            case "donnerstag", "do", "thursday", "thu" ->
                    "Donnerstag";

            case "freitag", "fr", "friday", "fri" ->
                    "Freitag";

            case "samstag", "sa", "saturday", "sat" ->
                    "Samstag";

            case "sonntag", "so", "sunday", "sun" ->
                    "Sonntag";

            default ->
                    "Nicht zugeordnet";
        };
    }


    /* =====================================================
       WOCHENTAG SORTIERUNG
       ===================================================== */

    private int getWochentagPosition(String value) {

        return WOCHENTAGE.indexOf(
                normalizeWochentag(value)
        );
    }


    /* =====================================================
       UHRZEIT SORTIERUNG
       ===================================================== */

    private int getUhrzeitPosition(String value) {

        String time =
                safe(value);

        if (
                !time.matches(
                        "\\d{1,2}:\\d{2}(:\\d{2})?"
                )
        ) {

            return Integer.MAX_VALUE;
        }

        String[] parts =
                time.split(":");

        int hours =
                Integer.parseInt(parts[0]);

        int minutes =
                Integer.parseInt(parts[1]);

        if (
                hours > 23
                        ||
                        minutes > 59
        ) {

            return Integer.MAX_VALUE;
        }

        return hours * 60 + minutes;
    }


    /* =====================================================
       ZEITRAUM FORMATIEREN
       ===================================================== */

    private String formatZeitraum(

            String beginn,

            String ende

    ) {

        String start =
                formatTime(beginn);

        String finish =
                formatTime(ende);

        if (
                start.isBlank()
                        &&
                        finish.isBlank()
        ) {

            return "–";
        }

        if (start.isBlank()) {

            return "bis " + finish;
        }

        if (finish.isBlank()) {

            return "ab " + start;
        }

        return start + " – " + finish;
    }


    private String formatTime(String value) {

        String time =
                safe(value);

        if (
                time.matches(
                        "\\d{1,2}:\\d{2}:\\d{2}"
                )
        ) {

            return time.substring(
                    0,
                    time.lastIndexOf(":")
            );
        }

        return time;
    }


    /* =====================================================
       NULL SAFE
       ===================================================== */

    private String safe(String value) {

        return value == null

                ? ""

                : value.trim();
    }


    private String valueOrDash(String value) {

        String text =
                safe(value);

        return text.isBlank()

                ? "–"

                : text;
    }
}