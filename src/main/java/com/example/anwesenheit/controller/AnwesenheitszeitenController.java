package com.example.anwesenheit.controller;

import com.example.anwesenheit.dto.AnwesenheitszeitenResponse;
import com.example.anwesenheit.model.AnwesenheitszeitenFilter;
import com.example.anwesenheit.service.AnwesenheitszeitenService;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/anwesenheitszeiten")
@RequiredArgsConstructor
public class AnwesenheitszeitenController {

    private final AnwesenheitszeitenService
            anwesenheitszeitenService;


    /* =====================================================
       ANWESENHEITSZEITEN BERECHNEN
       ===================================================== */

    @GetMapping
    public AnwesenheitszeitenResponse getAnwesenheitszeiten(

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate datum,

            @RequestParam(
                    defaultValue = "ALLE"
            )
            AnwesenheitszeitenFilter filterTyp,

            @RequestParam(
                    required = false
            )
            Long filterId

    ) {

        return anwesenheitszeitenService
                .berechneAnwesenheitszeiten(

                        datum,

                        filterTyp,

                        filterId
                );
    }
}