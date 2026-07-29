package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.StudentZuschuss;
import com.example.anwesenheit.model.ZuschussBerechnung;
import com.example.anwesenheit.service.ZuschussService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zuschuesse")
@CrossOrigin
public class ZuschussController {

    private final ZuschussService zuschussService;

    public ZuschussController(ZuschussService zuschussService) {
        this.zuschussService = zuschussService;
    }

    @GetMapping
    public ZuschussBerechnung berechneZuschuss(
            @RequestParam String schuljahr
    ) {
        return zuschussService.berechneZuschuss(schuljahr);
    }

    @GetMapping("/studenten")
    public List<StudentZuschuss> berechneAlleStudenten() {
        return zuschussService.berechneAlleStudenten();
    }

    @GetMapping("/studenten/{studentId}")
    public StudentZuschuss berechneStudent(
            @PathVariable Long studentId
    ) {
        return zuschussService.berechneStudent(studentId);
    }
}