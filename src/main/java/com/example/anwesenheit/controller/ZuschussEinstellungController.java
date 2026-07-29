package com.example.anwesenheit.controller;

import com.example.anwesenheit.model.ZuschussEinstellung;
import com.example.anwesenheit.service.ZuschussEinstellungService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zuschuss-einstellungen")
@CrossOrigin
public class ZuschussEinstellungController {

    private final ZuschussEinstellungService service;

    public ZuschussEinstellungController(
            ZuschussEinstellungService service
    ) {
        this.service = service;
    }

    @GetMapping
    public List<ZuschussEinstellung> getAll() {
        return service.findAll();
    }

    @GetMapping("/schuljahr")
    public ZuschussEinstellung getBySchuljahr(
            @RequestParam String schuljahr
    ) {
        return service.findBySchuljahr(schuljahr);
    }

    @PostMapping
    public ZuschussEinstellung create(
            @RequestBody ZuschussEinstellung einstellung
    ) {
        einstellung.setId(null);
        return service.save(einstellung);
    }

    @PutMapping("/{id}")
    public ZuschussEinstellung update(
            @PathVariable Long id,
            @RequestBody ZuschussEinstellung einstellung
    ) {
        return service.update(id, einstellung);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}