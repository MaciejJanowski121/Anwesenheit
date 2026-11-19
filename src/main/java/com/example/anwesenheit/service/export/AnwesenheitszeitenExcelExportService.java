package com.example.anwesenheit.service.export;

import com.example.anwesenheit.dto.AnwesenheitszeitenResponse;
import com.example.anwesenheit.model.AnwesenheitszeitenFilter;
import com.example.anwesenheit.service.AnwesenheitszeitenService;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFDrawing;
import org.apache.poi.xssf.usermodel.XSSFChart;
import org.apache.poi.xssf.usermodel.XSSFClientAnchor;

import org.apache.poi.xddf.usermodel.chart.*;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import java.util.List;


@Service
public class AnwesenheitszeitenExcelExportService {

    private final AnwesenheitszeitenService
            anwesenheitszeitenService;

    public AnwesenheitszeitenExcelExportService(
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
       EXCEL STYLES
       ===================================================== */

    private record ExcelStyles(
            CellStyle title,
            CellStyle header,
            CellStyle text,
            CellStyle date,
            CellStyle time,
            CellStyle number,
            CellStyle plan,
            CellStyle soll,
            CellStyle ist,
            CellStyle ungeprueft,
            CellStyle percentage,
            CellStyle warning
    ) {}


    /* =====================================================
       EXCEL EXPORT
       ===================================================== */

    public byte[] exportAnwesenheitszeiten(
            LocalDate datum,
            AnwesenheitszeitenFilter filterTyp,
            Long filterId
    ) throws IOException {

        /*
         * Die Berechnung erfolgt ausschließlich
         * über den bestehenden Service.
         */

        AnwesenheitszeitenResponse response =
                anwesenheitszeitenService
                        .berechneAnwesenheitszeiten(
                                datum,
                                filterTyp,
                                filterId
                        );

        try (
                XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream =
                        new ByteArrayOutputStream()
        ) {

            ExcelStyles styles = createStyles(workbook);

            XSSFSheet zeitenSheet =
                    workbook.createSheet("Anwesenheitszeiten");

            XSSFSheet zusammenfassungSheet =
                    workbook.createSheet("Zusammenfassung");

            XSSFSheet diagrammSheet =
                    workbook.createSheet("Diagramm");


            /* Anwesenheitszeiten */

            createAnwesenheitszeitenSheet(
                    zeitenSheet,
                    response,
                    styles
            );


            /* Zusammenfassung */

            createZusammenfassungSheet(
                    zusammenfassungSheet,
                    response,
                    styles
            );


            /* Diagramm */

            createDiagrammSheet(
                    diagrammSheet,
                    zeitenSheet,
                    response,
                    styles
            );


            workbook.write(outputStream);

            return outputStream.toByteArray();
        }
    }


    /* =====================================================
       ANWESENHEITSZEITEN
       ===================================================== */

    private void createAnwesenheitszeitenSheet(
            XSSFSheet sheet,
            AnwesenheitszeitenResponse response,
            ExcelStyles styles
    ) {

        String[] headers = {
                "Uhrzeit",
                "Von",
                "Bis",
                "PLAN",
                "SOLL",
                "IST",
                "Ungeprüft",
                "Anwesenheitsquote"
        };


        /* Tabellenkopf */

        Row headerRow = sheet.createRow(0);

        headerRow.setHeightInPoints(30);

        for (int i = 0; i < headers.length; i++) {

            writeText(
                    headerRow,
                    i,
                    headers[i],
                    styles.header()
            );
        }


        /* Zeitintervalle */

        int rowIndex = 1;

        for (
                AnwesenheitszeitenResponse.Zeitintervall intervall :
                response.zeitintervalle()
        ) {

            Row row = sheet.createRow(rowIndex++);

            row.setHeightInPoints(23);

            String zeitraum =
                    intervall.von().format(TIME_FORMAT)
                            + " – "
                            + intervall.bis().format(TIME_FORMAT);


            /* Uhrzeit */

            writeText(
                    row,
                    0,
                    zeitraum,
                    styles.text()
            );


            /* Von */

            writeTime(
                    row,
                    1,
                    intervall.von(),
                    styles.time()
            );


            /* Bis */

            writeTime(
                    row,
                    2,
                    intervall.bis(),
                    styles.time()
            );


            /* PLAN */

            writeNumber(
                    row,
                    3,
                    intervall.plan(),
                    styles.plan()
            );


            /* SOLL */

            writeNumber(
                    row,
                    4,
                    intervall.soll(),
                    styles.soll()
            );


            /* IST */

            writeNumber(
                    row,
                    5,
                    intervall.ist(),
                    styles.ist()
            );


            /* Ungeprüft */

            writeNumber(
                    row,
                    6,
                    intervall.ungeprueft(),
                    styles.ungeprueft()
            );


            /* Anwesenheitsquote */

            Cell quoteCell = row.createCell(7);

            if (intervall.soll() > 0) {

                double quote =
                        (double) intervall.ist()
                                / intervall.soll();

                quoteCell.setCellValue(quote);

            } else {

                /*
                 * Ohne SOLL-Anwesenheit kann keine
                 * aussagekräftige Quote berechnet werden.
                 */

                quoteCell.setBlank();
            }

            quoteCell.setCellStyle(
                    styles.percentage()
            );
        }


        /* Tabellenfilter */

        sheet.setAutoFilter(
                new CellRangeAddress(
                        0,
                        Math.max(0, rowIndex - 1),
                        0,
                        headers.length - 1
                )
        );


        /* Kopfzeile fixieren */

        sheet.createFreezePane(0, 1);


        /* Spaltenbreiten */

        int[] widths = {
                24,
                14,
                14,
                14,
                14,
                14,
                18,
                25
        };

        for (int i = 0; i < widths.length; i++) {

            sheet.setColumnWidth(
                    i,
                    widths[i] * 256
            );
        }


        /* Druckeinstellungen */

        sheet.setFitToPage(true);

        PrintSetup printSetup =
                sheet.getPrintSetup();

        printSetup.setLandscape(true);

        printSetup.setPaperSize(
                PrintSetup.A4_PAPERSIZE
        );

        printSetup.setFitWidth((short) 1);

        printSetup.setFitHeight((short) 1);

        sheet.setRepeatingRows(
                CellRangeAddress.valueOf("1:1")
        );
    }


    /* =====================================================
       ZUSAMMENFASSUNG
       ===================================================== */

    private void createZusammenfassungSheet(
            XSSFSheet sheet,
            AnwesenheitszeitenResponse response,
            ExcelStyles styles
    ) {

        List<AnwesenheitszeitenResponse.Zeitintervall>
                intervalle = response.zeitintervalle();


        /* Maximale Werte */

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


        /* Titel */

        Row titleRow = sheet.createRow(0);

        titleRow.setHeightInPoints(35);

        writeText(
                titleRow,
                0,
                "Anwesenheitszeiten – Zusammenfassung",
                styles.title()
        );

        sheet.addMergedRegion(
                new CellRangeAddress(0, 0, 0, 1)
        );


        /* Datum */

        Row datumRow = sheet.createRow(2);

        writeText(
                datumRow,
                0,
                "Datum",
                styles.text()
        );

        writeDate(
                datumRow,
                1,
                response.datum(),
                styles.date()
        );


        /* Filtertyp */

        addTextRow(
                sheet,
                3,
                "Filtertyp",
                formatFilterTyp(response.filterTyp()),
                styles.text()
        );


        /* Filtername */

        addTextRow(
                sheet,
                4,
                "Auswahl",
                response.filterName(),
                styles.text()
        );


        /* Zeitraum */

        String zeitraum = intervalle.isEmpty()
                ? "–"
                : intervalle.get(0)
                  .von()
                  .format(TIME_FORMAT)
                  + " – "
                  + intervalle.get(intervalle.size() - 1)
                    .bis()
                    .format(TIME_FORMAT);

        addTextRow(
                sheet,
                5,
                "Zeitraum",
                zeitraum,
                styles.text()
        );


        /* Statistik Header */

        Row headerRow = sheet.createRow(7);

        headerRow.setHeightInPoints(25);

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


        /* Schüler gesamt */

        addStatistikRow(
                sheet,
                8,
                "Schüler gesamt",
                response.anzahlSchueler(),
                styles.text(),
                styles.number()
        );


        /* Fehlende Unterrichtszeiten */

        addStatistikRow(
                sheet,
                9,
                "Schüler ohne gültige Unterrichtszeiten",
                response.anzahlOhneUnterrichtszeiten(),
                styles.text(),
                response.anzahlOhneUnterrichtszeiten() > 0
                        ? styles.warning()
                        : styles.number()
        );


        /* Maximal PLAN */

        addStatistikRow(
                sheet,
                10,
                "Maximal PLAN",
                maxPlan,
                styles.text(),
                styles.plan()
        );


        /* Maximal SOLL */

        addStatistikRow(
                sheet,
                11,
                "Maximal SOLL",
                maxSoll,
                styles.text(),
                styles.soll()
        );


        /* Maximal IST */

        addStatistikRow(
                sheet,
                12,
                "Maximal IST",
                maxIst,
                styles.text(),
                styles.ist()
        );


        /* Maximal ungeprüft */

        addStatistikRow(
                sheet,
                13,
                "Maximal ungeprüft",
                maxUngeprueft,
                styles.text(),
                styles.ungeprueft()
        );


        /* Anzahl Zeitintervalle */

        addStatistikRow(
                sheet,
                14,
                "Anzahl Zeitintervalle",
                intervalle.size(),
                styles.text(),
                styles.number()
        );


        /* Hinweise */

        int rowIndex = 16;

        addSectionHeader(
                sheet,
                rowIndex++,
                "Hinweise",
                styles.header()
        );

        if (
                response.hinweise() == null
                        || response.hinweise().isEmpty()
        ) {

            addHinweis(
                    sheet,
                    rowIndex++,
                    "Keine Hinweise vorhanden.",
                    styles.text()
            );

        } else {

            for (String hinweis : response.hinweise()) {

                addHinweis(
                        sheet,
                        rowIndex++,
                        hinweis,
                        styles.warning()
                );
            }
        }


        /* Erläuterungen */

        rowIndex++;

        addSectionHeader(
                sheet,
                rowIndex++,
                "Erläuterungen",
                styles.header()
        );

        addHinweis(
                sheet,
                rowIndex++,
                "PLAN: Anzahl der Schüler, die laut "
                        + "Unterrichtszeiten und ANA-Buchungen "
                        + "anwesend sein sollen.",
                styles.text()
        );

        addHinweis(
                sheet,
                rowIndex++,
                "SOLL: PLAN abzüglich der Schüler, "
                        + "die im jeweiligen Zeitraum "
                        + "als abwesend eingetragen sind.",
                styles.text()
        );

        addHinweis(
                sheet,
                rowIndex++,
                "IST: Schüler innerhalb der SOLL-Anwesenheit "
                        + "mit dem gespeicherten Status ANWESEND.",
                styles.text()
        );

        addHinweis(
                sheet,
                rowIndex++,
                "Ungeprüft: Schüler innerhalb der "
                        + "SOLL-Anwesenheit ohne bestätigten "
                        + "Status ANWESEND.",
                styles.text()
        );

        addHinweis(
                sheet,
                rowIndex++,
                "Anwesenheitsquote: IST geteilt durch SOLL. "
                        + "Sie beschreibt den Anteil der bestätigten "
                        + "Anwesenheiten. Bei SOLL = 0 bleibt "
                        + "die Quote leer.",
                styles.text()
        );

        addHinweis(
                sheet,
                rowIndex++,
                "Die ANA-Anwesenheitskontrolle hat "
                        + "keinen Einfluss auf PLAN, SOLL oder IST.",
                styles.text()
        );

        addHinweis(
                sheet,
                rowIndex++,
                "Die Berechnung basiert auf den aktuellen "
                        + "Klassen-, Unterrichts- und ANA-Zuordnungen.",
                styles.text()
        );

        addHinweis(
                sheet,
                rowIndex++,
                "Bei der Auswahl eines Angebots oder ANA-Kurses "
                        + "wird der gesamte Schultag der ausgewählten "
                        + "Schüler betrachtet.",
                styles.text()
        );

        addHinweis(
                sheet,
                rowIndex,
                "Die maximalen Werte können zu unterschiedlichen "
                        + "Uhrzeiten erreicht werden. Die Werte werden "
                        + "jeweils am Beginn des Zeitintervalls ermittelt.",
                styles.text()
        );


        /* Spaltenbreiten */

        sheet.setColumnWidth(0, 52 * 256);

        sheet.setColumnWidth(1, 45 * 256);

        sheet.setDefaultRowHeightInPoints(23);
    }


    /* =====================================================
       DIAGRAMM
       ===================================================== */

    private void createDiagrammSheet(
            XSSFSheet diagrammSheet,
            XSSFSheet datenSheet,
            AnwesenheitszeitenResponse response,
            ExcelStyles styles
    ) {

        /* Titel */

        Row titleRow = diagrammSheet.createRow(0);

        titleRow.setHeightInPoints(35);

        writeText(
                titleRow,
                0,
                "Anwesenheitszeiten – "
                        + response.datum().format(DATE_FORMAT),
                styles.title()
        );

        diagrammSheet.addMergedRegion(
                new CellRangeAddress(0, 0, 0, 10)
        );


        /* Filtername */

        Row subtitleRow = diagrammSheet.createRow(1);

        writeText(
                subtitleRow,
                0,
                "Auswahl: " + response.filterName(),
                styles.text()
        );

        diagrammSheet.addMergedRegion(
                new CellRangeAddress(1, 1, 0, 10)
        );


        int anzahlIntervalle =
                response.zeitintervalle().size();

        if (anzahlIntervalle == 0) {

            Row emptyRow = diagrammSheet.createRow(3);

            writeText(
                    emptyRow,
                    0,
                    "Keine Zeitintervalle vorhanden.",
                    styles.text()
            );

            return;
        }


        /* Diagrammposition */

        XSSFDrawing drawing =
                diagrammSheet.createDrawingPatriarch();

        XSSFClientAnchor anchor =
                drawing.createAnchor(
                        0,
                        0,
                        0,
                        0,
                        0,
                        3,
                        18,
                        25
                );

        XSSFChart chart =
                drawing.createChart(anchor);


        /* Diagrammtitel */

        chart.setTitleText(
                "PLAN / SOLL / IST"
        );

        chart.setTitleOverlay(false);


        /* Legende */

        XDDFChartLegend legend =
                chart.getOrAddLegend();

        legend.setPosition(
                LegendPosition.BOTTOM
        );


        /* X-Achse */

        XDDFCategoryAxis bottomAxis =
                chart.createCategoryAxis(
                        AxisPosition.BOTTOM
                );

        bottomAxis.setTitle("Uhrzeit");


        /* Y-Achse */

        XDDFValueAxis leftAxis =
                chart.createValueAxis(
                        AxisPosition.LEFT
                );

        leftAxis.setTitle("Anzahl Schüler");

        leftAxis.setMinimum(0);

        leftAxis.setCrosses(
                AxisCrosses.AUTO_ZERO
        );


        /* Kategorien: Uhrzeiten */

        XDDFDataSource<String> categories =
                XDDFDataSourcesFactory
                        .fromStringCellRange(
                                datenSheet,
                                new CellRangeAddress(
                                        1,
                                        anzahlIntervalle,
                                        0,
                                        0
                                )
                        );


        /* PLAN */

        XDDFNumericalDataSource<Double> planData =
                XDDFDataSourcesFactory
                        .fromNumericCellRange(
                                datenSheet,
                                new CellRangeAddress(
                                        1,
                                        anzahlIntervalle,
                                        3,
                                        3
                                )
                        );


        /* SOLL */

        XDDFNumericalDataSource<Double> sollData =
                XDDFDataSourcesFactory
                        .fromNumericCellRange(
                                datenSheet,
                                new CellRangeAddress(
                                        1,
                                        anzahlIntervalle,
                                        4,
                                        4
                                )
                        );


        /* IST */

        XDDFNumericalDataSource<Double> istData =
                XDDFDataSourcesFactory
                        .fromNumericCellRange(
                                datenSheet,
                                new CellRangeAddress(
                                        1,
                                        anzahlIntervalle,
                                        5,
                                        5
                                )
                        );


        /* Liniendiagramm */

        XDDFLineChartData data =
                (XDDFLineChartData) chart.createData(
                        ChartTypes.LINE,
                        bottomAxis,
                        leftAxis
                );


        /* PLAN Serie */

        XDDFLineChartData.Series planSeries =
                (XDDFLineChartData.Series)
                        data.addSeries(
                                categories,
                                planData
                        );

        planSeries.setTitle("PLAN", null);

        planSeries.setSmooth(false);

        planSeries.setMarkerStyle(
                MarkerStyle.NONE
        );


        /* SOLL Serie */

        XDDFLineChartData.Series sollSeries =
                (XDDFLineChartData.Series)
                        data.addSeries(
                                categories,
                                sollData
                        );

        sollSeries.setTitle("SOLL", null);

        sollSeries.setSmooth(false);

        sollSeries.setMarkerStyle(
                MarkerStyle.NONE
        );


        /* IST Serie */

        XDDFLineChartData.Series istSeries =
                (XDDFLineChartData.Series)
                        data.addSeries(
                                categories,
                                istData
                        );

        istSeries.setTitle("IST", null);

        istSeries.setSmooth(false);

        istSeries.setMarkerStyle(
                MarkerStyle.NONE
        );


        /* Diagramm erstellen */

        chart.plot(data);


        /* Spaltenbreiten */

        for (int i = 0; i < 18; i++) {

            diagrammSheet.setColumnWidth(
                    i,
                    12 * 256
            );
        }


        /* Druckeinstellungen */

        diagrammSheet.setFitToPage(true);

        PrintSetup printSetup =
                diagrammSheet.getPrintSetup();

        printSetup.setLandscape(true);

        printSetup.setPaperSize(
                PrintSetup.A4_PAPERSIZE
        );

        printSetup.setFitWidth((short) 1);

        printSetup.setFitHeight((short) 1);

        workbookPrintArea(diagrammSheet);
    }


    private void workbookPrintArea(
            XSSFSheet sheet
    ) {

        XSSFWorkbook workbook =
                sheet.getWorkbook();

        int sheetIndex =
                workbook.getSheetIndex(sheet);

        workbook.setPrintArea(
                sheetIndex,
                0,
                17,
                0,
                25
        );
    }


    /* =====================================================
       EXCEL STYLES
       ===================================================== */

    private ExcelStyles createStyles(
            Workbook workbook
    ) {

        DataFormat format =
                workbook.createDataFormat();


        /* Normal Font */

        Font normalFont =
                workbook.createFont();

        normalFont.setFontName("Calibri");

        normalFont.setFontHeightInPoints(
                (short) 11
        );


        /* Header Font */

        Font headerFont =
                workbook.createFont();

        headerFont.setFontName("Calibri");

        headerFont.setFontHeightInPoints(
                (short) 11
        );

        headerFont.setBold(true);

        headerFont.setColor(
                IndexedColors.WHITE.getIndex()
        );


        /* Title Font */

        Font titleFont =
                workbook.createFont();

        titleFont.setFontName("Calibri");

        titleFont.setFontHeightInPoints(
                (short) 17
        );

        titleFont.setBold(true);


        /* Titel */

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
                VerticalAlignment.CENTER
        );

        text.setWrapText(true);

        applyBorders(text);


        /* Datum */

        CellStyle date =
                workbook.createCellStyle();

        date.cloneStyleFrom(text);

        date.setDataFormat(
                format.getFormat("dd.MM.yyyy")
        );

        date.setAlignment(
                HorizontalAlignment.CENTER
        );


        /* Uhrzeit */

        CellStyle time =
                workbook.createCellStyle();

        time.cloneStyleFrom(text);

        time.setDataFormat(
                format.getFormat("hh:mm")
        );

        time.setAlignment(
                HorizontalAlignment.CENTER
        );


        /* Zahlen */

        CellStyle number =
                workbook.createCellStyle();

        number.cloneStyleFrom(text);

        number.setDataFormat(
                format.getFormat("0")
        );

        number.setAlignment(
                HorizontalAlignment.CENTER
        );


        /* PLAN */

        CellStyle plan =
                createColoredStyle(
                        workbook,
                        number,
                        IndexedColors.PALE_BLUE
                );


        /* SOLL */

        CellStyle soll =
                createColoredStyle(
                        workbook,
                        number,
                        IndexedColors.LIGHT_YELLOW
                );


        /* IST */

        CellStyle ist =
                createColoredStyle(
                        workbook,
                        number,
                        IndexedColors.LIGHT_GREEN
                );


        /* Ungeprüft */

        CellStyle ungeprueft =
                createColoredStyle(
                        workbook,
                        number,
                        IndexedColors.GREY_25_PERCENT
                );


        /* Prozent */

        CellStyle percentage =
                workbook.createCellStyle();

        percentage.cloneStyleFrom(number);

        percentage.setDataFormat(
                format.getFormat("0.0%")
        );


        /* Warnungen */

        CellStyle warning =
                createColoredStyle(
                        workbook,
                        text,
                        IndexedColors.LIGHT_ORANGE
                );


        return new ExcelStyles(
                title,
                header,
                text,
                date,
                time,
                number,
                plan,
                soll,
                ist,
                ungeprueft,
                percentage,
                warning
        );
    }


    private CellStyle createColoredStyle(
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


    private void applyBorders(
            CellStyle style
    ) {

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
       ZUSAMMENFASSUNG HILFSMETHODEN
       ===================================================== */

    private void addTextRow(
            Sheet sheet,
            int rowIndex,
            String label,
            String value,
            CellStyle style
    ) {

        Row row =
                sheet.createRow(rowIndex);

        writeText(
                row,
                0,
                label,
                style
        );

        writeText(
                row,
                1,
                value,
                style
        );
    }


    private void addStatistikRow(
            Sheet sheet,
            int rowIndex,
            String label,
            int value,
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


    private void addSectionHeader(
            Sheet sheet,
            int rowIndex,
            String text,
            CellStyle style
    ) {

        Row row =
                sheet.createRow(rowIndex);

        row.setHeightInPoints(26);

        writeText(
                row,
                0,
                text,
                style
        );

        writeText(
                row,
                1,
                "",
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


    private void addHinweis(
            Sheet sheet,
            int rowIndex,
            String text,
            CellStyle style
    ) {

        Row row =
                sheet.createRow(rowIndex);

        int textLength =
                text == null ? 0 : text.length();

        row.setHeightInPoints(
                Math.min(
                        120,
                        Math.max(
                                30,
                                ((textLength / 90) + 1) * 17
                        )
                )
        );

        writeText(
                row,
                0,
                text,
                style
        );

        writeText(
                row,
                1,
                "",
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

        if (text.length() > 32_767) {

            text =
                    text.substring(0, 32_764) + "...";
        }

        cell.setCellValue(text);

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
                            / 86_400_000_000_000.0;

            cell.setCellValue(excelTime);
        }

        cell.setCellStyle(style);
    }


    /* =====================================================
       FILTER FORMATIEREN
       ===================================================== */

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
}