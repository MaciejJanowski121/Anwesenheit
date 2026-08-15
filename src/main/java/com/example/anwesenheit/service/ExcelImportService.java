package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.BuchungRepository;
import com.example.anwesenheit.repository.KursRepository;
import com.example.anwesenheit.repository.StudentRepository;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ExcelImportService {

    private final StudentRepository studentRepository;
    private final KursRepository kursRepository;
    private final BuchungRepository buchungRepository;

    public ExcelImportService(
            StudentRepository studentRepository,
            KursRepository kursRepository,
            BuchungRepository buchungRepository
    ) {
        this.studentRepository = studentRepository;
        this.kursRepository = kursRepository;
        this.buchungRepository = buchungRepository;
    }

    /* =====================================================
       SCHÜLER IMPORT
       ===================================================== */

    @Transactional
    public void importStudents(MultipartFile file) {

        validateFile(file);

        try (
                Workbook workbook =
                        new XSSFWorkbook(
                                file.getInputStream()
                        )
        ) {
            Sheet sheet =
                    workbook.getSheetAt(0);

            FormulaEvaluator evaluator =
                    workbook
                            .getCreationHelper()
                            .createFormulaEvaluator();

            DataFormatter formatter =
                    new DataFormatter(
                            Locale.GERMANY
                    );

            /*
             * Feste Struktur des Schülerimports:
             *
             * 0  ID_Kind
             * 1  Name
             * 2  Vorname
             * 3  Jahrgang
             * 4  Klasse
             * 5  Foto- und Bildfreigabe
             * 6  E-Mail 1
             * 7  Telefon 1
             * 8  Mobil 1
             * 9  E-Mail 2
             * 10 Telefon 2
             * 11 Mobil 2
             */

            for (
                    int i = 1;
                    i <= sheet.getLastRowNum();
                    i++
            ) {
                Row row =
                        sheet.getRow(i);

                if (
                        row == null ||
                                isRowEmpty(
                                        row,
                                        evaluator,
                                        formatter
                                )
                ) {
                    continue;
                }

                Long idKind =
                        getLongValue(
                                row.getCell(0),
                                evaluator,
                                formatter
                        );

                String nachname =
                        getStringValue(
                                row.getCell(1),
                                evaluator,
                                formatter
                        );

                String vorname =
                        getStringValue(
                                row.getCell(2),
                                evaluator,
                                formatter
                        );

                Integer jahrgang =
                        getIntegerValue(
                                row.getCell(3),
                                evaluator,
                                formatter
                        );

                String klasse =
                        getStringValue(
                                row.getCell(4),
                                evaluator,
                                formatter
                        );

                String fotoFreigabe =
                        getFotoFreigabeValue(
                                row.getCell(5),
                                evaluator,
                                formatter
                        );

                /*
                 * Nachname und Vorname bleiben Pflichtfelder.
                 */
                if (
                        nachname == null ||
                                nachname.isBlank()
                ) {
                    continue;
                }

                if (
                        vorname == null ||
                                vorname.isBlank()
                ) {
                    continue;
                }

                /*
                 * Wenn ID_Kind vorhanden ist:
                 *
                 * - vorhandenen Schüler aktualisieren
                 * - sonst neuen Schüler erstellen
                 *
                 * Dadurch bleiben interne Datenbank-ID,
                 * Buchungen und Anwesenheiten erhalten.
                 */
                Student student;

                if (idKind != null) {
                    student =
                            studentRepository
                                    .findByIdKind(idKind)
                                    .orElseGet(Student::new);
                } else {
                    /*
                     * Falls ausnahmsweise keine ID_Kind
                     * vorhanden ist, wird ein neuer Schüler
                     * angelegt.
                     */
                    student =
                            new Student();
                }

                /*
                 * ID_Kind wird nur gesetzt, wenn sie
                 * tatsächlich aus dem Import vorhanden ist.
                 */
                if (idKind != null) {
                    student.setIdKind(
                            idKind
                    );
                }

                student.setNachname(
                        nachname
                );

                student.setVorname(
                        vorname
                );

                student.setJahrgang(
                        jahrgang
                );

                student.setKlasse(
                        klasse
                );

                student.setFotoFreigabe(
                        fotoFreigabe
                );

                student.setEmail1(
                        getStringValue(
                                row.getCell(6),
                                evaluator,
                                formatter
                        )
                );

                student.setTelefon1(
                        getStringValue(
                                row.getCell(7),
                                evaluator,
                                formatter
                        )
                );

                student.setMobil1(
                        getStringValue(
                                row.getCell(8),
                                evaluator,
                                formatter
                        )
                );

                student.setEmail2(
                        getStringValue(
                                row.getCell(9),
                                evaluator,
                                formatter
                        )
                );

                student.setTelefon2(
                        getStringValue(
                                row.getCell(10),
                                evaluator,
                                formatter
                        )
                );

                student.setMobil2(
                        getStringValue(
                                row.getCell(11),
                                evaluator,
                                formatter
                        )
                );

                /*
                 * gehtUm1530 wird absichtlich NICHT
                 * überschrieben.
                 *
                 * Diese Information wird innerhalb
                 * der Anwendung gepflegt.
                 */

                studentRepository.save(
                        student
                );
            }

        } catch (Exception e) {
            throw new RuntimeException(
                    "Fehler beim Schüler-Import: "
                            + e.getMessage(),
                    e
            );
        }
    }

    /* =====================================================
       KURS IMPORT
       ===================================================== */

    @Transactional
    public void importKurse(
            MultipartFile file
    ) {

        validateFile(file);

        try (
                Workbook workbook =
                        new XSSFWorkbook(
                                file.getInputStream()
                        )
        ) {
            Sheet sheet =
                    workbook.getSheetAt(0);

            FormulaEvaluator evaluator =
                    workbook
                            .getCreationHelper()
                            .createFormulaEvaluator();

            DataFormatter formatter =
                    new DataFormatter(
                            Locale.GERMANY
                    );

            List<Kurs> kurse =
                    new ArrayList<>();

            /*
             * Feste Struktur des Kursimports:
             *
             * 0 Kurs
             * 1 Kursleitung
             * 2 Wochentag
             * 3 Uhrzeit
             * 4 Buchungsart
             * 5 Kursgebühr
             */

            for (
                    int i = 1;
                    i <= sheet.getLastRowNum();
                    i++
            ) {
                Row row =
                        sheet.getRow(i);

                if (
                        row == null ||
                                isRowEmpty(
                                        row,
                                        evaluator,
                                        formatter
                                )
                ) {
                    continue;
                }

                String name =
                        getStringValue(
                                row.getCell(0),
                                evaluator,
                                formatter
                        );

                String kursleitung =
                        getStringValue(
                                row.getCell(1),
                                evaluator,
                                formatter
                        );

                String wochentag =
                        getStringValue(
                                row.getCell(2),
                                evaluator,
                                formatter
                        );

                String uhrzeit =
                        getStringValue(
                                row.getCell(3),
                                evaluator,
                                formatter
                        );

                String buchungsart =
                        getStringValue(
                                row.getCell(4),
                                evaluator,
                                formatter
                        );

                Double kursgebuehr =
                        getDoubleValue(
                                row.getCell(5),
                                evaluator,
                                formatter
                        );

                if (
                        name == null ||
                                name.isBlank()
                ) {
                    continue;
                }

                Kurs kurs =
                        new Kurs();

                kurs.setName(
                        name
                );

                kurs.setKursleitung(
                        kursleitung
                );

                kurs.setWochentag(
                        wochentag
                );

                kurs.setUhrzeit(
                        uhrzeit
                );

                kurs.setBuchungsart(
                        buchungsart
                );

                kurs.setKursgebuehr(
                        kursgebuehr
                );

                kurse.add(
                        kurs
                );
            }

            /*
             * Kursimport bleibt zunächst wie bisher:
             *
             * Buchungen werden gelöscht,
             * danach werden die Kurse neu angelegt.
             *
             * Falls die Kurs-IDs später ebenfalls
             * dauerhaft erhalten bleiben sollen,
             * können wir auch hier ein Update-Verfahren
             * einbauen.
             */
            buchungRepository.deleteAll();

            kursRepository.deleteAll();

            kursRepository.saveAll(
                    kurse
            );

        } catch (Exception e) {
            throw new RuntimeException(
                    "Fehler beim Kurs-Import: "
                            + e.getMessage(),
                    e
            );
        }
    }

    /* =====================================================
       DATEI VALIDIEREN
       ===================================================== */

    private void validateFile(
            MultipartFile file
    ) {

        if (
                file == null ||
                        file.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "Die hochgeladene Excel-Datei ist leer."
            );
        }

        String fileName =
                file.getOriginalFilename();

        if (
                fileName == null ||
                        !fileName
                                .toLowerCase(
                                        Locale.ROOT
                                )
                                .endsWith(".xlsx")
        ) {
            throw new IllegalArgumentException(
                    "Es werden nur Excel-Dateien im Format .xlsx unterstützt."
            );
        }
    }

    /* =====================================================
       LEERE ZEILE
       ===================================================== */

    private boolean isRowEmpty(
            Row row,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {

        if (row == null) {
            return true;
        }

        short firstCell =
                row.getFirstCellNum();

        short lastCell =
                row.getLastCellNum();

        if (
                firstCell < 0 ||
                        lastCell < 0
        ) {
            return true;
        }

        for (
                int i = firstCell;
                i < lastCell;
                i++
        ) {
            String value =
                    getStringValue(
                            row.getCell(i),
                            evaluator,
                            formatter
                    );

            if (
                    value != null &&
                            !value.isBlank()
            ) {
                return false;
            }
        }

        return true;
    }

    /* =====================================================
       STRING
       ===================================================== */

    private String getStringValue(
            Cell cell,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {

        if (cell == null) {
            return null;
        }

        try {
            if (
                    cell.getCellType() ==
                            CellType.FORMULA
            ) {
                CellValue cellValue =
                        evaluator.evaluate(
                                cell
                        );

                if (cellValue == null) {
                    return null;
                }

                String result =
                        switch (
                                cellValue.getCellType()
                                ) {
                            case STRING ->
                                    cellValue
                                            .getStringValue();

                            case NUMERIC ->
                                    formatter
                                            .formatRawCellContents(
                                                    cellValue
                                                            .getNumberValue(),
                                                    cell
                                                            .getCellStyle()
                                                            .getDataFormat(),
                                                    cell
                                                            .getCellStyle()
                                                            .getDataFormatString()
                                            );

                            case BOOLEAN ->
                                    String.valueOf(
                                            cellValue
                                                    .getBooleanValue()
                                    );

                            default ->
                                    null;
                        };

                return normalizeString(
                        result
                );
            }

            return normalizeString(
                    formatter.formatCellValue(
                            cell,
                            evaluator
                    )
            );

        } catch (Exception e) {
            return null;
        }
    }

    /* =====================================================
       STRING NORMALISIEREN
       ===================================================== */

    private String normalizeString(
            String value
    ) {

        if (value == null) {
            return null;
        }

        String normalized =
                value.trim();

        return normalized.isBlank()
                ? null
                : normalized;
    }

    /* =====================================================
       INTEGER
       ===================================================== */

    private Integer getIntegerValue(
            Cell cell,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {

        String value =
                getStringValue(
                        cell,
                        evaluator,
                        formatter
                );

        if (value == null) {
            return null;
        }

        try {
            String normalized =
                    value
                            .replace(
                                    "\u00A0",
                                    ""
                            )
                            .replace(
                                    " ",
                                    ""
                            )
                            .replace(
                                    ",",
                                    "."
                            )
                            .trim();

            double numericValue =
                    Double.parseDouble(
                            normalized
                    );

            return (int) numericValue;

        } catch (
                NumberFormatException e
        ) {
            return null;
        }
    }

    /* =====================================================
       LONG
       ===================================================== */

    private Long getLongValue(
            Cell cell,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {

        String value =
                getStringValue(
                        cell,
                        evaluator,
                        formatter
                );

        if (value == null) {
            return null;
        }

        try {
            String normalized =
                    value
                            .replace(
                                    "\u00A0",
                                    ""
                            )
                            .replace(
                                    " ",
                                    ""
                            )
                            .replace(
                                    ".",
                                    ""
                            )
                            .replace(
                                    ",",
                                    "."
                            )
                            .trim();

            double numericValue =
                    Double.parseDouble(
                            normalized
                    );

            return (long) numericValue;

        } catch (
                NumberFormatException e
        ) {
            return null;
        }
    }

    /* =====================================================
       DOUBLE
       ===================================================== */

    private Double getDoubleValue(
            Cell cell,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {

        String value =
                getStringValue(
                        cell,
                        evaluator,
                        formatter
                );

        if (value == null) {
            return null;
        }

        try {
            String normalized =
                    value
                            .replace(
                                    "€",
                                    ""
                            )
                            .replace(
                                    "\u00A0",
                                    ""
                            )
                            .replace(
                                    " ",
                                    ""
                            )
                            .replace(
                                    ".",
                                    ""
                            )
                            .replace(
                                    ",",
                                    "."
                            )
                            .trim();

            return Double.parseDouble(
                    normalized
            );

        } catch (
                NumberFormatException e
        ) {
            return null;
        }
    }

    /* =====================================================
       FOTO FREIGABE
       ===================================================== */

    private String getFotoFreigabeValue(
            Cell cell,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {

        String value =
                getStringValue(
                        cell,
                        evaluator,
                        formatter
                );

        if (
                value == null ||
                        value.isBlank()
        ) {
            return "Fehlt";
        }

        if (
                "0".equals(
                        value.trim()
                )
        ) {
            return "Keine Freigabe";
        }

        return value.trim();
    }
}