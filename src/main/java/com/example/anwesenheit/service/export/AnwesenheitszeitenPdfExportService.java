package com.example.anwesenheit.service.export;

import com.example.anwesenheit.dto.AnwesenheitszeitenResponse;
import com.example.anwesenheit.model.AnwesenheitszeitenFilter;
import com.example.anwesenheit.service.AnwesenheitszeitenService;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;

import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.BasicStroke;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import java.util.List;
import java.util.Locale;


@Service
public class AnwesenheitszeitenPdfExportService {

    private final AnwesenheitszeitenService
            anwesenheitszeitenService;

    public AnwesenheitszeitenPdfExportService(
            AnwesenheitszeitenService anwesenheitszeitenService
    ) {
        this.anwesenheitszeitenService =
                anwesenheitszeitenService;
    }


    /* =====================================================
       FORMATIERUNG
       ===================================================== */

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm");

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy");


    /* =====================================================
       FARBEN
       ===================================================== */

    private static final Color PRIMARY_COLOR =
            new Color(37, 99, 135);

    private static final Color BORDER_COLOR =
            new Color(210, 210, 210);

    private static final Color PLAN_COLOR =
            new Color(65, 144, 164);

    private static final Color SOLL_COLOR =
            new Color(244, 151, 18);

    private static final Color IST_COLOR =
            new Color(92, 160, 65);

    private static final Color PLAN_BACKGROUND =
            new Color(224, 239, 247);

    private static final Color SOLL_BACKGROUND =
            new Color(255, 240, 210);

    private static final Color IST_BACKGROUND =
            new Color(224, 242, 220);

    private static final Color UNGEPRUEFT_BACKGROUND =
            new Color(235, 235, 235);

    private static final Color WARNING_BACKGROUND =
            new Color(255, 235, 205);

    private static final Color ALTERNATE_BACKGROUND =
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

    private static final Font SECTION_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    13,
                    PRIMARY_COLOR
            );

    private static final Font HEADER_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    9,
                    Color.WHITE
            );

    private static final Font TEXT_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA,
                    9,
                    Color.BLACK
            );

    private static final Font BOLD_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    10,
                    Color.BLACK
            );

    private static final Font MUTED_FONT =
            FontFactory.getFont(
                    FontFactory.HELVETICA,
                    8,
                    Color.DARK_GRAY
            );


    /* =====================================================
       PDF EXPORT
       ===================================================== */

    public byte[] exportAnwesenheitszeiten(
            LocalDate datum,
            AnwesenheitszeitenFilter filterTyp,
            Long filterId
    ) throws DocumentException, IOException {

        AnwesenheitszeitenResponse response =
                anwesenheitszeitenService
                        .berechneAnwesenheitszeiten(
                                datum,
                                filterTyp,
                                filterId
                        );

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

        document.addTitle("Anwesenheitszeiten");

        document.addCreator("Anwesenheitsverwaltung");

        document.open();

        try {

            /* TITEL */

            Paragraph title = new Paragraph(
                    "Anwesenheitszeiten",
                    TITLE_FONT
            );

            title.setAlignment(Element.ALIGN_CENTER);

            title.setSpacingAfter(6);

            document.add(title);


            /* DATUM */

            Paragraph subtitle = new Paragraph(
                    "Datum: "
                            + response.datum().format(DATE_FORMAT),
                    SUBTITLE_FONT
            );

            subtitle.setAlignment(Element.ALIGN_CENTER);

            subtitle.setSpacingAfter(5);

            document.add(subtitle);


            /* FILTER */

            Paragraph filter = new Paragraph(
                    "Filter: "
                            + formatFilterTyp(response.filterTyp())
                            + " | Auswahl: "
                            + valueOrDash(response.filterName()),
                    SUBTITLE_FONT
            );

            filter.setAlignment(Element.ALIGN_CENTER);

            filter.setSpacingAfter(15);

            document.add(filter);


            /* ZUSAMMENFASSUNG */

            addSectionTitle(
                    document,
                    "Zusammenfassung"
            );

            document.add(
                    createZusammenfassungTabelle(response)
            );


            /* DIAGRAMM */

            addSectionTitle(
                    document,
                    "Anwesenheitsverlauf – PLAN / SOLL / IST"
            );

            if (response.zeitintervalle().isEmpty()) {

                document.add(
                        new Paragraph(
                                "Keine Zeitintervalle vorhanden.",
                                TEXT_FONT
                        )
                );

            } else {

                Image diagramm =
                        createDiagramm(response);

                diagramm.scaleToFit(
                        document.right() - document.left(),
                        290
                );

                diagramm.setAlignment(
                        Element.ALIGN_CENTER
                );

                diagramm.setSpacingAfter(12);

                document.add(diagramm);
            }


            /* HINWEISE */

            addSectionTitle(
                    document,
                    "Hinweise"
            );

            document.add(
                    createHinweiseTabelle(response)
            );


            /* ZEITINTERVALLE */

            document.newPage();

            addSectionTitle(
                    document,
                    "Anwesenheitszeiten im Detail"
            );

            Paragraph detailInfo = new Paragraph(
                    response.datum().format(DATE_FORMAT)
                            + " | "
                            + valueOrDash(response.filterName()),
                    SUBTITLE_FONT
            );

            detailInfo.setSpacingAfter(10);

            document.add(detailInfo);

            document.add(
                    createAnwesenheitszeitenTabelle(response)
            );


            /* ERLÄUTERUNGEN */

            addSectionTitle(
                    document,
                    "Erläuterungen"
            );

            document.add(
                    createErlaeuterungenTabelle()
            );

        } finally {

            document.close();
        }

        return outputStream.toByteArray();
    }


    /* =====================================================
       ZUSAMMENFASSUNG
       ===================================================== */

    private PdfPTable createZusammenfassungTabelle(
            AnwesenheitszeitenResponse response
    ) throws DocumentException {

        List<AnwesenheitszeitenResponse.Zeitintervall>
                intervalle = response.zeitintervalle();

        int maxPlan = intervalle.stream()
                .mapToInt(
                        AnwesenheitszeitenResponse
                                .Zeitintervall::plan
                )
                .max()
                .orElse(0);

        int maxSoll = intervalle.stream()
                .mapToInt(
                        AnwesenheitszeitenResponse
                                .Zeitintervall::soll
                )
                .max()
                .orElse(0);

        int maxIst = intervalle.stream()
                .mapToInt(
                        AnwesenheitszeitenResponse
                                .Zeitintervall::ist
                )
                .max()
                .orElse(0);

        int maxUngeprueft = intervalle.stream()
                .mapToInt(
                        AnwesenheitszeitenResponse
                                .Zeitintervall::ungeprueft
                )
                .max()
                .orElse(0);

        String zeitraum = intervalle.isEmpty()
                ? "–"
                : intervalle.get(0)
                  .von()
                  .format(TIME_FORMAT)
                  + " – "
                  + intervalle.get(intervalle.size() - 1)
                    .bis()
                    .format(TIME_FORMAT);

        PdfPTable table = new PdfPTable(2);

        table.setWidthPercentage(100);

        table.setWidths(new float[]{3.5f, 1.5f});

        table.setSpacingAfter(12);

        table.setHeaderRows(1);

        addHeaderCell(table, "Kennzahl");

        addHeaderCell(table, "Wert");

        addStatistikRow(
                table,
                "Zeitraum",
                zeitraum,
                Color.WHITE
        );

        addStatistikRow(
                table,
                "Schüler gesamt",
                String.valueOf(response.anzahlSchueler()),
                Color.WHITE
        );

        addStatistikRow(
                table,
                "Schüler ohne gültige Unterrichtszeiten",
                String.valueOf(
                        response.anzahlOhneUnterrichtszeiten()
                ),
                response.anzahlOhneUnterrichtszeiten() > 0
                        ? WARNING_BACKGROUND
                        : Color.WHITE
        );

        addStatistikRow(
                table,
                "Maximal PLAN",
                String.valueOf(maxPlan),
                PLAN_BACKGROUND
        );

        addStatistikRow(
                table,
                "Maximal SOLL",
                String.valueOf(maxSoll),
                SOLL_BACKGROUND
        );

        addStatistikRow(
                table,
                "Maximal IST",
                String.valueOf(maxIst),
                IST_BACKGROUND
        );

        addStatistikRow(
                table,
                "Maximal ungeprüft",
                String.valueOf(maxUngeprueft),
                UNGEPRUEFT_BACKGROUND
        );

        addStatistikRow(
                table,
                "Anzahl Zeitintervalle",
                String.valueOf(intervalle.size()),
                Color.WHITE
        );

        return table;
    }


    /* =====================================================
       ANWESENHEITSZEITEN TABELLE
       ===================================================== */

    private PdfPTable createAnwesenheitszeitenTabelle(
            AnwesenheitszeitenResponse response
    ) throws DocumentException {

        PdfPTable table = new PdfPTable(6);

        table.setWidthPercentage(100);

        table.setWidths(
                new float[]{
                        2.2f,
                        1f,
                        1f,
                        1f,
                        1.4f,
                        1.8f
                }
        );

        table.setSpacingAfter(12);

        table.setSplitRows(true);

        table.setSplitLate(true);

        addHeaderCell(table, "Uhrzeit");

        addHeaderCell(table, "PLAN");

        addHeaderCell(table, "SOLL");

        addHeaderCell(table, "IST");

        addHeaderCell(table, "Ungeprüft");

        addHeaderCell(table, "Anwesenheitsquote");

        table.setHeaderRows(1);


        if (response.zeitintervalle().isEmpty()) {

            PdfPCell emptyCell = new PdfPCell(
                    new Phrase(
                            "Keine Zeitintervalle vorhanden.",
                            TEXT_FONT
                    )
            );

            emptyCell.setColspan(6);

            emptyCell.setPadding(8);

            emptyCell.setBorderColor(BORDER_COLOR);

            table.addCell(emptyCell);

            return table;
        }


        int rowIndex = 0;

        for (
                AnwesenheitszeitenResponse.Zeitintervall intervall :
                response.zeitintervalle()
        ) {

            Color rowColor =
                    rowIndex % 2 == 0
                            ? Color.WHITE
                            : ALTERNATE_BACKGROUND;

            String zeitraum =
                    intervall.von().format(TIME_FORMAT)
                            + " – "
                            + intervall.bis().format(TIME_FORMAT);

            addTextCell(
                    table,
                    zeitraum,
                    rowColor,
                    true
            );

            addTextCell(
                    table,
                    String.valueOf(intervall.plan()),
                    PLAN_BACKGROUND,
                    true
            );

            addTextCell(
                    table,
                    String.valueOf(intervall.soll()),
                    SOLL_BACKGROUND,
                    true
            );

            addTextCell(
                    table,
                    String.valueOf(intervall.ist()),
                    IST_BACKGROUND,
                    true
            );

            addTextCell(
                    table,
                    String.valueOf(intervall.ungeprueft()),
                    UNGEPRUEFT_BACKGROUND,
                    true
            );

            String quote = intervall.soll() > 0

                    ? String.format(
                    Locale.GERMAN,
                    "%.1f %%",
                    (double) intervall.ist()
                    / intervall.soll()
                    * 100
            )

                    : "–";

            addTextCell(
                    table,
                    quote,
                    rowColor,
                    true
            );

            rowIndex++;
        }

        return table;
    }


    /* =====================================================
       DIAGRAMM
       ===================================================== */

    private Image createDiagramm(
            AnwesenheitszeitenResponse response
    ) throws IOException, DocumentException {

        List<AnwesenheitszeitenResponse.Zeitintervall>
                intervalle = response.zeitintervalle();

        int width = 1400;

        int height = 700;

        int left = 105;

        int right = 45;

        int top = 45;

        int bottom = 130;

        int chartWidth = width - left - right;

        int chartHeight = height - top - bottom;

        BufferedImage image = new BufferedImage(
                width,
                height,
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = image.createGraphics();

        try {

            graphics.setRenderingHint(
                    RenderingHints.KEY_ANTIALIASING,
                    RenderingHints.VALUE_ANTIALIAS_ON
            );

            graphics.setRenderingHint(
                    RenderingHints.KEY_TEXT_ANTIALIASING,
                    RenderingHints.VALUE_TEXT_ANTIALIAS_ON
            );

            graphics.setColor(Color.WHITE);

            graphics.fillRect(
                    0,
                    0,
                    width,
                    height
            );


            /* MAXIMALWERT */

            int maxValue = intervalle.stream()
                    .mapToInt(intervall ->
                            Math.max(
                                    intervall.plan(),
                                    Math.max(
                                            intervall.soll(),
                                            intervall.ist()
                                    )
                            )
                    )
                    .max()
                    .orElse(0);

            int step = Math.max(
                    1,
                    (int) Math.ceil(maxValue / 5.0)
            );

            int axisMax = step * 5;


            /* GITTER UND Y-ACHSE */

            graphics.setFont(
                    new java.awt.Font(
                            "SansSerif",
                            java.awt.Font.PLAIN,
                            22
                    )
            );

            for (int i = 0; i <= 5; i++) {

                int value = i * step;

                int y = top + chartHeight
                        - (int) Math.round(
                        (double) value
                                / axisMax
                                * chartHeight
                );

                graphics.setColor(
                        new Color(225, 225, 225)
                );

                graphics.setStroke(
                        new BasicStroke(1)
                );

                graphics.drawLine(
                        left,
                        y,
                        left + chartWidth,
                        y
                );

                graphics.setColor(Color.DARK_GRAY);

                String label = String.valueOf(value);

                int labelWidth = graphics
                        .getFontMetrics()
                        .stringWidth(label);

                graphics.drawString(
                        label,
                        left - labelWidth - 12,
                        y + 7
                );
            }


            /* ACHSEN */

            graphics.setColor(Color.DARK_GRAY);

            graphics.setStroke(new BasicStroke(2));

            graphics.drawLine(
                    left,
                    top,
                    left,
                    top + chartHeight
            );

            graphics.drawLine(
                    left,
                    top + chartHeight,
                    left + chartWidth,
                    top + chartHeight
            );


            /* X-ACHSE */

            int count = intervalle.size();

            int labelStep = Math.max(
                    1,
                    (int) Math.ceil(count / 8.0)
            );

            for (int i = 0; i < count; i++) {

                if (i % labelStep != 0) {

                    continue;
                }

                int x = left + (int) Math.round(
                        (double) i
                                / Math.max(1, count - 1)
                                * chartWidth
                );

                String label = intervalle.get(i)
                        .von()
                        .format(TIME_FORMAT);

                int labelWidth = graphics
                        .getFontMetrics()
                        .stringWidth(label);

                graphics.drawString(
                        label,
                        x - labelWidth / 2,
                        top + chartHeight + 35
                );
            }


            /* DATENREIHEN */

            drawSeries(
                    graphics,
                    intervalle,
                    left,
                    top,
                    chartWidth,
                    chartHeight,
                    axisMax,
                    PLAN_COLOR,
                    0
            );

            drawSeries(
                    graphics,
                    intervalle,
                    left,
                    top,
                    chartWidth,
                    chartHeight,
                    axisMax,
                    SOLL_COLOR,
                    1
            );

            drawSeries(
                    graphics,
                    intervalle,
                    left,
                    top,
                    chartWidth,
                    chartHeight,
                    axisMax,
                    IST_COLOR,
                    2
            );


            /* LEGENDE */

            int legendY = height - 35;

            drawLegendItem(
                    graphics,
                    width / 2 - 260,
                    legendY,
                    PLAN_COLOR,
                    "PLAN"
            );

            drawLegendItem(
                    graphics,
                    width / 2 - 75,
                    legendY,
                    SOLL_COLOR,
                    "SOLL"
            );

            drawLegendItem(
                    graphics,
                    width / 2 + 110,
                    legendY,
                    IST_COLOR,
                    "IST"
            );

        } finally {

            graphics.dispose();
        }

        ByteArrayOutputStream imageStream =
                new ByteArrayOutputStream();

        ImageIO.write(
                image,
                "png",
                imageStream
        );

        return Image.getInstance(
                imageStream.toByteArray()
        );
    }


    private void drawSeries(
            Graphics2D graphics,
            List<AnwesenheitszeitenResponse.Zeitintervall> intervalle,
            int left,
            int top,
            int chartWidth,
            int chartHeight,
            int axisMax,
            Color color,
            int series
    ) {

        graphics.setColor(color);

        graphics.setStroke(
                new BasicStroke(
                        4,
                        BasicStroke.CAP_ROUND,
                        BasicStroke.JOIN_ROUND
                )
        );

        int previousX = 0;

        int previousY = 0;

        for (int i = 0; i < intervalle.size(); i++) {

            AnwesenheitszeitenResponse.Zeitintervall
                    intervall = intervalle.get(i);

            int value = switch (series) {

                case 0 -> intervall.plan();

                case 1 -> intervall.soll();

                default -> intervall.ist();
            };

            int x = left + (int) Math.round(
                    (double) i
                            / Math.max(
                            1,
                            intervalle.size() - 1
                    )
                            * chartWidth
            );

            int y = top + chartHeight
                    - (int) Math.round(
                    (double) value
                            / axisMax
                            * chartHeight
            );

            if (i > 0) {

                graphics.drawLine(
                        previousX,
                        previousY,
                        x,
                        y
                );
            }

            graphics.fillOval(
                    x - 3,
                    y - 3,
                    6,
                    6
            );

            previousX = x;

            previousY = y;
        }
    }


    private void drawLegendItem(
            Graphics2D graphics,
            int x,
            int y,
            Color color,
            String label
    ) {

        graphics.setColor(color);

        graphics.setStroke(new BasicStroke(5));

        graphics.drawLine(
                x,
                y - 7,
                x + 45,
                y - 7
        );

        graphics.setColor(Color.DARK_GRAY);

        graphics.setFont(
                new java.awt.Font(
                        "SansSerif",
                        java.awt.Font.BOLD,
                        22
                )
        );

        graphics.drawString(
                label,
                x + 55,
                y
        );
    }


    /* =====================================================
       HINWEISE
       ===================================================== */

    private PdfPTable createHinweiseTabelle(
            AnwesenheitszeitenResponse response
    ) {

        PdfPTable table = new PdfPTable(1);

        table.setWidthPercentage(100);

        table.setSpacingAfter(10);

        if (
                response.hinweise() == null
                        || response.hinweise().isEmpty()
        ) {

            addHinweisCell(
                    table,
                    "Keine Hinweise vorhanden.",
                    Color.WHITE
            );

        } else {

            for (String hinweis : response.hinweise()) {

                addHinweisCell(
                        table,
                        hinweis,
                        WARNING_BACKGROUND
                );
            }
        }

        return table;
    }


    /* =====================================================
       ERLÄUTERUNGEN
       ===================================================== */

    private PdfPTable createErlaeuterungenTabelle() {

        PdfPTable table = new PdfPTable(1);

        table.setWidthPercentage(100);

        table.setSpacingAfter(10);

        addHinweisCell(
                table,
                "PLAN: Anzahl der Schüler, die laut "
                        + "Unterrichtszeiten und ANA-Buchungen "
                        + "anwesend sein sollen.",
                PLAN_BACKGROUND
        );

        addHinweisCell(
                table,
                "SOLL: PLAN abzüglich der Schüler, "
                        + "die im jeweiligen Zeitraum "
                        + "als abwesend eingetragen sind.",
                SOLL_BACKGROUND
        );

        addHinweisCell(
                table,
                "IST: Schüler innerhalb der SOLL-Anwesenheit "
                        + "mit dem gespeicherten Status ANWESEND.",
                IST_BACKGROUND
        );

        addHinweisCell(
                table,
                "Ungeprüft: Schüler innerhalb der "
                        + "SOLL-Anwesenheit ohne bestätigten "
                        + "Status ANWESEND.",
                UNGEPRUEFT_BACKGROUND
        );

        addHinweisCell(
                table,
                "Anwesenheitsquote: IST geteilt durch SOLL. "
                        + "Sie beschreibt den Anteil der bestätigten "
                        + "Anwesenheiten. Bei SOLL = 0 wird "
                        + "keine Quote angegeben.",
                Color.WHITE
        );

        addHinweisCell(
                table,
                "Die ANA-Anwesenheitskontrolle hat keinen "
                        + "Einfluss auf PLAN, SOLL oder IST.",
                Color.WHITE
        );

        addHinweisCell(
                table,
                "Die Berechnung basiert auf den aktuellen "
                        + "Klassen-, Unterrichts- und ANA-Zuordnungen.",
                Color.WHITE
        );

        addHinweisCell(
                table,
                "Bei der Auswahl eines Angebots oder ANA-Kurses "
                        + "wird der gesamte Schultag der ausgewählten "
                        + "Schüler betrachtet.",
                Color.WHITE
        );

        addHinweisCell(
                table,
                "Die maximalen Werte können zu unterschiedlichen "
                        + "Uhrzeiten erreicht werden. Die Werte werden "
                        + "jeweils am Beginn des Zeitintervalls ermittelt.",
                Color.WHITE
        );

        return table;
    }


    /* =====================================================
       HILFSMETHODEN
       ===================================================== */

    private void addSectionTitle(
            Document document,
            String text
    ) throws DocumentException {

        Paragraph paragraph = new Paragraph(
                text,
                SECTION_FONT
        );

        paragraph.setSpacingBefore(10);

        paragraph.setSpacingAfter(8);

        paragraph.setKeepTogether(true);

        document.add(paragraph);
    }


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

        cell.setBackgroundColor(PRIMARY_COLOR);

        cell.setBorderColor(BORDER_COLOR);

        cell.setPadding(7);

        cell.setHorizontalAlignment(
                Element.ALIGN_CENTER
        );

        cell.setVerticalAlignment(
                Element.ALIGN_MIDDLE
        );

        table.addCell(cell);
    }


    private void addTextCell(
            PdfPTable table,
            String text,
            Color background,
            boolean centered
    ) {

        PdfPCell cell = new PdfPCell(
                new Phrase(
                        text == null ? "" : text,
                        TEXT_FONT
                )
        );

        cell.setBackgroundColor(background);

        cell.setBorderColor(BORDER_COLOR);

        cell.setPadding(5);

        cell.setVerticalAlignment(
                Element.ALIGN_MIDDLE
        );

        if (centered) {

            cell.setHorizontalAlignment(
                    Element.ALIGN_CENTER
            );
        }

        table.addCell(cell);
    }


    private void addStatistikRow(
            PdfPTable table,
            String label,
            String value,
            Color background
    ) {

        addTextCell(
                table,
                label,
                Color.WHITE,
                false
        );

        PdfPCell valueCell = new PdfPCell(
                new Phrase(
                        value,
                        BOLD_FONT
                )
        );

        valueCell.setBackgroundColor(background);

        valueCell.setBorderColor(BORDER_COLOR);

        valueCell.setPadding(6);

        valueCell.setHorizontalAlignment(
                Element.ALIGN_CENTER
        );

        table.addCell(valueCell);
    }


    private void addHinweisCell(
            PdfPTable table,
            String text,
            Color background
    ) {

        PdfPCell cell = new PdfPCell(
                new Phrase(
                        text == null ? "" : text,
                        MUTED_FONT
                )
        );

        cell.setBackgroundColor(background);

        cell.setBorderColor(BORDER_COLOR);

        cell.setPadding(7);

        table.addCell(cell);
    }


    private String formatFilterTyp(
            String filterTyp
    ) {

        if (filterTyp == null) {

            return "Gesamt";
        }

        return switch (filterTyp) {

            case "ALLE" -> "Gesamt";

            case "KLASSE" -> "Klasse";

            case "ANGEBOT" -> "Angebot";

            case "ANA" -> "ANA";

            default -> filterTyp;
        };
    }


    private String valueOrDash(String value) {

        return value == null || value.isBlank()
                ? "–"
                : value.trim();
    }
}