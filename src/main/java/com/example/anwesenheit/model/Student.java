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
     */
    @Column(name = "id_kind", unique = true)
    private Long idKind;

    private String vorname;

    private String nachname;

    private Integer jahrgang;

    /*
     * Bisherige Klassenbezeichnung.
     *
     * Bleibt während der Migration bestehen,
     * damit bestehende Funktionen weiterhin
     * funktionieren.
     */
    private String klasse;

    /*
     * Neue relationale Zuordnung zur Klasse.
     *
     * Wird zunächst zusätzlich gespeichert.
     * Die Migration der bestehenden Schüler
     * erfolgt separat über SQL.
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "klasse_id")
    private Klasse klasseEntity;

    private String fotoFreigabe;

    private String email1;

    private String telefon1;

    private String mobil1;

    private String email2;

    private String telefon2;

    private String mobil2;

    private Boolean gehtUm1530 = false;
}