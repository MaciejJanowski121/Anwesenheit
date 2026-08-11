package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.Anwesenheit;
import com.example.anwesenheit.service.AnwesenheitService;
import org.springframework.web.bind.annotation.*;
import com.example.anwesenheit.service.AnwesenheitExportService;

import org.springframework.format.annotation.DateTimeFormat;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/anwesenheiten")
@CrossOrigin(origins = "http://localhost:5173")
public class AnwesenheitController {

    private final AnwesenheitService anwesenheitService;
    private final AnwesenheitExportService anwesenheitExportService;

    public AnwesenheitController(
            AnwesenheitService anwesenheitService,
            AnwesenheitExportService anwesenheitExportService
    ) {
        this.anwesenheitService =
                anwesenheitService;

        this.anwesenheitExportService =
                anwesenheitExportService;
    }

    @GetMapping
    public List<Anwesenheit> getAllAnwesenheiten() {
        return anwesenheitService
                .getAllAnwesenheiten();
    }

    @GetMapping("/zeitraum")
    public List<Anwesenheit> getAnwesenheitenByZeitraum(
            @RequestParam LocalDate von,
            @RequestParam LocalDate bis
    ) {
        return anwesenheitService
                .getAnwesenheitenByZeitraum(
                        von,
                        bis
                );
    }

    @GetMapping("/student/{studentId}")
    public List<Anwesenheit> getAnwesenheitenByStudent(
            @PathVariable Long studentId
    ) {
        return anwesenheitService
                .getAnwesenheitenByStudent(
                        studentId
                );
    }

    @GetMapping("/student/{studentId}/statistik")
    public Map<String, Long> getStatistikByStudent(
            @PathVariable Long studentId
    ) {
        return anwesenheitService
                .getStatistikByStudent(
                        studentId
                );
    }

    @GetMapping("/kurs/{kursId}")
    public List<Anwesenheit> getAnwesenheitenByKurs(
            @PathVariable Long kursId
    ) {
        return anwesenheitService
                .getAnwesenheitenByKurs(
                        kursId
                );
    }

    @PostMapping("/student/{studentId}/kurs/{kursId}")
    public Anwesenheit createAnwesenheit(
            @RequestBody Anwesenheit anwesenheit,
            @PathVariable Long studentId,
            @PathVariable Long kursId
    ) {
        return anwesenheitService
                .createAnwesenheit(
                        anwesenheit,
                        studentId,
                        kursId
                );
    }

    @DeleteMapping("/{id}")
    public void deleteAnwesenheit(
            @PathVariable Long id
    ) {
        anwesenheitService
                .deleteAnwesenheit(id);
    }


    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAnwesenheiten(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate von,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate bis,

            @RequestParam(required = false)
            Long kursId
    ) throws IOException {

        if (von.isAfter(bis)) {
            return ResponseEntity
                    .badRequest()
                    .build();
        }

        byte[] excel =
                anwesenheitExportService
                        .exportAnwesenheiten(
                                von,
                                bis,
                                kursId
                        );

        String filename =
                "Anwesenheit_" +
                        von +
                        "_bis_" +
                        bis +
                        ".xlsx";

        return ResponseEntity
                .ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" +
                                filename +
                                "\""
                )
                .contentType(
                        MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        )
                )
                .body(excel);
    }
}