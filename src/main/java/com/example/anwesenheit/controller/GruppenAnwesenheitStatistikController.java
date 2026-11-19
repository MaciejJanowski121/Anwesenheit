package com.example.anwesenheit.controller;

import com.example.anwesenheit.dto.GruppenAnwesenheitStatistikResponse;

import com.example.anwesenheit.service.GruppenAnwesenheitStatistikService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gruppen-anwesenheit")
public class GruppenAnwesenheitStatistikController {

    private final GruppenAnwesenheitStatistikService service;


    /* =====================================================
       KONSTRUKTOR
       ===================================================== */

    public GruppenAnwesenheitStatistikController(

            GruppenAnwesenheitStatistikService service

    ) {

        this.service = service;
    }


    /* =====================================================
       ANA – ANWESENHEITSSTATISTIK
       ===================================================== */

    @GetMapping("/ana/{kursId}")
    public List<GruppenAnwesenheitStatistikResponse>
    getAnaStatistik(

            @PathVariable Long kursId

    ) {

        return service.getAnaStatistik(
                kursId
        );
    }


    /* =====================================================
       ANGEBOT – ANWESENHEITSSTATISTIK
       ===================================================== */

    @GetMapping("/angebot/{angebotId}")
    public List<GruppenAnwesenheitStatistikResponse>
    getAngebotStatistik(

            @PathVariable Long angebotId

    ) {

        return service.getAngebotStatistik(
                angebotId
        );
    }
}