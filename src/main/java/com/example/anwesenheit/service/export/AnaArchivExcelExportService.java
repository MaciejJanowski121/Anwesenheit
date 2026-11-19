package com.example.anwesenheit.service.export;

import com.example.anwesenheit.model.AnaArchivFilter;
import com.example.anwesenheit.model.Anwesenheit;
import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Student;

import com.example.anwesenheit.repository.AnwesenheitRepository;

import lombok.RequiredArgsConstructor;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.time.LocalDate;
import java.time.format.TextStyle;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnaArchivExcelExportService {

    private final AnwesenheitRepository anwesenheitRepository;


    /* =====================================================
       TABELLENSPALTEN
       ===================================================== */

    private static final String[] HEADERS = {

            "Datum",

            "Wochentag",

            "Nachname",

            "Vorname",

            "Klasse (aktuell)",

            "Jahrgang (aktuell)",

            "ANA-Kurs",

            "Kursleitung (aktuell)",

            "Status",

            "Bemerkung"
    };


    /* =====================================================
       EXCEL EXPORT
       ===================================================== */

    public byte[] exportAnaArchiv(

            LocalDate von,

            LocalDate bis,

            AnaArchivFilter filterTyp,

            Long filterId

    ) throws IOException {

        validateRequest(
                von,
                bis,
                filterTyp,
                filterId
        );


        /* =================================================
           HISTORISCHE ANWESENHEITEN LADEN
           ================================================= */

        List<Anwesenheit> anwesenheiten =
                anwesenheitRepository
                        .findByDatumBetweenOrderByDatumAsc(
                                von,
                                bis
                        )
                        .stream()

                        .filter(anwesenheit ->
                                matchesFilter(
                                        anwesenheit,
                                        filterTyp,
                                        filterId
                                )
                        )

                        .sorted(

                                Comparator

                                        .comparing(
                                                Anwesenheit::getDatum
                                        )

                                        .thenComparing(
                                                this::getNachname,
                                                String.CASE_INSENSITIVE_ORDER
                                        )

                                        .thenComparing(
                                                this::getVorname,
                                                String.CASE_INSENSITIVE_ORDER
                                        )

                                        .thenComparing(
                                                this::getKursName,
                                                String.CASE_INSENSITIVE_ORDER
                                        )

                                        .thenComparing(
                                                Anwesenheit::getId
                                        )
                        )

                        .toList();


        /* =================================================
           EXCEL ERSTELLEN
           ================================================= */

        try (

                Workbook workbook =
                        new XSSFWorkbook();

                ByteArrayOutputStream outputStream =
                        new ByteArrayOutputStream()

        ) {

            CellStyle headerStyle =
                    createHeaderStyle(workbook);

            CellStyle dateStyle =
                    createDateStyle(workbook);

            CellStyle textStyle =
                    createTextStyle(workbook);

            CellStyle presentStyle =
                    createStatusStyle(
                            workbook,
                            IndexedColors.LIGHT_GREEN
                    );

            CellStyle excusedStyle =
                    createStatusStyle(
                            workbook,
                            IndexedColors.LIGHT_YELLOW
                    );

            CellStyle absentStyle =
                    createStatusStyle(
                            workbook,
                            IndexedColors.ROSE
                    );


            createArchivSheet(

                    workbook,

                    anwesenheiten,

                    headerStyle,

                    dateStyle,

                    textStyle,

                    presentStyle,

                    excusedStyle,

                    absentStyle
            );


            createSummarySheet(

                    workbook,

                    anwesenheiten,

                    von,

                    bis,

                    filterTyp,

                    filterId,

                    headerStyle,

                    dateStyle,

                    textStyle
            );


            workbook.write(outputStream);

            return outputStream.toByteArray();
        }
    }


    /* =====================================================
       REQUEST VALIDIEREN
       ===================================================== */

    private void validateRequest(

            LocalDate von,

            LocalDate bis,

            AnaArchivFilter filterTyp,

            Long filterId

    ) {

        if (von == null || bis == null) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Von- und Bis-Datum müssen angegeben werden."
            );
        }

        if (von.isAfter(bis)) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Das Von-Datum darf nicht nach dem Bis-Datum liegen."
            );
        }

        if (filterTyp == null) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Der Filtertyp muss angegeben werden."
            );
        }

        if (

                filterTyp != AnaArchivFilter.ALLE &&

                        (filterId == null || filterId <= 0)

        ) {

            throw new ResponseStatusException(

                    HttpStatus.BAD_REQUEST,

                    "Für den ausgewählten Filter muss eine gültige ID angegeben werden."
            );
        }
    }


    /* =====================================================
       FILTER
       ===================================================== */

    private boolean matchesFilter(

            Anwesenheit anwesenheit,

            AnaArchivFilter filterTyp,

            Long filterId

    ) {

        Student student =
                anwesenheit.getStudent();

        Kurs kurs =
                anwesenheit.getKurs();


        return switch (filterTyp) {

            case ALLE -> true;


            case SCHUELER ->

                    student != null &&

                            Objects.equals(
                                    student.getId(),
                                    filterId
                            );


            case ANA ->

                    kurs != null &&

                            Objects.equals(
                                    kurs.getId(),
                                    filterId
                            );


            case KLASSE ->

                    student != null &&

                            student.getKlasseEntity() != null &&

                            Objects.equals(

                                    student.getKlasseEntity().getId(),

                                    filterId
                            );
        };
    }


    /* =====================================================
       ARCHIV ARBEITSBLATT
       ===================================================== */

    private void createArchivSheet(

            Workbook workbook,

            List<Anwesenheit> anwesenheiten,

            CellStyle headerStyle,

            CellStyle dateStyle,

            CellStyle textStyle,

            CellStyle presentStyle,

            CellStyle excusedStyle,

            CellStyle absentStyle

    ) {

        Sheet sheet =
                workbook.createSheet(
                        "ANA-Archiv"
                );


        /* =================================================
           HEADER
           ================================================= */

        Row headerRow =
                sheet.createRow(0);

        headerRow.setHeightInPoints(26);

        for (

                int column = 0;

                column < HEADERS.length;

                column++

        ) {

            Cell cell =
                    headerRow.createCell(column);

            cell.setCellValue(
                    HEADERS[column]
            );

            cell.setCellStyle(
                    headerStyle
            );
        }


        /* =================================================
           DATEN
           ================================================= */

        int rowIndex = 1;

        for (Anwesenheit anwesenheit : anwesenheiten) {

            Row row =
                    sheet.createRow(rowIndex++);

            Student student =
                    anwesenheit.getStudent();

            Kurs kurs =
                    anwesenheit.getKurs();

            String status =
                    normalizeStatus(
                            anwesenheit.getStatus()
                    );


            /* DATUM */

            Cell dateCell =
                    row.createCell(0);

            if (anwesenheit.getDatum() != null) {

                dateCell.setCellValue(
                        anwesenheit.getDatum()
                );
            }

            dateCell.setCellStyle(
                    dateStyle
            );


            /* WOCHENTAG */

            writeText(

                    row,

                    1,

                    getWochentag(
                            anwesenheit.getDatum()
                    ),

                    textStyle
            );


            /* NACHNAME */

            writeText(

                    row,

                    2,

                    getNachname(anwesenheit),

                    textStyle
            );


            /* VORNAME */

            writeText(

                    row,

                    3,

                    getVorname(anwesenheit),

                    textStyle
            );


            /* KLASSE */

            writeText(

                    row,

                    4,

                    student != null

                            ? student.getKlasse()

                            : "",

                    textStyle
            );


            /* JAHRGANG */

            Cell jahrgangCell =
                    row.createCell(5);

            if (

                    student != null &&

                            student.getJahrgang() != null

            ) {

                jahrgangCell.setCellValue(
                        student.getJahrgang()
                );
            }

            jahrgangCell.setCellStyle(
                    textStyle
            );


            /* ANA-KURS */

            writeText(

                    row,

                    6,

                    getKursName(anwesenheit),

                    textStyle
            );


            /* KURSLEITUNG */

            writeText(

                    row,

                    7,

                    kurs != null

                            ? kurs.getKursleitung()

                            : "",

                    textStyle
            );


            /* STATUS */

            Cell statusCell =
                    row.createCell(8);

            statusCell.setCellValue(
                    getStatusLabel(status)
            );

            switch (status) {

                case "ANWESEND" ->

                        statusCell.setCellStyle(
                                presentStyle
                        );

                case "ENTSCHULDIGT" ->

                        statusCell.setCellStyle(
                                excusedStyle
                        );

                case "FEHLT" ->

                        statusCell.setCellStyle(
                                absentStyle
                        );

                default ->

                        statusCell.setCellStyle(
                                textStyle
                        );
            }


            /* BEMERKUNG */

            writeText(

                    row,

                    9,

                    anwesenheit.getBemerkung(),

                    textStyle
            );
        }


        /* =================================================
           SPALTENBREITEN
           ================================================= */

        int[] widths = {

                15,

                18,

                25,

                25,

                22,

                22,

                38,

                30,

                22,

                65
        };

        for (

                int column = 0;

                column < widths.length;

                column++

        ) {

            sheet.setColumnWidth(

                    column,

                    widths[column] * 256
            );
        }


        /* =================================================
           FILTER UND FIXIERTE KOPFZEILE
           ================================================= */

        sheet.createFreezePane(
                0,
                1
        );

        sheet.setAutoFilter(

                new CellRangeAddress(

                        0,

                        Math.max(
                                0,
                                rowIndex - 1
                        ),

                        0,

                        HEADERS.length - 1
                )
        );

        sheet.setDisplayGridlines(false);
    }


    /* =====================================================
       ZUSAMMENFASSUNG
       ===================================================== */

    private void createSummarySheet(

            Workbook workbook,

            List<Anwesenheit> anwesenheiten,

            LocalDate von,

            LocalDate bis,

            AnaArchivFilter filterTyp,

            Long filterId,

            CellStyle headerStyle,

            CellStyle dateStyle,

            CellStyle textStyle

    ) {

        Sheet sheet =
                workbook.createSheet(
                        "Zusammenfassung"
                );


        /* =================================================
           STATISTIK BERECHNEN
           ================================================= */

        long insgesamt =
                anwesenheiten.size();

        long anwesend =
                countStatus(
                        anwesenheiten,
                        "ANWESEND"
                );

        long entschuldigt =
                countStatus(
                        anwesenheiten,
                        "ENTSCHULDIGT"
                );

        long fehlend =
                countStatus(
                        anwesenheiten,
                        "FEHLT"
                );

        long unbekannt =

                insgesamt -

                        anwesend -

                        entschuldigt -

                        fehlend;


        long anzahlSchueler =
                anwesenheiten.stream()

                        .map(Anwesenheit::getStudent)

                        .filter(Objects::nonNull)

                        .map(Student::getId)

                        .filter(Objects::nonNull)

                        .distinct()

                        .count();


        long anzahlKurse =
                anwesenheiten.stream()

                        .map(Anwesenheit::getKurs)

                        .filter(Objects::nonNull)

                        .map(Kurs::getId)

                        .filter(Objects::nonNull)

                        .distinct()

                        .count();


        /* =================================================
           TITEL
           ================================================= */

        Row titleRow =
                sheet.createRow(0);

        writeText(

                titleRow,

                0,

                "ANA-Anwesenheitsarchiv",

                headerStyle
        );

        writeText(

                titleRow,

                1,

                "",

                headerStyle
        );

        sheet.addMergedRegion(

                new CellRangeAddress(
                        0,
                        0,
                        0,
                        1
                )
        );

        titleRow.setHeightInPoints(28);


        /* =================================================
           EXPORTPARAMETER
           ================================================= */

        Row vonRow =
                sheet.createRow(2);

        writeText(
                vonRow,
                0,
                "Zeitraum von",
                textStyle
        );

        Cell vonCell =
                vonRow.createCell(1);

        vonCell.setCellValue(von);

        vonCell.setCellStyle(dateStyle);


        Row bisRow =
                sheet.createRow(3);

        writeText(
                bisRow,
                0,
                "Zeitraum bis",
                textStyle
        );

        Cell bisCell =
                bisRow.createCell(1);

        bisCell.setCellValue(bis);

        bisCell.setCellStyle(dateStyle);


        Row filterRow =
                sheet.createRow(4);

        writeText(

                filterRow,

                0,

                "Filter",

                textStyle
        );

        writeText(

                filterRow,

                1,

                getFilterLabel(filterTyp),

                textStyle
        );


        Row filterIdRow =
                sheet.createRow(5);

        writeText(

                filterIdRow,

                0,

                "Filter-ID",

                textStyle
        );

        writeText(

                filterIdRow,

                1,

                filterTyp == AnaArchivFilter.ALLE

                        ? "–"

                        : String.valueOf(filterId),

                textStyle
        );


        /* =================================================
           STATISTIK HEADER
           ================================================= */

        Row headerRow =
                sheet.createRow(7);

        writeText(

                headerRow,

                0,

                "Kennzahl",

                headerStyle
        );

        writeText(

                headerRow,

                1,

                "Anzahl",

                headerStyle
        );


        /* =================================================
           STATISTIKWERTE
           ================================================= */

        writeStatistic(

                sheet,

                8,

                "Erfasste ANA-Einträge",

                insgesamt,

                textStyle
        );

        writeStatistic(

                sheet,

                9,

                "Anwesend",

                anwesend,

                textStyle
        );

        writeStatistic(

                sheet,

                10,

                "Entschuldigt",

                entschuldigt,

                textStyle
        );

        writeStatistic(

                sheet,

                11,

                "Fehlt",

                fehlend,

                textStyle
        );

        writeStatistic(

                sheet,

                12,

                "Unbekannter Status",

                unbekannt,

                textStyle
        );

        writeStatistic(

                sheet,

                13,

                "Schüler mit ANA-Einträgen",

                anzahlSchueler,

                textStyle
        );

        writeStatistic(

                sheet,

                14,

                "ANA-Kurse mit Einträgen",

                anzahlKurse,

                textStyle
        );


        /* =================================================
           HINWEISE
           ================================================= */

        Row hintHeader =
                sheet.createRow(16);

        writeText(

                hintHeader,

                0,

                "Wichtige Hinweise",

                headerStyle
        );

        writeText(

                hintHeader,

                1,

                "",

                headerStyle
        );

        sheet.addMergedRegion(

                new CellRangeAddress(
                        16,
                        16,
                        0,
                        1
                )
        );


        writeHint(

                sheet,

                17,

                "Dieses Archiv enthält historische Anwesenheiten "
                        + "einzelner ANA-Kurse.",

                textStyle
        );

        writeHint(

                sheet,

                18,

                "Mehrere ANA-Einträge pro Schüler und Tag "
                        + "sind möglich.",

                textStyle
        );

        writeHint(

                sheet,

                19,

                "Die historischen ANA-Einträge werden nicht "
                        + "mit den Tagesanwesenheiten verrechnet.",

                textStyle
        );

        writeHint(

                sheet,

                20,

                "Klasse, Jahrgang, Schülername, Kursname und "
                        + "Kursleitung entsprechen den aktuell "
                        + "gespeicherten Stammdaten.",

                textStyle
        );

        writeHint(

                sheet,

                21,

                "Der Klassenfilter berücksichtigt die aktuelle "
                        + "Klassenzuordnung der Schüler.",

                textStyle
        );

        writeHint(

                sheet,

                22,

                "Die Anzahl der ANA-Einträge entspricht nicht "
                        + "der Anzahl der Schultage.",

                textStyle
        );

        writeHint(

                sheet,

                23,

                "Diese Datei enthält personenbezogene Daten "
                        + "und ist vertraulich zu behandeln.",

                textStyle
        );


        /* =================================================
           FORMATIERUNG
           ================================================= */

        sheet.setColumnWidth(
                0,
                43 * 256
        );

        sheet.setColumnWidth(
                1,
                35 * 256
        );

        sheet.setDisplayGridlines(false);
    }


    /* =====================================================
       STATISTIK HILFSMETHODEN
       ===================================================== */

    private long countStatus(

            List<Anwesenheit> anwesenheiten,

            String status

    ) {

        return anwesenheiten.stream()

                .filter(anwesenheit ->

                        status.equals(

                                normalizeStatus(
                                        anwesenheit.getStatus()
                                )
                        )
                )

                .count();
    }


    private void writeStatistic(

            Sheet sheet,

            int rowIndex,

            String label,

            long value,

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

        Cell valueCell =
                row.createCell(1);

        valueCell.setCellValue(value);

        valueCell.setCellStyle(style);
    }


    private void writeHint(

            Sheet sheet,

            int rowIndex,

            String text,

            CellStyle style

    ) {

        Row row =
                sheet.createRow(rowIndex);

        row.setHeightInPoints(42);

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
       STAMMDATEN
       ===================================================== */

    private String getNachname(
            Anwesenheit anwesenheit
    ) {

        return anwesenheit.getStudent() != null

                ? safeText(
                anwesenheit.getStudent().getNachname()
        )

                : "";
    }


    private String getVorname(
            Anwesenheit anwesenheit
    ) {

        return anwesenheit.getStudent() != null

                ? safeText(
                anwesenheit.getStudent().getVorname()
        )

                : "";
    }


    private String getKursName(
            Anwesenheit anwesenheit
    ) {

        return anwesenheit.getKurs() != null

                ? safeText(
                anwesenheit.getKurs().getName()
        )

                : "";
    }


    private String getWochentag(
            LocalDate datum
    ) {

        if (datum == null) {

            return "";
        }

        return datum

                .getDayOfWeek()

                .getDisplayName(

                        TextStyle.FULL,

                        Locale.GERMAN
                );
    }


    /* =====================================================
       STATUS
       ===================================================== */

    private String normalizeStatus(
            String status
    ) {

        return safeText(status)

                .trim()

                .toUpperCase(Locale.ROOT);
    }


    private String getStatusLabel(
            String status
    ) {

        return switch (status) {

            case "ANWESEND" ->
                    "Anwesend";

            case "ENTSCHULDIGT" ->
                    "Entschuldigt";

            case "FEHLT" ->
                    "Fehlt";

            default ->
                    status.isBlank()

                            ? "Unbekannt"

                            : "Unbekannt (" + status + ")";
        };
    }


    private String getFilterLabel(
            AnaArchivFilter filterTyp
    ) {

        return switch (filterTyp) {

            case ALLE ->
                    "Alle Schüler";

            case KLASSE ->
                    "Klasse (aktuell)";

            case ANA ->
                    "ANA-Kurs";

            case SCHUELER ->
                    "Einzelner Schüler";
        };
    }


    /* =====================================================
       EXCEL ZELLEN
       ===================================================== */

    private void writeText(

            Row row,

            int column,

            String value,

            CellStyle style

    ) {

        Cell cell =
                row.createCell(column);

        cell.setCellValue(
                safeText(value)
        );

        cell.setCellStyle(style);
    }


    private String safeText(
            String value
    ) {

        return value != null

                ? value

                : "";
    }


    /* =====================================================
       HEADER STYLE
       ===================================================== */

    private CellStyle createHeaderStyle(
            Workbook workbook
    ) {

        CellStyle style =
                workbook.createCellStyle();

        Font font =
                workbook.createFont();

        font.setBold(true);

        font.setColor(
                IndexedColors.WHITE.getIndex()
        );

        style.setFont(font);

        style.setFillForegroundColor(
                IndexedColors.DARK_BLUE.getIndex()
        );

        style.setFillPattern(
                FillPatternType.SOLID_FOREGROUND
        );

        style.setVerticalAlignment(
                VerticalAlignment.CENTER
        );

        style.setBorderBottom(
                BorderStyle.THIN
        );

        return style;
    }


    /* =====================================================
       DATUM STYLE
       ===================================================== */

    private CellStyle createDateStyle(
            Workbook workbook
    ) {

        CellStyle style =
                workbook.createCellStyle();

        DataFormat dataFormat =
                workbook.createDataFormat();

        style.setDataFormat(

                dataFormat.getFormat(
                        "dd.MM.yyyy"
                )
        );

        style.setVerticalAlignment(
                VerticalAlignment.CENTER
        );

        return style;
    }


    /* =====================================================
       TEXT STYLE
       ===================================================== */

    private CellStyle createTextStyle(
            Workbook workbook
    ) {

        CellStyle style =
                workbook.createCellStyle();

        style.setVerticalAlignment(
                VerticalAlignment.CENTER
        );

        style.setWrapText(true);

        return style;
    }


    /* =====================================================
       STATUS STYLE
       ===================================================== */

    private CellStyle createStatusStyle(

            Workbook workbook,

            IndexedColors color

    ) {

        CellStyle style =
                workbook.createCellStyle();

        Font font =
                workbook.createFont();

        font.setBold(true);

        style.setFont(font);

        style.setFillForegroundColor(
                color.getIndex()
        );

        style.setFillPattern(
                FillPatternType.SOLID_FOREGROUND
        );

        style.setVerticalAlignment(
                VerticalAlignment.CENTER
        );

        return style;
    }
}