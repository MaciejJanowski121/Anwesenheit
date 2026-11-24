package com.example.anwesenheit.service.export;

import com.example.anwesenheit.model.Klasse;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.model.TagesAnwesenheit;

import com.example.anwesenheit.repository.KlasseRepository;
import com.example.anwesenheit.repository.StudentRepository;
import com.example.anwesenheit.repository.TagesAnwesenheitRepository;

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
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;


@Service
@Transactional(readOnly = true)
public class AbwesenheitPdfExportService {

    /* =====================================================
       REPOSITORIES
       ===================================================== */

    private final StudentRepository studentRepository;

    private final KlasseRepository klasseRepository;

    private final TagesAnwesenheitRepository
            tagesAnwesenheitRepository;


    public AbwesenheitPdfExportService(
            StudentRepository studentRepository,
            KlasseRepository klasseRepository,
            TagesAnwesenheitRepository
                    tagesAnwesenheitRepository
    ) {

        this.studentRepository =
                studentRepository;

        this.klasseRepository =
                klasseRepository;

        this.tagesAnwesenheitRepository =
                tagesAnwesenheitRepository;
    }


    /* =====================================================
       FORMATIERUNG
       ===================================================== */

    private static final DateTimeFormatter DATUM_FORMAT =
            DateTimeFormatter.ofPattern(
                    "EEEE, dd.MM.yyyy",
                    Locale.GERMAN
            );

    private static final DateTimeFormatter UHRZEIT_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm");


    /* =====================================================
       KLASSENREIHENFOLGE
       ===================================================== */

    private static final List<String> KLASSEN_REIHENFOLGE =
            List.of(

                    // GS
                    "Erde",
                    "Feuer",
                    "Luft",
                    "Wasser",

                    // MS
                    "Merkur",
                    "Mars",
                    "Saturn",

                    // EKS
                    "Cassiopeia",
                    "Pegasus",
                    "Phönix",
                    "Taurus",

                    // PK
                    "Perseus",
                    "Sirius"
            );


    /* =====================================================
       KLASSENFARBEN NACH STUFE
       ===================================================== */

    private static final Color GS_FARBE =
            Color.decode("#da2f70");

    private static final Color MS_FARBE =
            Color.decode("#f49712");

    private static final Color EKS_FARBE =
            Color.decode("#4190a4");

    private static final Color PK_FARBE =
            Color.decode("#9ac32e");


    private static final Map<String, Color> KLASSEN_FARBEN =
            Map.ofEntries(

                    // GS – Magenta

                    Map.entry("erde", GS_FARBE),
                    Map.entry("feuer", GS_FARBE),
                    Map.entry("luft", GS_FARBE),
                    Map.entry("wasser", GS_FARBE),

                    // MS – Orange

                    Map.entry("merkur", MS_FARBE),
                    Map.entry("mars", MS_FARBE),
                    Map.entry("saturn", MS_FARBE),

                    // EKS – Blau

                    Map.entry("cassiopeia", EKS_FARBE),
                    Map.entry("pegasus", EKS_FARBE),
                    Map.entry("phönix", EKS_FARBE),
                    Map.entry("taurus", EKS_FARBE),

                    // PK – Grün

                    Map.entry("perseus", PK_FARBE),
                    Map.entry("sirius", PK_FARBE)
            );


    /* =====================================================
       SCHRIFTARTEN
       ===================================================== */

    private static final Font TITLE_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    18,
                    Color.BLACK
            );

    private static final Font DATE_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    12,
                    Color.DARK_GRAY
            );

    private static final Font HEADER_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    10,
                    Color.BLACK
            );

    private static final Font STUDENT_FONT =
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
       INTERNE DATENSTRUKTUREN
       ===================================================== */

    private record AbwesenheitEintrag(

            String name,

            String information

    ) {}


    private record KlassenBlock(

            String klassenName,

            int anzahlSchueler,

            List<AbwesenheitEintrag> abwesenheiten

    ) {}


    /* =====================================================
       PDF EXPORT
       ===================================================== */

    public byte[] exportAbwesenheiten(
            LocalDate datum
    ) throws DocumentException {

        if (datum == null) {

            throw new IllegalArgumentException(
                    "Das Datum darf nicht leer sein."
            );
        }


        /* =============================================
           DATEN LADEN
           ============================================= */

        List<Student> students =
                studentRepository.findAll();

        List<Klasse> klassen =
                klasseRepository.findAll();

        List<TagesAnwesenheit> anwesenheiten =
                tagesAnwesenheitRepository
                        .findByDatum(datum);


        /* =============================================
           KLASSENBLÖCKE ERSTELLEN
           ============================================= */

        List<KlassenBlock> klassenBloecke =
                createKlassenBloecke(
                        students,
                        klassen,
                        anwesenheiten
                );


        /* =============================================
           PDF DOKUMENT
           ============================================= */

        ByteArrayOutputStream outputStream =
                new ByteArrayOutputStream();

        Document document = new Document(

                PageSize.A4,

                24,

                24,

                24,

                24
        );

        PdfWriter.getInstance(
                document,
                outputStream
        );

        document.open();

        try {

            document.addTitle(
                    "Abwesenheitsliste " + datum
            );

            document.addCreator(
                    "Anwesenheitsverwaltung"
            );


            /* =========================================
               TITEL
               ========================================= */

            Paragraph title = new Paragraph(

                    "Abwesenheitsliste",

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

            Paragraph date = new Paragraph(

                    datum.format(DATUM_FORMAT),

                    DATE_FONT
            );

            date.setAlignment(
                    Element.ALIGN_CENTER
            );

            date.setSpacingAfter(14);

            document.add(date);


            /* =========================================
               GEMEINSAME ABWESENHEITSLISTE
               ========================================= */

            if (klassenBloecke.isEmpty()) {

                Paragraph paragraph =
                        new Paragraph(

                                "Keine Klassen vorhanden.",

                                MUTED_FONT
                        );

                document.add(paragraph);

            } else {

                PdfPTable klassenTabelle =
                        createKlassenTabelle(
                                klassenBloecke
                        );

                document.add(klassenTabelle);
            }


            /* =========================================
               HINWEIS
               ========================================= */

            Paragraph hinweis = new Paragraph(

                    "Grundlage: zentrale Tagesanwesenheit. "
                            + "Nicht erfasste Schüler werden "
                            + "nicht als fehlend aufgeführt.",

                    MUTED_FONT
            );

            hinweis.setSpacingBefore(12);

            document.add(hinweis);

        } finally {

            document.close();
        }

        return outputStream.toByteArray();
    }


    /* =====================================================
       KLASSENBLÖCKE ERSTELLEN
       ===================================================== */

    private List<KlassenBlock> createKlassenBloecke(

            List<Student> students,

            List<Klasse> klassen,

            List<TagesAnwesenheit> anwesenheiten

    ) {

        Map<String, KlassenBlock> klassenMap =
                new LinkedHashMap<>();


        /* =============================================
           ALLE KLASSEN INITIALISIEREN
           ============================================= */

        for (Klasse klasse : klassen) {

            if (
                    klasse.getName() != null
                            &&
                            !klasse.getName().isBlank()
            ) {

                String name =
                        klasse.getName().trim();

                String key =
                        normalizeKlassenName(name);

                klassenMap.putIfAbsent(

                        key,

                        new KlassenBlock(

                                name,

                                0,

                                new ArrayList<>()
                        )
                );
            }
        }


        /* =============================================
           SCHÜLER PRO KLASSE ZÄHLEN
           ============================================= */

        Map<Long, String> studentKlassen =
                new HashMap<>();

        Map<Long, Student> studentMap =
                new HashMap<>();


        for (Student student : students) {

            String klassenName =
                    getKlassenName(student);

            String klassenKey =
                    normalizeKlassenName(klassenName);

            studentKlassen.put(

                    student.getId(),

                    klassenKey
            );

            studentMap.put(

                    student.getId(),

                    student
            );

            KlassenBlock block =
                    klassenMap.get(klassenKey);

            if (block == null) {

                block = new KlassenBlock(

                        klassenName,

                        0,

                        new ArrayList<>()
                );
            }

            klassenMap.put(

                    klassenKey,

                    new KlassenBlock(

                            block.klassenName(),

                            block.anzahlSchueler() + 1,

                            block.abwesenheiten()
                    )
            );
        }


        /* =============================================
           ABWESENHEITEN ZUORDNEN
           ============================================= */

        for (
                TagesAnwesenheit anwesenheit :
                anwesenheiten
        ) {

            if (anwesenheit.getStudent() == null) {

                continue;
            }

            Long studentId =
                    anwesenheit.getStudent().getId();

            Student student =
                    studentMap.get(studentId);

            if (student == null) {

                continue;
            }

            String klassenKey =
                    studentKlassen.get(studentId);

            KlassenBlock block =
                    klassenMap.get(klassenKey);

            if (block == null) {

                continue;
            }


            /* =========================================
               ABWESENHEIT PRÜFEN
               ========================================= */

            boolean ganztagFehlend =
                    "FEHLT".equalsIgnoreCase(
                            anwesenheit.getStatus()
                    );

            boolean teilweiseAbwesend =

                    anwesenheit.getAbwesendAb() != null

                            ||

                            anwesenheit.getAbwesendBis() != null

                            ||

                            anwesenheit.getAbwesendAb2() != null

                            ||

                            anwesenheit.getAbwesendBis2() != null;


            /*
             * Nur tatsächlich abwesende Schüler
             * werden in die Liste aufgenommen.
             */

            if (
                    !ganztagFehlend
                            &&
                            !teilweiseAbwesend
            ) {

                continue;
            }


            /* =========================================
               SCHÜLERNAME UND INFORMATION
               ========================================= */

            String studentName =
                    getStudentName(student);

            String information =
                    createAbwesenheitsInformation(
                            anwesenheit
                    );

            block.abwesenheiten().add(

                    new AbwesenheitEintrag(

                            studentName,

                            information
                    )
            );
        }


        /* =============================================
           SCHÜLER SORTIEREN
           ============================================= */

        Collator collator =
                Collator.getInstance(Locale.GERMAN);

        Comparator<AbwesenheitEintrag> studentComparator =
                (a, b) -> collator.compare(

                        a.name(),

                        b.name()
                );

        for (KlassenBlock block : klassenMap.values()) {

            block.abwesenheiten()
                    .sort(studentComparator);
        }


        /* =============================================
           KLASSEN SORTIEREN
           ============================================= */

        return klassenMap.values()

                .stream()

                .sorted(

                        Comparator

                                .comparingInt(
                                        (KlassenBlock block) ->
                                                getKlassenPosition(
                                                        block.klassenName()
                                                )
                                )

                                .thenComparing(
                                        KlassenBlock::klassenName,
                                        String.CASE_INSENSITIVE_ORDER
                                )
                )

                .toList();
    }


    /* =====================================================
       ABWESENHEITSINFORMATION ERSTELLEN

       Klammern werden nur angezeigt, wenn mindestens
       eine Uhrzeit oder ein Abwesenheitsgrund vorhanden ist.
       ===================================================== */

    private String createAbwesenheitsInformation(
            TagesAnwesenheit anwesenheit
    ) {

        List<String> informationen =
                new ArrayList<>();


        /* Erster Abwesenheitszeitraum */

        String ersterZeitraum =
                formatAbwesenheitsZeitraum(

                        anwesenheit.getAbwesendAb(),

                        anwesenheit.getAbwesendBis(),

                        anwesenheit.getGrundAbwesenheit()
                );

        if (!ersterZeitraum.isBlank()) {

            informationen.add(ersterZeitraum);
        }


        /* Zweiter Abwesenheitszeitraum */

        String zweiterZeitraum =
                formatAbwesenheitsZeitraum(

                        anwesenheit.getAbwesendAb2(),

                        anwesenheit.getAbwesendBis2(),

                        anwesenheit.getGrundAbwesenheit2()
                );

        if (!zweiterZeitraum.isBlank()) {

            informationen.add(zweiterZeitraum);
        }


        return String.join(
                "; ",
                informationen
        );
    }


    /* =====================================================
       EINZELNEN ABWESENHEITSZEITRAUM FORMATIEREN
       ===================================================== */

    private String formatAbwesenheitsZeitraum(

            LocalTime abwesendAb,

            LocalTime abwesendBis,

            String grund

    ) {

        List<String> informationen =
                new ArrayList<>();


        /* Ab und bis */

        if (
                abwesendAb != null
                        &&
                        abwesendBis != null
        ) {

            informationen.add(

                    formatTime(abwesendAb)

                            + " – "

                            + formatTime(abwesendBis)
            );

        } else if (abwesendAb != null) {

            informationen.add(

                    "ab " + formatTime(abwesendAb)
            );

        } else if (abwesendBis != null) {

            informationen.add(

                    "bis " + formatTime(abwesendBis)
            );
        }


        /* Abwesenheitsgrund */

        if (
                grund != null
                        &&
                        !grund.isBlank()
        ) {

            informationen.add(
                    grund.trim()
            );
        }


        return String.join(

                ", ",

                informationen
        );
    }


    /* =====================================================
       KLASSENTABELLE

       Jede Klasse wird nur einmal angezeigt.
       Drei Klassen pro Tabellenzeile.
       ===================================================== */

    private PdfPTable createKlassenTabelle(

            List<KlassenBlock> klassenBloecke

    ) {

        PdfPTable table =
                new PdfPTable(3);

        table.setWidthPercentage(100);

        table.setSpacingAfter(12);

        table.setSplitRows(true);

        table.setSplitLate(false);


        for (KlassenBlock block : klassenBloecke) {

            PdfPTable klassenTabelle =
                    createKlassenBlock(block);

            PdfPCell wrapper =
                    new PdfPCell(klassenTabelle);

            wrapper.setBorder(
                    PdfPCell.NO_BORDER
            );

            wrapper.setPadding(3);

            wrapper.setVerticalAlignment(
                    Element.ALIGN_TOP
            );

            table.addCell(wrapper);
        }


        /* =============================================
           LETZTE ZEILE AUFFÜLLEN
           ============================================= */

        int rest =
                klassenBloecke.size() % 3;

        if (rest != 0) {

            for (
                    int i = rest;
                    i < 3;
                    i++
            ) {

                PdfPCell empty =
                        new PdfPCell(
                                new Phrase("")
                        );

                empty.setBorder(
                        PdfPCell.NO_BORDER
                );

                table.addCell(empty);
            }
        }

        return table;
    }


    /* =====================================================
       EINZELNER KLASSENBLOCK
       ===================================================== */

    private PdfPTable createKlassenBlock(

            KlassenBlock block

    ) {

        PdfPTable table =
                new PdfPTable(1);

        table.setWidthPercentage(100);


        /* =============================================
           KLASSENHEADER
           ============================================= */

        PdfPCell header = new PdfPCell(

                new Phrase(

                        block.klassenName()

                                + " ("

                                + block.anzahlSchueler()

                                + ")",

                        HEADER_FONT
                )
        );

        header.setBackgroundColor(

                getKlassenFarbe(
                        block.klassenName()
                )
        );

        header.setHorizontalAlignment(
                Element.ALIGN_CENTER
        );

        header.setVerticalAlignment(
                Element.ALIGN_MIDDLE
        );

        header.setPadding(6);

        header.setBorderColor(
                new Color(180, 180, 180)
        );

        table.addCell(header);


        /* =============================================
           ABWESENDE SCHÜLER
           ============================================= */

        List<AbwesenheitEintrag> eintraege =
                block.abwesenheiten();


        if (eintraege.isEmpty()) {

            PdfPCell emptyCell =
                    new PdfPCell(

                            new Phrase(

                                    "–",

                                    MUTED_FONT
                            )
                    );

            emptyCell.setPadding(5);

            emptyCell.setMinimumHeight(20);

            emptyCell.setHorizontalAlignment(
                    Element.ALIGN_CENTER
            );

            emptyCell.setBorderColor(
                    new Color(210, 210, 210)
            );

            table.addCell(emptyCell);

        } else {

            for (
                    AbwesenheitEintrag eintrag :
                    eintraege
            ) {

                /* =====================================
                   KLAMMERN NUR BEI INFORMATIONEN
                   ===================================== */

                String text =
                        eintrag.name();

                if (
                        eintrag.information() != null
                                &&
                                !eintrag.information().isBlank()
                ) {

                    text +=

                            " ("

                                    + eintrag.information()

                                    + ")";
                }


                PdfPCell studentCell =
                        new PdfPCell(

                                new Phrase(

                                        text,

                                        STUDENT_FONT
                                )
                        );

                studentCell.setPadding(4);

                studentCell.setBorderColor(
                        new Color(210, 210, 210)
                );

                studentCell.setVerticalAlignment(
                        Element.ALIGN_MIDDLE
                );

                table.addCell(studentCell);
            }
        }

        return table;
    }


    /* =====================================================
       KLASSENNAME
       ===================================================== */

    private String getKlassenName(Student student) {

        if (
                student.getKlasseEntity() != null
                        &&
                        student.getKlasseEntity().getName() != null
                        &&
                        !student.getKlasseEntity().getName().isBlank()
        ) {

            return student
                    .getKlasseEntity()
                    .getName()
                    .trim();
        }

        if (
                student.getKlasse() != null
                        &&
                        !student.getKlasse().isBlank()
        ) {

            return student
                    .getKlasse()
                    .trim();
        }

        return "Ohne Klasse";
    }


    /* =====================================================
       KLASSENNAME NORMALISIEREN
       ===================================================== */

    private String normalizeKlassenName(
            String klassenName
    ) {

        return klassenName
                .trim()
                .toLowerCase(Locale.GERMAN);
    }


    /* =====================================================
       SCHÜLERNAME
       ===================================================== */

    private String getStudentName(Student student) {

        String nachname =
                student.getNachname() == null

                        ? ""

                        : student.getNachname().trim();

        String vorname =
                student.getVorname() == null

                        ? ""

                        : student.getVorname().trim();

        if (nachname.isBlank()) {

            return vorname;
        }

        if (vorname.isBlank()) {

            return nachname;
        }

        return nachname + ", " + vorname;
    }


    /* =====================================================
       UHRZEIT FORMATIEREN
       ===================================================== */

    private String formatTime(LocalTime time) {

        return time == null

                ? ""

                : time.format(UHRZEIT_FORMAT);
    }


    /* =====================================================
       KLASSENPOSITION
       ===================================================== */

    private int getKlassenPosition(
            String klassenName
    ) {

        for (
                int i = 0;
                i < KLASSEN_REIHENFOLGE.size();
                i++
        ) {

            if (
                    KLASSEN_REIHENFOLGE
                            .get(i)
                            .equalsIgnoreCase(klassenName)
            ) {

                return i;
            }
        }

        return Integer.MAX_VALUE;
    }


    /* =====================================================
       KLASSENFARBE
       ===================================================== */

    private Color getKlassenFarbe(
            String klassenName
    ) {

        return KLASSEN_FARBEN.getOrDefault(

                normalizeKlassenName(klassenName),

                new Color(220, 220, 220)
        );
    }
}