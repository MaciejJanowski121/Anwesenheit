package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.service.KursService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kurse")
public class KursController {

    private final KursService kursService;

    public KursController(KursService kursService) {
        this.kursService = kursService;
    }

    @GetMapping
    public List<Kurs> getAllKurse() {
        return kursService.getAllKurse();
    }

    @PostMapping
    public Kurs createKurs(@RequestBody Kurs kurs) {
        return kursService.createKurs(kurs);
    }

    @PutMapping("/{id}")
    public Kurs updateKurs(@PathVariable Long id, @RequestBody Kurs kurs) {
        return kursService.updateKurs(id, kurs);
    }

    @DeleteMapping("/{id}")
    public void deleteKurs(@PathVariable Long id) {
        kursService.deleteKurs(id);
    }
}