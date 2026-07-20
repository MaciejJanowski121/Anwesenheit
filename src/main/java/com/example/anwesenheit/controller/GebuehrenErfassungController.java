package com.example.anwesenheit.controller;



import com.example.anwesenheit.model.GebuehrenErfassung;
import com.example.anwesenheit.service.GebuehrenErfassungService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gebuehren")
@CrossOrigin(origins = "http://localhost:5173")
public class GebuehrenErfassungController {

    private final GebuehrenErfassungService gebuehrenErfassungService;

    public GebuehrenErfassungController(
            GebuehrenErfassungService gebuehrenErfassungService
    ) {
        this.gebuehrenErfassungService = gebuehrenErfassungService;
    }

    @GetMapping("/{studentId}")
    public GebuehrenErfassung getStatus(
            @PathVariable Long studentId,
            @RequestParam String schuljahr,
            @RequestParam Integer halbjahr
    ) {
        return gebuehrenErfassungService.getStatus(
                studentId,
                schuljahr,
                halbjahr
        );
    }

    @PutMapping("/{studentId}")
    public GebuehrenErfassung toggleErfasst(
            @PathVariable Long studentId,
            @RequestParam String schuljahr,
            @RequestParam Integer halbjahr
    ) {
        return gebuehrenErfassungService.toggleErfasst(
                studentId,
                schuljahr,
                halbjahr
        );
    }
}