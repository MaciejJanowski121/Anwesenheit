package com.example.anwesenheit.dto;

public record GruppenAnwesenheitStatistikResponse(

        Long studentId,

        long anzahlAnwesend,

        long anzahlFehlend,

        long anzahlTeilweiseAbwesend

) {}