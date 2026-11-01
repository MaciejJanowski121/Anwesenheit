package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.AngebotTeilnahme;
import com.example.anwesenheit.service.AngebotTeilnahmeService;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/angebot-teilnahmen")
public class AngebotTeilnahmeController {

    private final AngebotTeilnahmeService teilnahmeService;

    public AngebotTeilnahmeController(
            AngebotTeilnahmeService teilnahmeService
    ) {
        this.teilnahmeService = teilnahmeService;
    }

    /* =====================================================
       EINZELNEN SCHÜLER HINZUFÜGEN
       ===================================================== */

    @PostMapping("/student/{studentId}/angebot/{angebotId}")
    public AngebotTeilnahme createTeilnahme(
            @PathVariable Long studentId,
            @PathVariable Long angebotId
    ) {

        return teilnahmeService.createTeilnahme(
                studentId,
                angebotId
        );
    }

    /* =====================================================
       MEHRERE SCHÜLER HINZUFÜGEN
       ===================================================== */

    @PostMapping("/angebot/{angebotId}/students")
    public Map<String, Integer> addStudentsToAngebot(
            @PathVariable Long angebotId,
            @RequestBody List<Long> studentIds
    ) {

        int hinzugefuegt = teilnahmeService
                .addStudentsToAngebot(
                        angebotId,
                        studentIds
                );

        return Map.of(
                "hinzugefuegt",
                hinzugefuegt
        );
    }

    /* =====================================================
       GANZEN JAHRGANG HINZUFÜGEN
       ===================================================== */

    @PostMapping("/angebot/{angebotId}/jahrgang/{jahrgang}")
    public Map<String, Integer> addJahrgangToAngebot(
            @PathVariable Long angebotId,
            @PathVariable Integer jahrgang
    ) {

        int hinzugefuegt = teilnahmeService
                .addJahrgangToAngebot(
                        angebotId,
                        jahrgang
                );

        return Map.of(
                "hinzugefuegt",
                hinzugefuegt
        );
    }

    /* =====================================================
       TEILNEHMER EINES ANGEBOTS
       ===================================================== */

    @GetMapping("/angebot/{angebotId}")
    public List<AngebotTeilnahme> getTeilnahmenByAngebot(
            @PathVariable Long angebotId
    ) {

        return teilnahmeService
                .getTeilnahmenByAngebot(angebotId);
    }

    /* =====================================================
       ANGEBOTE EINES SCHÜLERS
       ===================================================== */

    @GetMapping("/student/{studentId}")
    public List<AngebotTeilnahme> getTeilnahmenByStudent(
            @PathVariable Long studentId
    ) {

        return teilnahmeService
                .getTeilnahmenByStudent(studentId);
    }

    /* =====================================================
       TEILNEHMERZAHL
       ===================================================== */

    @GetMapping("/angebot/{angebotId}/statistik")
    public Map<String, Long> getTeilnehmerStatistik(
            @PathVariable Long angebotId
    ) {

        return teilnahmeService
                .getTeilnehmerStatistik(angebotId);
    }

    /* =====================================================
       BESONDERHEITEN AKTUALISIEREN
       ===================================================== */

    @PatchMapping("/{id}/besonderheiten")
    public AngebotTeilnahme updateBesonderheiten(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {

        return teilnahmeService.updateBesonderheiten(
                id,
                body.get("besonderheiten")
        );
    }

    /* =====================================================
       TEILNAHME LÖSCHEN
       ===================================================== */

    @DeleteMapping("/{id}")
    public void deleteTeilnahme(
            @PathVariable Long id
    ) {

        teilnahmeService.deleteTeilnahme(id);
    }
}