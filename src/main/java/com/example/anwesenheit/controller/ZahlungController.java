package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.Zahlung;
import com.example.anwesenheit.service.ZahlungService;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/zahlungen")
@CrossOrigin(origins = "http://localhost:5173")
public class ZahlungController {

    private final ZahlungService zahlungService;

    public ZahlungController(ZahlungService zahlungService) {
        this.zahlungService = zahlungService;
    }

    @GetMapping("/student/{studentId}")
    public List<Zahlung> getZahlungenByStudent(
            @PathVariable Long studentId
    ) {
        return zahlungService.getZahlungenByStudent(studentId);
    }

    @GetMapping("/buchung/{buchungId}")
    public List<Zahlung> getZahlungenByBuchung(
            @PathVariable Long buchungId
    ) {
        return zahlungService.getZahlungenByBuchung(buchungId);
    }

    @PostMapping("/buchung/{buchungId}")
    public Zahlung createZahlung(
            @PathVariable Long buchungId,
            @RequestBody Zahlung zahlung
    ) {
        return zahlungService.createZahlung(buchungId, zahlung);
    }

    @DeleteMapping("/{id}")
    public void deleteZahlung(
            @PathVariable Long id
    ) {
        zahlungService.deleteZahlung(id);
    }

    @PostMapping("/bezahlen/{buchungId}")
    public Zahlung bezahleKurs(
            @PathVariable Long buchungId,
            @RequestParam YearMonth abrechnungsmonat
    ) {
        return zahlungService.bezahleKurs(
                buchungId,
                abrechnungsmonat
        );
    }
}