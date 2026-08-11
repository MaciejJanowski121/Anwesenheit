package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Anwesenheit;
import com.example.anwesenheit.repository.AnwesenheitRepository;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import java.util.List;

@Service
public class AnwesenheitExportService {

    private final AnwesenheitRepository anwesenheitRepository;

    public AnwesenheitExportService(
            AnwesenheitRepository anwesenheitRepository
    ) {
        this.anwesenheitRepository = anwesenheitRepository;
    }

    /*
     * Erstellt eine Excel-Datei für den ausgewählten Zeitraum.
     *
     * kursId == null:
     * Alle Kurse exportieren.
     *
     * kursId != null:
     * Nur den ausgewählten Kurs exportieren.
     */
    public byte[] exportAnwesenheiten(
            LocalDate von,
            LocalDate bis,
            Long kursId
    ) throws IOException {

        List<Anwesenheit> anwesenheiten;

        if (kursId == null) {
            anwesenheiten =
                    anwesenheitRepository
                            .findByDatumBetweenOrderByDatumAsc(
                                    von,
                                    bis
                            );
        } else {
            anwesenheiten =
                    anwesenheitRepository
                            .findByKursIdAndDatumBetweenOrderByDatumAsc(
                                    kursId,
                                    von,
                                    bis
                            );
        }

        try (
                Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream =
                        new ByteArrayOutputStream()
        ) {

            Sheet sheet =
                    workbook.createSheet("Anwesenheit");

            /*
             * Header Style
             */
            CellStyle headerStyle =
                    workbook.createCellStyle();

            Font headerFont =
                    workbook.createFont();

            headerFont.setBold(true);

            headerStyle.setFont(headerFont);

            /*
             * Header erstellen
             */
            Row headerRow =
                    sheet.createRow(0);

            String[] headers = {
                    "Datum",
                    "Schüler",
                    "Klasse",
                    "Kurs",
                    "Kursleitung",
                    "Status",
                    "Bemerkung"
            };

            for (
                    int column = 0;
                    column < headers.length;
                    column++
            ) {

                Cell cell =
                        headerRow.createCell(column);

                cell.setCellValue(
                        headers[column]
                );

                cell.setCellStyle(
                        headerStyle
                );
            }

            /*
             * Deutsches Datumsformat
             */
            DateTimeFormatter dateFormatter =
                    DateTimeFormatter.ofPattern(
                            "dd.MM.yyyy"
                    );

            /*
             * Datenzeilen
             */
            int rowIndex = 1;

            for (
                    Anwesenheit anwesenheit :
                    anwesenheiten
            ) {

                Row row =
                        sheet.createRow(rowIndex++);

                /*
                 * Datum
                 */
                row.createCell(0)
                        .setCellValue(
                                anwesenheit.getDatum() != null
                                        ? anwesenheit
                                          .getDatum()
                                          .format(
                                                  dateFormatter
                                          )
                                        : ""
                        );

                /*
                 * Schüler
                 */
                String studentName = "";

                if (
                        anwesenheit.getStudent()
                                != null
                ) {

                    String nachname =
                            anwesenheit
                                    .getStudent()
                                    .getNachname();

                    String vorname =
                            anwesenheit
                                    .getStudent()
                                    .getVorname();

                    if (nachname == null) {
                        nachname = "";
                    }

                    if (vorname == null) {
                        vorname = "";
                    }

                    studentName =
                            nachname +
                                    (
                                            !nachname.isBlank()
                                                    &&
                                                    !vorname.isBlank()
                                                    ? ", "
                                                    : ""
                                    ) +
                                    vorname;
                }

                row.createCell(1)
                        .setCellValue(
                                studentName
                        );

                /*
                 * Klasse
                 */
                row.createCell(2)
                        .setCellValue(
                                anwesenheit.getStudent() != null
                                        &&
                                        anwesenheit
                                                .getStudent()
                                                .getKlasse()
                                                != null

                                        ? anwesenheit
                                          .getStudent()
                                          .getKlasse()

                                        : ""
                        );

                /*
                 * Kurs
                 */
                row.createCell(3)
                        .setCellValue(
                                anwesenheit.getKurs() != null
                                        &&
                                        anwesenheit
                                                .getKurs()
                                                .getName()
                                                != null

                                        ? anwesenheit
                                          .getKurs()
                                          .getName()

                                        : ""
                        );

                /*
                 * Kursleitung
                 */
                row.createCell(4)
                        .setCellValue(
                                anwesenheit.getKurs() != null
                                        &&
                                        anwesenheit
                                                .getKurs()
                                                .getKursleitung()
                                                != null

                                        ? anwesenheit
                                          .getKurs()
                                          .getKursleitung()

                                        : ""
                        );

                /*
                 * Status
                 */
                row.createCell(5)
                        .setCellValue(
                                anwesenheit.getStatus()
                                        != null

                                        ? anwesenheit
                                          .getStatus()

                                        : ""
                        );

                /*
                 * Bemerkung
                 */
                row.createCell(6)
                        .setCellValue(
                                anwesenheit.getBemerkung()
                                        != null

                                        ? anwesenheit
                                          .getBemerkung()

                                        : ""
                        );
            }

            /*
             * Spalten automatisch an Inhalt anpassen.
             */
            for (
                    int column = 0;
                    column < headers.length;
                    column++
            ) {
                sheet.autoSizeColumn(column);

                /*
                 * Etwas zusätzlichen Platz hinzufügen.
                 */
                int currentWidth =
                        sheet.getColumnWidth(column);

                sheet.setColumnWidth(
                        column,
                        Math.min(
                                currentWidth + 1000,
                                255 * 256
                        )
                );
            }

            /*
             * Header beim Scrollen sichtbar lassen.
             */
            sheet.createFreezePane(
                    0,
                    1
            );

            /*
             * Excel Filter aktivieren.
             */
            sheet.setAutoFilter(
                    new org.apache.poi.ss.util.CellRangeAddress(
                            0,
                            Math.max(
                                    0,
                                    rowIndex - 1
                            ),
                            0,
                            headers.length - 1
                    )
            );

            workbook.write(
                    outputStream
            );

            return outputStream.toByteArray();
        }
    }
}