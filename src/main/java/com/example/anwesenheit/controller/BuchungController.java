package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.service.BuchungService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buchungen")
public class BuchungController {

    private final BuchungService buchungService;

    public BuchungController(BuchungService buchungService) {
        this.buchungService = buchungService;
    }

    @PostMapping("/student/{studentId}/kurs/{kursId}")
    public Buchung createBuchung(
            @PathVariable Long studentId,
            @PathVariable Long kursId
    ) {
        return buchungService.createBuchung(studentId, kursId);
    }

    @GetMapping("/student/{studentId}")
    public List<Buchung> getBuchungenByStudentId(
            @PathVariable Long studentId
    ) {
        return buchungService.getBuchungenByStudentId(studentId);
    }

    @DeleteMapping("/{id}")
    public void deleteBuchung(
            @PathVariable Long id
    ) {
        buchungService.deleteBuchung(id);
    }
}