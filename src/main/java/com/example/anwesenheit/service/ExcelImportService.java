package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.StudentRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ExcelImportService {

    private final StudentRepository studentRepository;

    public ExcelImportService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public void importStudents(MultipartFile file) {
        studentRepository.deleteAll();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {

            Sheet sheet = workbook.getSheetAt(0);
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter formatter = new DataFormatter();

            for (int i = 6; i <= sheet.getLastRowNum(); i++) {
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

                student.setKlassenkuerzel(null);

                student.setAnaBuchung(getStringValue(row.getCell(17), evaluator, formatter));
                student.setMittagessen(getBooleanValue(row.getCell(18), evaluator, formatter));

                studentRepository.save(student);
            }

        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Excel-Import", e);
        }
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