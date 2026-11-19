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
                    "Erde",
                    "Feuer",
                    "Luft",
                    "Wasser",
                    "Mars",
                    "Merkur",
                    "Saturn",
                    "Sirius",
                    "Cassiopeia",
                    "Pegasus",
                    "Phönix",
                    "Taurus",
                    "Perseus"
            );


    /* =====================================================
       KLASSENFARBEN
       ===================================================== */

    private static final Map<String, Color> KLASSEN_FARBEN =
            Map.ofEntries(

                    Map.entry(
                            "erde",
                            new Color(139, 195, 74)
                    ),

                    Map.entry(
                            "feuer",
                            new Color(239, 83, 80)
                    ),

                    Map.entry(
                            "luft",
                            new Color(255, 213, 79)
                    ),

                    Map.entry(
                            "wasser",
                            new Color(79, 195, 247)
                    ),

                    Map.entry(
                            "mars",
                            new Color(255, 138, 101)
                    ),

                    Map.entry(
                            "merkur",
                            new Color(186, 104, 200)
                    ),

                    Map.entry(
                            "saturn",
                            new Color(255, 183, 77)
                    ),

                    Map.entry(
                            "sirius",
                            new Color(100, 181, 246)
                    ),

                    Map.entry(
                            "cassiopeia",
                            new Color(240, 140, 180)
                    ),

                    Map.entry(
                            "pegasus",
                            new Color(77, 182, 172)
                    ),

                    Map.entry(
                            "phönix",
                            new Color(255, 167, 38)
                    ),

                    Map.entry(
                            "taurus",
                            new Color(174, 213, 129)
                    ),

                    Map.entry(
                            "perseus",
                            new Color(159, 168, 218)
                    )
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

    private static final Font SECTION_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    12,
                    Color.BLACK
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

            String zeitraum

    ) {
    }


    private record KlassenBlock(

            String klassenName,

            int anzahlSchueler,

            List<AbwesenheitEintrag> vormittag,

            List<AbwesenheitEintrag> abwesendAb

    ) {
    }


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
               GANZTÄGIG / ABWESEND BIS
               ========================================= */

            addSectionTitle(

                    document,

                    "Fehlt / Abwesend bis"
            );

            PdfPTable vormittagTabelle =
                    createKlassenTabelle(
                            klassenBloecke,
                            false
                    );

            document.add(vormittagTabelle);


            /* =========================================
               ABWESEND AB
               ========================================= */

            addSectionTitle(

                    document,

                    "Abwesend ab"
            );

            List<KlassenBlock> nachmittagBloecke =
                    klassenBloecke.stream()

                            .filter(block ->
                                    !block.abwesendAb().isEmpty()
                            )

                            .toList();

            if (nachmittagBloecke.isEmpty()) {

                Paragraph paragraph =
                        new Paragraph(

                                "Keine Einträge vorhanden.",

                                MUTED_FONT
                        );

                paragraph.setSpacingAfter(8);

                document.add(paragraph);

            } else {

                PdfPTable nachmittagTabelle =
                        createKlassenTabelle(

                                nachmittagBloecke,

                                true
                        );

                document.add(nachmittagTabelle);
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

                klassenMap.put(

                        name,

                        new KlassenBlock(

                                name,

                                0,

                                new ArrayList<>(),

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

            studentKlassen.put(

                    student.getId(),

                    klassenName
            );

            studentMap.put(

                    student.getId(),

                    student
            );

            KlassenBlock block =
                    klassenMap.get(klassenName);

            if (block == null) {

                block = new KlassenBlock(

                        klassenName,

                        0,

                        new ArrayList<>(),

                        new ArrayList<>()
                );
            }

            klassenMap.put(

                    klassenName,

                    new KlassenBlock(

                            klassenName,

                            block.anzahlSchueler() + 1,

                            block.vormittag(),

                            block.abwesendAb()
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

            String klassenName =
                    studentKlassen.get(studentId);

            KlassenBlock block =
                    klassenMap.get(klassenName);

            if (block == null) {

                continue;
            }

            String studentName =
                    getStudentName(student);

            LocalTime abwesendAb =
                    anwesenheit.getAbwesendAb();

            LocalTime abwesendBis =
                    anwesenheit.getAbwesendBis();


            /* =========================================
               GANZTÄGIG FEHLEND
               ========================================= */

            if (
                    "FEHLT".equalsIgnoreCase(
                            anwesenheit.getStatus()
                    )
            ) {

                block.vormittag().add(

                        new AbwesenheitEintrag(

                                studentName,

                                "fehlt"
                        )
                );

                continue;
            }


            /* =========================================
               ZEITRAUM: AB UND BIS
               ========================================= */

            if (
                    abwesendAb != null
                            &&
                            abwesendBis != null
            ) {

                block.abwesendAb().add(

                        new AbwesenheitEintrag(

                                studentName,

                                formatTime(abwesendAb)

                                        + " – "

                                        + formatTime(abwesendBis)
                        )
                );

                continue;
            }


            /* =========================================
               ABWESEND BIS
               ========================================= */

            if (abwesendBis != null) {

                block.vormittag().add(

                        new AbwesenheitEintrag(

                                studentName,

                                "bis "
                                        + formatTime(abwesendBis)
                        )
                );

                continue;
            }


            /* =========================================
               ABWESEND AB
               ========================================= */

            if (abwesendAb != null) {

                block.abwesendAb().add(

                        new AbwesenheitEintrag(

                                studentName,

                                "ab "
                                        + formatTime(abwesendAb)
                        )
                );
            }
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

            block.vormittag().sort(studentComparator);

            block.abwesendAb().sort(studentComparator);
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
       KLASSENTABELLE

       Drei Klassen pro Tabellenzeile.
       ===================================================== */

    private PdfPTable createKlassenTabelle(

            List<KlassenBlock> klassenBloecke,

            boolean abwesendAb

    ) {

        PdfPTable table =
                new PdfPTable(3);

        table.setWidthPercentage(100);

        table.setSpacingAfter(12);

        table.setSplitRows(true);

        table.setSplitLate(false);


        for (KlassenBlock block : klassenBloecke) {

            PdfPTable klassenTabelle =
                    createKlassenBlock(

                            block,

                            abwesendAb
                    );

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

            KlassenBlock block,

            boolean abwesendAb

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

                abwesendAb

                        ? block.abwesendAb()

                        : block.vormittag();


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

                String text =
                        eintrag.name()

                                + " ("

                                + eintrag.zeitraum()

                                + ")";

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
       ABSCHNITTSÜBERSCHRIFT
       ===================================================== */

    private void addSectionTitle(

            Document document,

            String text

    ) throws DocumentException {

        Paragraph paragraph =
                new Paragraph(

                        text,

                        SECTION_FONT
                );

        paragraph.setSpacingBefore(8);

        paragraph.setSpacingAfter(6);

        document.add(paragraph);
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

    private int getKlassenPosition(String klassenName) {

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

    private Color getKlassenFarbe(String klassenName) {

        return KLASSEN_FARBEN.getOrDefault(

                klassenName
                        .trim()
                        .toLowerCase(Locale.GERMAN),

                new Color(220, 220, 220)
        );
    }
}