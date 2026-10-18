package com.example.anwesenheit.model;

import java.math.BigDecimal;

public record GebuehrenBerechnung(
        Long studentId,
        String nachname,
        String vorname,
        int kursbuchungen,
        int musikbuchungen,
        BigDecimal buchungsfaktor,
        BigDecimal kursgebuehren,
        BigDecimal musikgebuehren,
        BigDecimal gebuehrenkorrektur,
        BigDecimal gesamtgebuehren
) {
}