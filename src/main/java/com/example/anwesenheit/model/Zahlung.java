package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.YearMonth;


@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class Zahlung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Buchung buchung;

    private Double betrag;

    private LocalDate zahlungsdatum;

    private YearMonth abrechnungsmonat;

    private String bemerkung;
}