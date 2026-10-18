package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.GebuehrenBerechnung;
import com.example.anwesenheit.model.GebuehrenErfassung;
import com.example.anwesenheit.model.GebuehrenTarif;

import com.example.anwesenheit.service.GebuehrenBerechnungService;
import com.example.anwesenheit.service.GebuehrenErfassungService;
import com.example.anwesenheit.service.GebuehrenTarifService;

import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/gebuehren")
public class GebuehrenController {

    private final GebuehrenBerechnungService berechnungService;
    private final GebuehrenErfassungService erfassungService;
    private final GebuehrenTarifService tarifService;

    public GebuehrenController(
            GebuehrenBerechnungService berechnungService,
            GebuehrenErfassungService erfassungService,
            GebuehrenTarifService tarifService
    ) {
        this.berechnungService = berechnungService;
        this.erfassungService = erfassungService;
        this.tarifService = tarifService;
    }

    /*
     * Gebührenübersicht aller Schüler.
     */
    @GetMapping
    public List<GebuehrenBerechnung> getAlle(
            @RequestParam String schuljahr,
            @RequestParam Integer halbjahr
    ) {
        return berechnungService.berechneAlle(
                schuljahr,
                halbjahr
        );
    }

    /*
     * Gebührenberechnung eines einzelnen Schülers.
     */
    @GetMapping("/{studentId}/berechnung")
    public GebuehrenBerechnung getBerechnung(
            @PathVariable Long studentId,
            @RequestParam String schuljahr,
            @RequestParam Integer halbjahr
    ) {
        return berechnungService.berechneStudent(
                studentId,
                schuljahr,
                halbjahr
        );
    }

    /*
     * Gebührenstatus eines Schülers.
     * Bestehender Endpoint bleibt erhalten.
     */
    @GetMapping("/{studentId}")
    public GebuehrenErfassung getStatus(
            @PathVariable Long studentId,
            @RequestParam String schuljahr,
            @RequestParam Integer halbjahr
    ) {
        return erfassungService.getStatus(
                studentId,
                schuljahr,
                halbjahr
        );
    }

    /*
     * Erfasst / Nicht erfasst umschalten.
     * Bestehender Endpoint bleibt erhalten.
     */
    @PutMapping("/{studentId}")
    public GebuehrenErfassung toggleErfasst(
            @PathVariable Long studentId,
            @RequestParam String schuljahr,
            @RequestParam Integer halbjahr
    ) {
        return erfassungService.toggleErfasst(
                studentId,
                schuljahr,
                halbjahr
        );
    }

    /*
     * Gebührentabelle für ein Schuljahr.
     */
    @GetMapping("/tarife")
    public List<GebuehrenTarif> getTarife(
            @RequestParam String schuljahr
    ) {
        return tarifService.findBySchuljahr(schuljahr);
    }

    /*
     * Gebührentarif aktualisieren.
     */
    @PutMapping("/tarife/{id}")
    public GebuehrenTarif updateTarif(
            @PathVariable Long id,
            @RequestBody TarifUpdateRequest request
    ) {
        return tarifService.update(
                id,
                request.betrag()
        );
    }

    /*
     * Gebührenkorrektur speichern.
     */
    @PutMapping("/{studentId}/korrektur")
    public GebuehrenErfassung updateKorrektur(
            @PathVariable Long studentId,
            @RequestParam String schuljahr,
            @RequestParam Integer halbjahr,
            @RequestBody KorrekturRequest request
    ) {
        return erfassungService.updateKorrektur(
                studentId,
                schuljahr,
                halbjahr,
                request.betrag()
        );
    }

    public record TarifUpdateRequest(
            BigDecimal betrag
    ) {}

    public record KorrekturRequest(
            BigDecimal betrag
    ) {}
}