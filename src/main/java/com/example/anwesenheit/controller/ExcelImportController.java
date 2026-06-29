package com.example.anwesenheit.controller;

import com.example.anwesenheit.service.ExcelImportService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "http://localhost:5173")
public class ExcelImportController {

    private final ExcelImportService excelImportService;

    public ExcelImportController(ExcelImportService excelImportService) {
        this.excelImportService = excelImportService;
    }

    @PostMapping("/students")
    public void importStudents(
            @RequestParam("file") MultipartFile file
    ) {
        excelImportService.importStudents(file);
    }

    @PostMapping("/kurse")
    public void importKurse(
            @RequestParam("file") MultipartFile file
    ) {
        excelImportService.importKurse(file);
    }
}