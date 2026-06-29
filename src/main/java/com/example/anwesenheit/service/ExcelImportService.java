package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.BuchungRepository;
import com.example.anwesenheit.repository.KursRepository;
import com.example.anwesenheit.repository.StudentRepository;
import com.example.anwesenheit.repository.ZahlungRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ExcelImportService {

    private final StudentRepository studentRepository;
    private final KursRepository kursRepository;
    private final BuchungRepository buchungRepository;
    private final ZahlungRepository zahlungRepository;

    public ExcelImportService(
            StudentRepository studentRepository,
            KursRepository kursRepository,
            BuchungRepository buchungRepository,
            ZahlungRepository zahlungRepository
    ) {
        this.studentRepository = studentRepository;
        this.kursRepository = kursRepository;
        this.buchungRepository = buchungRepository;
        this.zahlungRepository = zahlungRepository;
    }

    public void importStudents(MultipartFile file) {
        zahlungRepository.deleteAll();
        buchungRepository.deleteAll();
        studentRepository.deleteAll();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter formatter = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);

                if (row == null) {
                    continue;
                }

                String nachname = getStringValue(row.getCell(0), evaluator, formatter);
                String vorname = getStringValue(row.getCell(1), evaluator, formatter);
                Integer jahrgang = getIntegerValue(row.getCell(2), evaluator, formatter);
                String klasse = getStringValue(row.getCell(3), evaluator, formatter);

                if (nachname == null || nachname.isBlank()) {
                    continue;
                }

                if (vorname == null || vorname.isBlank()) {
                    continue;
                }

                if (jahrgang == null || klasse == null || klasse.isBlank()) {
                    continue;
                }

                Student student = new Student();

                student.setNachname(nachname);
                student.setVorname(vorname);
                student.setJahrgang(jahrgang);
                student.setKlasse(klasse);
                student.setFotoFreigabe(getBooleanValue(row.getCell(4), evaluator, formatter));

                student.setEmail1(getStringValue(row.getCell(5), evaluator, formatter));
                student.setTelefon1(getStringValue(row.getCell(6), evaluator, formatter));
                student.setMobil1(getStringValue(row.getCell(7), evaluator, formatter));

                student.setEmail2(getStringValue(row.getCell(8), evaluator, formatter));
                student.setTelefon2(getStringValue(row.getCell(9), evaluator, formatter));
                student.setMobil2(getStringValue(row.getCell(10), evaluator, formatter));

                studentRepository.save(student);
            }

        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Schüler-Import", e);
        }
    }

    public void importKurse(MultipartFile file) {
        zahlungRepository.deleteAll();
        buchungRepository.deleteAll();
        kursRepository.deleteAll();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter formatter = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);

                if (row == null) {
                    continue;
                }

                String name = getStringValue(row.getCell(0), evaluator, formatter);
                String kursleitung = getStringValue(row.getCell(1), evaluator, formatter);
                String wochentag = getStringValue(row.getCell(2), evaluator, formatter);
                String uhrzeit = getStringValue(row.getCell(3), evaluator, formatter);
                String buchungsart = getStringValue(row.getCell(4), evaluator, formatter);
                Double kursgebuehr = getDoubleValue(row.getCell(5), evaluator, formatter);

                if (name == null || name.isBlank()) {
                    continue;
                }

                if (wochentag == null || wochentag.isBlank()) {
                    continue;
                }

                Kurs kurs = new Kurs();

                kurs.setName(name);
                kurs.setKursleitung(kursleitung);
                kurs.setWochentag(wochentag);
                kurs.setUhrzeit(uhrzeit);
                kurs.setBuchungsart(buchungsart);
                kurs.setKursgebuehr(kursgebuehr);

                kursRepository.save(kurs);
            }

        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Kurs-Import", e);
        }
    }

    private String getStringValue(
            Cell cell,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {
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
            return null;
        }
    }

    private Integer getIntegerValue(
            Cell cell,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {
        String value = getStringValue(cell, evaluator, formatter);

        if (value == null) {
            return null;
        }

        try {
            return Integer.parseInt(value.replace(".0", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Double getDoubleValue(
            Cell cell,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {
        String value = getStringValue(cell, evaluator, formatter);

        if (value == null) {
            return null;
        }

        try {
            value = value
                    .replace("€", "")
                    .replace(",", ".")
                    .trim();

            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean getBooleanValue(
            Cell cell,
            FormulaEvaluator evaluator,
            DataFormatter formatter
    ) {
        String value = getStringValue(cell, evaluator, formatter);

        if (value == null) {
            return false;
        }

        value = value.trim().toLowerCase();

        return value.equals("ja")
                || value.equals("x")
                || value.equals("true")
                || value.equals("1");
    }
}