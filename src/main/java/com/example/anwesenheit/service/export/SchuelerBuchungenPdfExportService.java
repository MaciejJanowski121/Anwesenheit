package com.example.anwesenheit.service.export;

import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Angebot;
import com.example.anwesenheit.model.AngebotTeilnahme;

import com.example.anwesenheit.repository.StudentRepository;
import com.example.anwesenheit.repository.BuchungRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;


@Service
@Transactional(readOnly = true)
public class SchuelerBuchungenPdfExportService {

    /* =====================================================
       REPOSITORIES
       ===================================================== */

    private final StudentRepository studentRepository;

    private final BuchungRepository buchungRepository;

    private final AngebotTeilnahmeRepository
            angebotTeilnahmeRepository;


    public SchuelerBuchungenPdfExportService(
            StudentRepository studentRepository,
            BuchungRepository buchungRepository,
            AngebotTeilnahmeRepository angebotTeilnahmeRepository
    ) {

        this.studentRepository = studentRepository;

        this.buchungRepository = buchungRepository;

        this.angebotTeilnahmeRepository =
                angebotTeilnahmeRepository;
    }


    /* =====================================================
       FARBEN
       ===================================================== */

    private static final Color PRIMARY_COLOR =
            new Color(67, 75, 100);

    private static final Color STUDENT_HEADER_COLOR =
            new Color(229, 233, 242);

    private static final Color ANA_COLOR =
            new Color(224, 239, 247);

    private static final Color ANGEBOT_COLOR =
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

    private static final Font CLASS_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    13,
                    Color.WHITE
            );

    private static final Font STUDENT_FONT =
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


    private static final DateTimeFormatter DATUM_FORMAT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy");


    /* =====================================================
       INTERNE DATENSTRUKTUR

       Gemeinsame Darstellung für ANA und Angebote.
       ===================================================== */

    private record BuchungsEintrag(

            String typ,

            String name,

            String wochentag,

            String beginn,

            String ende,

            String leitung,

            String besonderheiten

    ) {
    }


    /* =====================================================
       PDF EXPORT
       ===================================================== */

    public byte[] exportSchuelerBuchungen()
            throws DocumentException {

        /* =============================================
           DATEN LADEN
           ============================================= */

        List<Student> students =
                new ArrayList<>(
                        studentRepository.findAll()
                );

        List<Buchung> buchungen =
                buchungRepository.findAll();

        List<AngebotTeilnahme> teilnahmen =
                angebotTeilnahmeRepository.findAll();


        /* =============================================
           BUCHUNGEN PRO SCHÜLER
           ============================================= */

        Map<Long, List<BuchungsEintrag>>
                buchungenByStudent =
                new HashMap<>();


        /* =============================================
           ANA-BUCHUNGEN
           ============================================= */

        for (Buchung buchung : buchungen) {

            if (
                    buchung.getStudent() == null
                            ||
                            buchung.getKurs() == null
            ) {

                continue;
            }

            Long studentId =
                    buchung.getStudent().getId();

            Kurs kurs =
                    buchung.getKurs();

            BuchungsEintrag eintrag =
                    new BuchungsEintrag(

                            "ANA",

                            valueOrDash(kurs.getName()),

                            normalizeWochentag(
                                    kurs.getWochentag()
                            ),

                            kurs.getUhrzeit(),

                            kurs.getUhrzeitEnde(),

                            kurs.getKursleitung(),

                            buchung.getBesonderheiten()
                    );

            buchungenByStudent

                    .computeIfAbsent(
                            studentId,
                            id -> new ArrayList<>()
                    )

                    .add(eintrag);
        }


        /* =============================================
           ANGEBOTSBUCHUNGEN
           ============================================= */

        for (AngebotTeilnahme teilnahme : teilnahmen) {

            if (
                    teilnahme.getStudent() == null
                            ||
                            teilnahme.getAngebot() == null
            ) {

                continue;
            }

            Long studentId =
                    teilnahme.getStudent().getId();

            Angebot angebot =
                    teilnahme.getAngebot();

            BuchungsEintrag eintrag =
                    new BuchungsEintrag(

                            "Angebot",

                            valueOrDash(
                                    angebot.getName()
                            ),

                            normalizeWochentag(
                                    angebot.getWochentag()
                            ),

                            angebot.getBeginn(),

                            angebot.getEnde(),

                            angebot.getAngebotsleitung(),

                            teilnahme.getBesonderheiten()
                    );

            buchungenByStudent

                    .computeIfAbsent(
                            studentId,
                            id -> new ArrayList<>()
                    )

                    .add(eintrag);
        }


        /* =============================================
           SCHÜLER SORTIEREN
           ============================================= */

        Collator collator =
                Collator.getInstance(Locale.GERMAN);

        students.sort(

                Comparator

                        .comparing(
                                (Student student) ->
                                        getKlassenName(student),
                                collator
                        )

                        .thenComparing(
                                student ->
                                        safe(student.getNachname()),
                                collator
                        )

                        .thenComparing(
                                student ->
                                        safe(student.getVorname()),
                                collator
                        )

                        .thenComparing(Student::getId)
        );


        /* =============================================
           GESAMTSTATISTIK
           ============================================= */

        long anzahlAnaBuchungen =
                buchungenByStudent.values()

                        .stream()

                        .flatMap(List::stream)

                        .filter(eintrag ->
                                "ANA".equals(eintrag.typ())
                        )

                        .count();

        long anzahlAngebotsbuchungen =
                buchungenByStudent.values()

                        .stream()

                        .flatMap(List::stream)

                        .filter(eintrag ->
                                "Angebot".equals(eintrag.typ())
                        )

                        .count();

        long schuelerMitBuchungen =
                students.stream()

                        .filter(student ->
                                buchungenByStudent.containsKey(
                                        student.getId()
                                )
                        )

                        .count();


        /* =============================================
           PDF DOKUMENT

           Querformat für sechs Tabellenspalten.
           ============================================= */

        ByteArrayOutputStream outputStream =
                new ByteArrayOutputStream();

        Document document = new Document(

                PageSize.A4.rotate(),

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
                "Schülerbuchungen"
        );

        document.addCreator(
                "Anwesenheitsverwaltung"
        );

        document.open();

        try {

            /* =========================================
               TITEL
               ========================================= */

            Paragraph title =
                    new Paragraph(

                            "Schülerbuchungen",

                            TITLE_FONT
                    );

            title.setAlignment(
                    Element.ALIGN_CENTER
            );

            title.setSpacingAfter(5);

            document.add(title);


            /* =========================================
               DATUM
               ========================================= */

            String datum =
                    LocalDate.now(
                            ZoneId.of("Europe/Berlin")
                    ).format(DATUM_FORMAT);

            Paragraph subtitle =
                    new Paragraph(

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

                            students.size(),

                            schuelerMitBuchungen,

                            anzahlAnaBuchungen,

                            anzahlAngebotsbuchungen
                    )
            );


            /* =========================================
               KEINE SCHÜLER
               ========================================= */

            if (students.isEmpty()) {

                document.add(

                        new Paragraph(

                                "Keine Schüler vorhanden.",

                                TEXT_FONT
                        )
                );
            }


            /* =========================================
               SCHÜLER UND BUCHUNGEN
               ========================================= */

            String letzteKlasse = null;

            for (Student student : students) {

                String klassenName =
                        getKlassenName(student);

                boolean neueKlasse =
                        !klassenName.equals(letzteKlasse);

                List<BuchungsEintrag>
                        studentBuchungen =

                        new ArrayList<>(

                                buchungenByStudent
                                        .getOrDefault(

                                                student.getId(),

                                                List.of()
                                        )
                        );

                sortBuchungen(

                        studentBuchungen,

                        collator
                );

                PdfPTable studentTabelle =
                        createStudentTabelle(

                                student,

                                studentBuchungen,

                                neueKlasse
                        );

                document.add(studentTabelle);

                letzteKlasse = klassenName;
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

            long anzahlSchueler,

            long schuelerMitBuchungen,

            long anzahlAnaBuchungen,

            long anzahlAngebotsbuchungen

    ) {

        PdfPTable table =
                new PdfPTable(4);

        table.setWidthPercentage(100);

        table.setSpacingAfter(15);

        addStatistikCell(

                table,

                "Schüler gesamt",

                anzahlSchueler,

                STUDENT_HEADER_COLOR
        );

        addStatistikCell(

                table,

                "Schüler mit Buchungen",

                schuelerMitBuchungen,

                STUDENT_HEADER_COLOR
        );

        addStatistikCell(

                table,

                "ANA-Buchungen",

                anzahlAnaBuchungen,

                ANA_COLOR
        );

        addStatistikCell(

                table,

                "Angebotsbuchungen",

                anzahlAngebotsbuchungen,

                ANGEBOT_COLOR
        );

        return table;
    }


    private void addStatistikCell(

            PdfPTable table,

            String label,

            long value,

            Color background

    ) {

        PdfPCell cell = new PdfPCell(

                new Phrase(

                        label + ": " + value,

                        STUDENT_FONT
                )
        );

        cell.setBackgroundColor(background);

        cell.setBorderColor(BORDER_COLOR);

        cell.setHorizontalAlignment(
                Element.ALIGN_CENTER
        );

        cell.setPadding(10);

        table.addCell(cell);
    }


    /* =====================================================
       SCHÜLERTABELLE
       ===================================================== */

    private PdfPTable createStudentTabelle(

            Student student,

            List<BuchungsEintrag> buchungen,

            boolean neueKlasse

    ) throws DocumentException {

        PdfPTable table =
                new PdfPTable(6);

        table.setWidthPercentage(100);

        table.setWidths(

                new float[]{

                        1.5f,

                        1.1f,

                        3.2f,

                        1.8f,

                        2.3f,

                        3.4f
                }
        );

        table.setSpacingBefore(8);

        table.setSpacingAfter(8);

        table.setSplitRows(true);

        table.setSplitLate(false);


        /* =============================================
           KLASSENÜBERSCHRIFT
           ============================================= */

        if (neueKlasse) {

            PdfPCell classCell = new PdfPCell(

                    new Phrase(

                            "Klasse: "
                                    + getKlassenName(student),

                            CLASS_FONT
                    )
            );

            classCell.setColspan(6);

            classCell.setBackgroundColor(
                    PRIMARY_COLOR
            );

            classCell.setPadding(9);

            classCell.setBorder(
                    PdfPCell.NO_BORDER
            );

            table.addCell(classCell);
        }


        /* =============================================
           SCHÜLERINFORMATIONEN
           ============================================= */

        String jahrgang =

                student.getJahrgang() == null

                        ? "–"

                        : String.valueOf(
                        student.getJahrgang()
                );

        String studentInformationen =

                getStudentName(student)

                        + "   |   Klasse: "

                        + getKlassenName(student)

                        + "   |   Jahrgang: "

                        + jahrgang;

        PdfPCell studentCell = new PdfPCell(

                new Phrase(

                        studentInformationen,

                        STUDENT_FONT
                )
        );

        studentCell.setColspan(6);

        studentCell.setBackgroundColor(
                STUDENT_HEADER_COLOR
        );

        studentCell.setBorderColor(
                BORDER_COLOR
        );

        studentCell.setPadding(7);

        table.addCell(studentCell);


        /* =============================================
           BUCHUNGSSTATISTIK PRO SCHÜLER
           ============================================= */

        long anzahlAna =
                buchungen.stream()

                        .filter(eintrag ->
                                "ANA".equals(eintrag.typ())
                        )

                        .count();

        long anzahlAngebote =
                buchungen.stream()

                        .filter(eintrag ->
                                "Angebot".equals(eintrag.typ())
                        )

                        .count();

        String statistik =

                "ANA-Buchungen: "

                        + anzahlAna

                        + "    |    Angebote: "

                        + anzahlAngebote

                        + "    |    Gesamt: "

                        + buchungen.size();

        PdfPCell statistikCell = new PdfPCell(

                new Phrase(

                        statistik,

                        TEXT_FONT
                )
        );

        statistikCell.setColspan(6);

        statistikCell.setPadding(6);

        statistikCell.setBorderColor(
                BORDER_COLOR
        );

        table.addCell(statistikCell);


        /* =============================================
           TABELLENHEADER
           ============================================= */

        addHeaderCell(table, "Wochentag");

        addHeaderCell(table, "Typ");

        addHeaderCell(table, "Name");

        addHeaderCell(table, "Uhrzeit");

        addHeaderCell(table, "Leitung");

        addHeaderCell(table, "Besonderheiten");


        /*
         * Kopfzeilen bei Seitenumbrüchen wiederholen.
         */
        table.setHeaderRows(
                neueKlasse ? 4 : 3
        );


        /* =============================================
           KEINE BUCHUNGEN
           ============================================= */

        if (buchungen.isEmpty()) {

            PdfPCell emptyCell = new PdfPCell(

                    new Phrase(

                            "Keine Buchungen vorhanden.",

                            MUTED_FONT
                    )
            );

            emptyCell.setColspan(6);

            emptyCell.setPadding(8);

            emptyCell.setBorderColor(
                    BORDER_COLOR
            );

            table.addCell(emptyCell);

            return table;
        }


        /* =============================================
           BUCHUNGEN
           ============================================= */

        int rowIndex = 0;

        for (BuchungsEintrag eintrag : buchungen) {

            boolean alternate =
                    rowIndex % 2 != 0;

            addTextCell(

                    table,

                    eintrag.wochentag(),

                    alternate
            );

            addTypCell(

                    table,

                    eintrag.typ()
            );

            addTextCell(

                    table,

                    eintrag.name(),

                    alternate
            );

            addTextCell(

                    table,

                    formatZeitraum(

                            eintrag.beginn(),

                            eintrag.ende()
                    ),

                    alternate
            );

            addTextCell(

                    table,

                    valueOrDash(
                            eintrag.leitung()
                    ),

                    alternate
            );

            addTextCell(

                    table,

                    safe(
                            eintrag.besonderheiten()
                    ),

                    alternate
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

            boolean alternate

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

        table.addCell(cell);
    }


    /* =====================================================
       TYP CELL

       ANA = Blau
       Angebot = Grün
       ===================================================== */

    private void addTypCell(

            PdfPTable table,

            String typ

    ) {

        PdfPCell cell = new PdfPCell(

                new Phrase(

                        typ,

                        HEADER_FONT
                )
        );

        cell.setBackgroundColor(

                "ANA".equals(typ)

                        ? ANA_COLOR

                        : ANGEBOT_COLOR
        );

        cell.setHorizontalAlignment(
                Element.ALIGN_CENTER
        );

        cell.setVerticalAlignment(
                Element.ALIGN_MIDDLE
        );

        cell.setPadding(4);

        cell.setBorderColor(
                BORDER_COLOR
        );

        table.addCell(cell);
    }


    /* =====================================================
       BUCHUNGEN SORTIEREN
       ===================================================== */

    private void sortBuchungen(

            List<BuchungsEintrag> buchungen,

            Collator collator

    ) {

        buchungen.sort(

                Comparator

                        .comparingInt(
                                (BuchungsEintrag eintrag) ->
                                        WOCHENTAGE.indexOf(
                                                eintrag.wochentag()
                                        )
                        )

                        .thenComparingInt(
                                eintrag ->
                                        getUhrzeitPosition(
                                                eintrag.beginn()
                                        )
                        )

                        .thenComparing(
                                BuchungsEintrag::name,
                                collator
                        )

                        .thenComparing(
                                BuchungsEintrag::typ
                        )
        );
    }


    /* =====================================================
       SCHÜLERNAME
       ===================================================== */

    private String getStudentName(Student student) {

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

        if (
                student.getKlasseEntity() != null
                        &&
                        !safe(
                                student.getKlasseEntity().getName()
                        ).isBlank()
        ) {

            return safe(
                    student.getKlasseEntity().getName()
            );
        }

        String klasse =
                safe(student.getKlasse());

        return klasse.isBlank()

                ? "Ohne Klasse"

                : klasse;
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