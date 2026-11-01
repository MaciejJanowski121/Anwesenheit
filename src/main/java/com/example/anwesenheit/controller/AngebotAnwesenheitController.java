package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.AngebotAnwesenheit;
import com.example.anwesenheit.service.AngebotAnwesenheitService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/angebot-anwesenheiten")
public class AngebotAnwesenheitController {

    private final AngebotAnwesenheitService anwesenheitService;

    public AngebotAnwesenheitController(
            AngebotAnwesenheitService anwesenheitService
    ) {
        this.anwesenheitService = anwesenheitService;
    }

    /* =====================================================
       ALLE ANWESENHEITEN
       ===================================================== */

    @GetMapping
    public List<AngebotAnwesenheit> getAllAnwesenheiten() {
        return anwesenheitService.getAllAnwesenheiten();
    }

    /* =====================================================
       ANWESENHEIT ERSTELLEN / AKTUALISIEREN
       ===================================================== */

    @PostMapping("/student/{studentId}/angebot/{angebotId}")
    public AngebotAnwesenheit createAnwesenheit(
            @PathVariable Long studentId,
            @PathVariable Long angebotId,
            @RequestBody AngebotAnwesenheit anwesenheit
    ) {

        return anwesenheitService.createAnwesenheit(
                anwesenheit,
                studentId,
                angebotId
        );
    }

    /* =====================================================
       ANWESENHEITEN EINES ANGEBOTS
       ===================================================== */

    @GetMapping("/angebot/{angebotId}")
    public List<AngebotAnwesenheit> getAnwesenheitenByAngebot(
            @PathVariable Long angebotId
    ) {

        return anwesenheitService
                .getAnwesenheitenByAngebot(angebotId);
    }

    /* =====================================================
       ANWESENHEITEN EINES SCHÜLERS
       ===================================================== */

    @GetMapping("/student/{studentId}")
    public List<AngebotAnwesenheit> getAnwesenheitenByStudent(
            @PathVariable Long studentId
    ) {

        return anwesenheitService
                .getAnwesenheitenByStudent(studentId);
    }

    /* =====================================================
       ANWESENHEITEN IM ZEITRAUM
       ===================================================== */

    @GetMapping("/zeitraum")
    public List<AngebotAnwesenheit> getAnwesenheitenByZeitraum(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate von,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate bis
    ) {

        return anwesenheitService
                .getAnwesenheitenByZeitraum(von, bis);
    }

    /* =====================================================
       ANWESENHEITEN EINES ANGEBOTS IM ZEITRAUM
       ===================================================== */

    @GetMapping("/angebot/{angebotId}/zeitraum")
    public List<AngebotAnwesenheit> getAnwesenheitenByAngebotUndZeitraum(
            @PathVariable Long angebotId,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate von,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate bis
    ) {

        return anwesenheitService
                .getAnwesenheitenByAngebotUndZeitraum(
                        angebotId,
                        von,
                        bis
                );
    }

    /* =====================================================
       STATISTIK EINES ANGEBOTS
       ===================================================== */

    @GetMapping("/angebot/{angebotId}/statistik")
    public Map<String, Long> getStatistikByAngebot(
            @PathVariable Long angebotId
    ) {

        return anwesenheitService
                .getStatistikByAngebot(angebotId);
    }

    /* =====================================================
       STATISTIK EINES SCHÜLERS
       ===================================================== */

    @GetMapping("/student/{studentId}/statistik")
    public Map<String, Long> getStatistikByStudent(
            @PathVariable Long studentId
    ) {

        return anwesenheitService
                .getStatistikByStudent(studentId);
    }

    /* =====================================================
       ANWESENHEIT LÖSCHEN
       ===================================================== */

    @DeleteMapping("/{id}")
    public void deleteAnwesenheit(
            @PathVariable Long id
    ) {

        anwesenheitService.deleteAnwesenheit(id);
    }
}