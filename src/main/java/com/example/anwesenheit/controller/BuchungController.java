package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.service.BuchungService;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/buchungen")
public class BuchungController {

    private final BuchungService buchungService;

    public BuchungController(
            BuchungService buchungService
    ) {
        this.buchungService =
                buchungService;
    }

    @PostMapping("/student/{studentId}/kurs/{kursId}")
    public Buchung createBuchung(
            @PathVariable Long studentId,
            @PathVariable Long kursId
    ) {
        return buchungService
                .createBuchung(
                        studentId,
                        kursId
                );
    }

    @GetMapping("/student/{studentId}")
    public List<Buchung> getBuchungenByStudentId(
            @PathVariable Long studentId
    ) {
        return buchungService
                .getBuchungenByStudentId(
                        studentId
                );
    }

    @GetMapping("/kurs/{kursId}")
    public List<Buchung> getBuchungenByKursId(
            @PathVariable Long kursId
    ) {
        return buchungService
                .getBuchungenByKursId(
                        kursId
                );
    }

    /*
     * Fügt alle Schüler eines Jahrgangs
     * einem Kurs hinzu.
     *
     * Beispiel:
     *
     * POST
     * /api/buchungen/kurs/12/jahrgang/7
     */
    @PostMapping(
            "/kurs/{kursId}/jahrgang/{jahrgang}"
    )
    public Map<String, Integer> addJahrgangToKurs(
            @PathVariable Long kursId,
            @PathVariable Integer jahrgang
    ) {

        int hinzugefuegt =
                buchungService
                        .addJahrgangToKurs(
                                kursId,
                                jahrgang
                        );

        return Map.of(
                "hinzugefuegt",
                hinzugefuegt
        );
    }

    @DeleteMapping("/{id}")
    public void deleteBuchung(
            @PathVariable Long id
    ) {
        buchungService
                .deleteBuchung(id);
    }
}