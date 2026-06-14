package com.example.anwesenheit.controller;

import com.example.anwesenheit.service.ExcelImportService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/import")
public class ExcelImportController {

    private final ExcelImportService excelImportService;

    public ExcelImportController(ExcelImportService excelImportService) {
        this.excelImportService = excelImportService;
    }

    @PostMapping("/students")
    public String importStudents(
            @RequestParam("file") MultipartFile file) {

        excelImportService.importStudents(file);

        return "Import erfolgreich";
    }
}