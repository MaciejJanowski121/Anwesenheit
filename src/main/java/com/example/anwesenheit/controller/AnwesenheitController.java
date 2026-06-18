package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.Anwesenheit;
import com.example.anwesenheit.service.AnwesenheitService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/anwesenheiten")
@CrossOrigin(origins = "http://localhost:5173")
public class AnwesenheitController {

    private final AnwesenheitService anwesenheitService;

    public AnwesenheitController(AnwesenheitService anwesenheitService) {
        this.anwesenheitService = anwesenheitService;
    }

    @GetMapping
    public List<Anwesenheit> getAllAnwesenheiten() {
        return anwesenheitService.getAllAnwesenheiten();
    }

    @GetMapping("/student/{studentId}")
    public List<Anwesenheit> getAnwesenheitenByStudent(
            @PathVariable Long studentId
    ) {
        return anwesenheitService.getAnwesenheitenByStudent(studentId);
    }

    @GetMapping("/kurs/{kursId}")
    public List<Anwesenheit> getAnwesenheitenByKurs(
            @PathVariable Long kursId
    ) {
        return anwesenheitService.getAnwesenheitenByKurs(kursId);
    }

    @PostMapping("/student/{studentId}/kurs/{kursId}")
    public Anwesenheit createAnwesenheit(
            @RequestBody Anwesenheit anwesenheit,
            @PathVariable Long studentId,
            @PathVariable Long kursId
    ) {
        return anwesenheitService.createAnwesenheit(
                anwesenheit,
                studentId,
                kursId
        );
    }

    @DeleteMapping("/{id}")
    public void deleteAnwesenheit(
            @PathVariable Long id
    ) {
        anwesenheitService.deleteAnwesenheit(id);
    }
}