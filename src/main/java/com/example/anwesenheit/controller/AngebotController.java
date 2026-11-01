package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.Angebot;
import com.example.anwesenheit.service.AngebotService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/angebote")
public class AngebotController {

    private final AngebotService angebotService;

    public AngebotController(
            AngebotService angebotService
    ) {
        this.angebotService = angebotService;
    }

    /* =====================================================
       ALLE ANGEBOTE
       ===================================================== */

    @GetMapping
    public List<Angebot> getAllAngebote() {
        return angebotService.getAllAngebote();
    }

    /* =====================================================
       EIN ANGEBOT
       ===================================================== */

    @GetMapping("/{id}")
    public Angebot getAngebotById(
            @PathVariable Long id
    ) {
        return angebotService.getAngebotById(id);
    }

    /* =====================================================
       ANGEBOT ERSTELLEN
       ===================================================== */

    @PostMapping
    public Angebot createAngebot(
            @RequestBody Angebot angebot
    ) {
        return angebotService.createAngebot(angebot);
    }

    /* =====================================================
       ANGEBOT AKTUALISIEREN
       ===================================================== */

    @PutMapping("/{id}")
    public Angebot updateAngebot(
            @PathVariable Long id,
            @RequestBody Angebot angebot
    ) {
        return angebotService.updateAngebot(
                id,
                angebot
        );
    }

    /* =====================================================
       ANGEBOT LÖSCHEN
       ===================================================== */

    @DeleteMapping("/{id}")
    public void deleteAngebot(
            @PathVariable Long id
    ) {
        angebotService.deleteAngebot(id);
    }
}