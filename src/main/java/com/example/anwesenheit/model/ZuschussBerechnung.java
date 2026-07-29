package com.example.anwesenheit.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ZuschussBerechnung {

    private String schuljahr;

    private double kurzZaehlschueler;
    private int kurzgruppen;
    private double kurzgruppeBetrag;
    private double kurzgruppeGesamt;

    private double langZaehlschueler12;
    private int langgruppen12;
    private double langgruppe12Betrag;
    private double langgruppe12Gesamt;

    private double langZaehlschueler14;
    private int langgruppen14;
    private double langgruppe14Betrag;
    private double langgruppe14Gesamt;

    private double langZaehlschueler510;
    private int langgruppen510;
    private double langgruppe510Betrag;
    private double langgruppe510Gesamt;

    private double gesamtZuschuss;

    private List<StudentZuschuss> studenten;
}