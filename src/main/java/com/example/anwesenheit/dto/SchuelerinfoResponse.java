package com.example.anwesenheit.dto;

public record SchuelerinfoResponse(
        Long id,
        String nachname,
        String vorname,
        Integer jahrgang,
        String klasse,
        String fotoFreigabe,
        String email1,
        String telefon1,
        String mobil1,
        String email2,
        String telefon2,
        String mobil2,
        Boolean gehtUm1530
) {
}