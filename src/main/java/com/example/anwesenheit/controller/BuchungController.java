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

    /* =====================================================
       EINZELNE BUCHUNG
       ===================================================== */

    @PostMapping(
            "/student/{studentId}/kurs/{kursId}"
    )
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

    /* =====================================================
       MEHRERE SCHÜLER HINZUFÜGEN
       ===================================================== */

    @PostMapping(
            "/kurs/{kursId}/students"
    )
    public Map<String, Integer> addStudentsToKurs(
            @PathVariable Long kursId,
            @RequestBody List<Long> studentIds
    ) {

        int hinzugefuegt =
                buchungService
                        .addStudentsToKurs(
                                kursId,
                                studentIds
                        );

        return Map.of(
                "hinzugefuegt",
                hinzugefuegt
        );
    }

    /* =====================================================
       BUCHUNGEN NACH SCHÜLER
       ===================================================== */

    @GetMapping(
            "/student/{studentId}"
    )
    public List<Buchung> getBuchungenByStudentId(
            @PathVariable Long studentId
    ) {

        return buchungService
                .getBuchungenByStudentId(
                        studentId
                );
    }

    /* =====================================================
       BUCHUNGEN NACH KURS
       ===================================================== */

    @GetMapping(
            "/kurs/{kursId}"
    )
    public List<Buchung> getBuchungenByKursId(
            @PathVariable Long kursId
    ) {

        return buchungService
                .getBuchungenByKursId(
                        kursId
                );
    }

    /* =====================================================
       JAHRGANG HINZUFÜGEN
       ===================================================== */

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

    /* =====================================================
       BUCHUNG LÖSCHEN
       ===================================================== */

    @DeleteMapping("/{id}")
    public void deleteBuchung(
            @PathVariable Long id
    ) {

        buchungService
                .deleteBuchung(
                        id
                );
    }
}