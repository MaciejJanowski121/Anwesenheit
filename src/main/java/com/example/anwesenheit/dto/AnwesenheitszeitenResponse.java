package com.example.anwesenheit.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record AnwesenheitszeitenResponse(

        LocalDate datum,

        String filterTyp,

        Long filterId,

        String filterName,

        int anzahlSchueler,

        int anzahlOhneUnterrichtszeiten,

        List<Zeitintervall> zeitintervalle,

        List<String> hinweise

) {

    /* =====================================================
       ZEITINTERVALL
       ===================================================== */

    public record Zeitintervall(

            LocalTime von,

            LocalTime bis,

            int plan,

            int soll,

            int ist,

            int ungeprueft

    ) {
    }
}