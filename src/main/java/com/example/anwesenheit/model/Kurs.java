package com.example.anwesenheit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Kurs {

    @JsonIgnore
    @OneToMany(mappedBy = "kurs")
    private List<Buchung> buchungen;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String wochentag;

    /*
     * Beginn des Kurses.
     *
     * Das bestehende Feld "uhrzeit" bleibt erhalten,
     * damit bereits gespeicherte Kurszeiten nicht
     * verloren gehen.
     */
    private String uhrzeit;

    /*
     * Ende des Kurses.
     *
     * Dieses Feld wurde zusätzlich eingeführt.
     */
    private String uhrzeitEnde;

    private String kursleitung;

    private String buchungsart;

    private Double kursgebuehr;
}