package com.example.anwesenheit.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentZuschuss {

    private Student student;

    private int anzahlKurzBuchungen;

    private int anzahlLangBuchungen;

    private int anzahlPBuchungen;

    private double kurzZaehler;

    private double langZaehler;

    private double kurzZaehlschueler;

    private double langZaehlschueler;
}