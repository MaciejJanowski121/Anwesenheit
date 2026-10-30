package com.example.anwesenheit.controller;

import com.example.anwesenheit.service.KlassenAnwesenheitszeitService;
import com.example.anwesenheit.service.KlassenAnwesenheitszeitService.ZeitDto;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/klassen/{klasseId}")
public class KlassenAnwesenheitszeitController {

    private final KlassenAnwesenheitszeitService service;

    public KlassenAnwesenheitszeitController(
            KlassenAnwesenheitszeitService service
    ) {
        this.service = service;
    }

    @GetMapping("/jahrgaenge")
    public List<Integer> getJahrgaenge(@PathVariable Long klasseId) {
        return service.getJahrgaenge(klasseId);
    }

    @GetMapping("/anwesenheitszeiten/{jahrgang}")
    public List<ZeitDto> getZeiten(
            @PathVariable Long klasseId,
            @PathVariable Integer jahrgang
    ) {
        return service.getZeiten(klasseId, jahrgang);
    }

    @PutMapping("/anwesenheitszeiten/{jahrgang}")
    public List<ZeitDto> saveZeiten(
            @PathVariable Long klasseId,
            @PathVariable Integer jahrgang,
            @RequestBody List<ZeitDto> zeiten
    ) {
        return service.saveZeiten(klasseId, jahrgang, zeiten);
    }
}