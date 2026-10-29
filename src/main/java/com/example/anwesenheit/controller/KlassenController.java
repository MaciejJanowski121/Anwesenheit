package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.Klasse;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.service.KlasseService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/klassen")
public class KlassenController {

    private final KlasseService klasseService;

    public KlassenController(KlasseService klasseService) {
        this.klasseService = klasseService;
    }

    /* =====================================================
       ALLE KLASSEN
       ===================================================== */

    @GetMapping
    public List<Klasse> getAllKlassen() {

        return klasseService.getAllKlassen();
    }

    /* =====================================================
       KLASSE NACH ID
       ===================================================== */

    @GetMapping("/{id}")
    public Klasse getKlasseById(
            @PathVariable Long id
    ) {

        return klasseService.getKlasseById(id);
    }

    /* =====================================================
       KLASSE ERSTELLEN
       ===================================================== */

    @PostMapping
    public Klasse createKlasse(
            @RequestBody Klasse klasse
    ) {

        return klasseService.createKlasse(klasse);
    }

    /* =====================================================
       KLASSE AKTUALISIEREN
       ===================================================== */

    @PutMapping("/{id}")
    public Klasse updateKlasse(
            @PathVariable Long id,
            @RequestBody Klasse klasse
    ) {

        return klasseService.updateKlasse(id, klasse);
    }

    /* =====================================================
       KLASSE LÖSCHEN
       ===================================================== */

    @DeleteMapping("/{id}")
    public void deleteKlasse(
            @PathVariable Long id
    ) {

        klasseService.deleteKlasse(id);
    }

    /* =====================================================
       SCHÜLER EINER KLASSE
       ===================================================== */

    @GetMapping("/{id}/schueler")
    public List<Student> getSchuelerByKlasse(
            @PathVariable Long id
    ) {

        return klasseService.getSchuelerByKlasse(id);
    }

    /* =====================================================
   SCHÜLER HINZUFÜGEN
   ===================================================== */

    @PostMapping("/{id}/schueler")
    public java.util.Map<String, Integer> addStudents(
            @PathVariable Long id,
            @RequestBody List<Long> studentIds
    ) {

        int hinzugefuegt = klasseService.addStudentsToKlasse(
                id,
                studentIds
        );

        return java.util.Map.of(
                "hinzugefuegt",
                hinzugefuegt
        );
    }

/* =====================================================
   SCHÜLER ENTFERNEN
   ===================================================== */

    @DeleteMapping("/{id}/schueler/{studentId}")
    public void removeStudent(
            @PathVariable Long id,
            @PathVariable Long studentId
    ) {

        klasseService.removeStudentFromKlasse(
                id,
                studentId
        );
    }
}