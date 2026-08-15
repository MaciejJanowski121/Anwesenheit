package com.example.anwesenheit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class Student {

    @JsonIgnore
    @OneToMany(mappedBy = "student")
    private List<Buchung> buchungen;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Eindeutige fachliche ID aus der Importdatei.
     *
     * Diese ID kommt von Matthias bzw. aus dem
     * Verwaltungssystem und bleibt unabhängig von
     * unserer internen Datenbank-ID bestehen.
     *
     * Sie wird später z. B. für Exporte verwendet.
     */
    @Column(name = "id_kind", unique = true)
    private Long idKind;

    private String vorname;

    private String nachname;

    private Integer jahrgang;

    private String klasse;

    private String fotoFreigabe;

    private String email1;

    private String telefon1;

    private String mobil1;

    private String email2;

    private String telefon2;

    private String mobil2;

    private Boolean gehtUm1530 = false;
}