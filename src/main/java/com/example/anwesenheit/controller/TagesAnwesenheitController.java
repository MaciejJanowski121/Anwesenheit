package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.TagesAnwesenheit;
import com.example.anwesenheit.service.TagesAnwesenheitService;

import com.example.anwesenheit.service
        .TagesAnwesenheitService.AnwesenheitDto;

import com.example.anwesenheit.service
        .TagesAnwesenheitService.SammelAnwesenheitDto;

import com.example.anwesenheit.service
        .TagesAnwesenheitService.SammelAnwesenheitZeitraumDto;

import com.example.anwesenheit.service
        .TagesAnwesenheitService.SammelAnwesenheitZeitraumResponse;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tages-anwesenheiten")
public class TagesAnwesenheitController {

    private final TagesAnwesenheitService service;

    public TagesAnwesenheitController(
            TagesAnwesenheitService service
    ) {
        this.service = service;
    }

    /* =====================================================
       ANWESENHEITEN EINES TAGES
       ===================================================== */

    @GetMapping("/datum")
    public List<TagesAnwesenheit> getByDatum(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate datum
    ) {

        return service.getByDatum(datum);
    }

    /* =====================================================
       ANWESENHEITEN EINES SCHÜLERS
       ===================================================== */

    @GetMapping("/student/{studentId}")
    public List<TagesAnwesenheit> getByStudent(
            @PathVariable Long studentId
    ) {

        return service.getByStudent(studentId);
    }

    /* =====================================================
       ANWESENHEIT EINES SCHÜLERS AN EINEM TAG
       ===================================================== */

    @GetMapping("/student/{studentId}/datum")
    public TagesAnwesenheit getByStudentAndDatum(

            @PathVariable Long studentId,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate datum
    ) {

        return service.getByStudentAndDatum(
                studentId,
                datum
        );
    }

    /* =====================================================
       ANWESENHEITEN EINES ZEITRAUMS
       ===================================================== */

    @GetMapping("/zeitraum")
    public List<TagesAnwesenheit> getByZeitraum(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate von,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate bis
    ) {

        return service.getByZeitraum(
                von,
                bis
        );
    }

    /* =====================================================
       EINZELNE ANWESENHEIT SPEICHERN
       ===================================================== */

    @PostMapping("/student/{studentId}")
    public TagesAnwesenheit saveAnwesenheit(

            @PathVariable Long studentId,

            @RequestBody AnwesenheitDto dto
    ) {

        return service.saveAnwesenheit(
                studentId,
                dto
        );
    }

    /* =====================================================
       EINZELNE FELDER AKTUALISIEREN
       ===================================================== */

    @PatchMapping("/student/{studentId}")
    public TagesAnwesenheit updateAnwesenheit(

            @PathVariable Long studentId,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate datum,

            @RequestBody Map<String, Object> aenderungen
    ) {

        return service.updateAnwesenheit(
                studentId,
                datum,
                aenderungen
        );
    }

    /* =====================================================
       SAMMELAKTUALISIERUNG EINES TAGES
       ===================================================== */

    @PostMapping("/sammel")
    public List<TagesAnwesenheit> saveSammelAnwesenheit(

            @RequestBody SammelAnwesenheitDto dto
    ) {

        return service.saveSammelAnwesenheit(dto);
    }

    /* =====================================================
       SAMMELAKTUALISIERUNG EINES ZEITRAUMS
       ===================================================== */

    @PostMapping("/sammel/zeitraum")
    public SammelAnwesenheitZeitraumResponse
    saveSammelAnwesenheitZeitraum(

            @RequestBody SammelAnwesenheitZeitraumDto dto
    ) {

        return service.saveSammelAnwesenheitZeitraum(dto);
    }

    /* =====================================================
       SCHÜLERSTATISTIK
       ===================================================== */

    @GetMapping("/student/{studentId}/statistik")
    public Map<String, Long> getStatistik(
            @PathVariable Long studentId
    ) {

        return service.getStatistik(studentId);
    }

    /* =====================================================
       ANWESENHEIT LÖSCHEN
       ===================================================== */

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAnwesenheit(
            @PathVariable Long id
    ) {

        service.deleteAnwesenheit(id);
    }
}