package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.BuchungRepository;
import com.example.anwesenheit.repository.KursRepository;
import com.example.anwesenheit.repository.StudentRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
public class ExcelImportService {

    private static final int FIRST_DATA_ROW_INDEX = 6;
    private static final int FIRST_KURS_COLUMN = 19;
    private static final int LAST_KURS_COLUMN = 95;
    private static final int KURS_HEADER_ROW = 5;

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

    public void importStudents(MultipartFile file) {
        buchungRepository.deleteAll();
        kursRepository.deleteAll();
        studentRepository.deleteAll();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter formatter = new DataFormatter();

            Map<Integer, Kurs> kursByColumn = importKurse(sheet, evaluator, formatter);

            for (int i = FIRST_DATA_ROW_INDEX; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);

                if (row == null) {
                    continue;
                }

                String name = getStringValue(row.getCell(1), evaluator, formatter);

                if (name == null || name.isBlank()) {
                    continue;
                }

                Student student = new Student();

                student.setName(name);
                student.setJahrgang(getIntegerValue(row.getCell(2), evaluator, formatter));
                student.setKlasse(getStringValue(row.getCell(3), evaluator, formatter));
                student.setGehtUm1530(getBooleanValue(row.getCell(4), evaluator, formatter));
                student.setRueckmeldung(getStringValue(row.getCell(5), evaluator, formatter));
                student.setAnaBuchung(getStringValue(row.getCell(17), evaluator, formatter));
                student.setMittagessen(getBooleanValue(row.getCell(18), evaluator, formatter));

                student.setEmail1(null);
                student.setEmail2(null);

                Student savedStudent = studentRepository.save(student);

                importBuchungen(row, savedStudent, kursByColumn, evaluator, formatter);
            }

        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Excel-Import", e);
        }
    }

    private Map<Integer, Kurs> importKurse(
            Sheet sheet,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {
        Map<Integer, Kurs> kursByColumn = new HashMap<>();

        Row headerRow = sheet.getRow(KURS_HEADER_ROW);

        for (int column = FIRST_KURS_COLUMN; column <= LAST_KURS_COLUMN; column++) {
            String header = getStringValue(headerRow.getCell(column), evaluator, formatter);

            if (header == null || header.isBlank()) {
                continue;
            }

            if (isFreiColumn(header)) {
                continue;
            }

            Kurs kurs = new Kurs();
            kurs.setName(extractKursName(header));
            kurs.setWochentag(extractWochentag(header));
            kurs.setUhrzeit(null);
            kurs.setBeschreibung(header);

            Kurs savedKurs = kursRepository.save(kurs);
            kursByColumn.put(column, savedKurs);
        }

        return kursByColumn;
    }

    private void importBuchungen(
            Row row,
            Student student,
            Map<Integer, Kurs> kursByColumn,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {
        for (Map.Entry<Integer, Kurs> entry : kursByColumn.entrySet()) {
            Integer column = entry.getKey();
            Kurs kurs = entry.getValue();

            String value = getStringValue(row.getCell(column), evaluator, formatter);

            if (isKursGebucht(value)) {
                Buchung buchung = new Buchung();
                buchung.setStudent(student);
                buchung.setKurs(kurs);

                buchungRepository.save(buchung);
            }
        }
    }

    private String extractWochentag(String header) {
        String lower = header.toLowerCase();

        if (lower.contains("montag")) return "Montag";
        if (lower.contains("dienstag")) return "Dienstag";
        if (lower.contains("mittwoch")) return "Mittwoch";
        if (lower.contains("donnerstag")) return "Donnerstag";
        if (lower.contains("freitag")) return "Freitag";

        return null;
    }

    private String extractKursName(String header) {
        return header
                .replace("Montag", "")
                .replace("Dienstag", "")
                .replace("Mittwoch", "")
                .replace("Donnerstag", "")
                .replace("Freitag", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean isFreiColumn(String header) {
        String normalized = header.trim().toLowerCase();

        return normalized.equals("frei")
                || normalized.endsWith(" frei")
                || normalized.contains(" montag frei")
                || normalized.contains(" dienstag frei")
                || normalized.contains(" mittwoch frei")
                || normalized.contains(" donnerstag frei")
                || normalized.contains(" freitag frei");
    }

    private boolean isKursGebucht(String value) {
        if (value == null) {
            return false;
        }

        String normalized = value.trim().toLowerCase();

        return normalized.equals("1")
                || normalized.equals("x")
                || normalized.equals("ja")
                || normalized.equals("true");
    }

    private String getStringValue(Cell cell, FormulaEvaluator evaluator, DataFormatter formatter) {
        if (cell == null) {
            return null;
        }

        try {
            if (cell.getCellType() == CellType.FORMULA) {
                CellValue cellValue = evaluator.evaluate(cell);

                if (cellValue == null) {
                    return null;
                }

                return switch (cellValue.getCellType()) {
                    case STRING -> cellValue.getStringValue().trim();
                    case NUMERIC -> formatter.formatRawCellContents(
                            cellValue.getNumberValue(),
                            cell.getCellStyle().getDataFormat(),
                            cell.getCellStyle().getDataFormatString()
                    ).trim();
                    case BOOLEAN -> String.valueOf(cellValue.getBooleanValue());
                    default -> null;
                };
            }

            String value = formatter.formatCellValue(cell).trim();
            return value.isBlank() ? null : value;

        } catch (Exception e) {
            String formula = cell.getCellFormula();
            return formula == null || formula.isBlank() ? null : formula;
        }
    }

    private Integer getIntegerValue(Cell cell, FormulaEvaluator evaluator, DataFormatter formatter) {
        String value = getStringValue(cell, evaluator, formatter);

        if (value == null) {
            return null;
        }

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean getBooleanValue(Cell cell, FormulaEvaluator evaluator, DataFormatter formatter) {
        String value = getStringValue(cell, evaluator, formatter);

        if (value == null) {
            return false;
        }

        value = value.trim().toLowerCase();

        return value.equals("ja")
                || value.equals("x")
                || value.equals("true")
                || value.equals("1")
                || value.contains("mittagessen")
                || value.contains("15:30");
    }
}