package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "angebot")
public class Angebot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Name des Angebots.
     */
    @Column(nullable = false)
    private String name;

    /*
     * Art des Angebots.
     */
    private String angebotsart;

    /*
     * Verantwortliche Person.
     */
    private String angebotsleitung;

    /*
     * Wochentag des Angebots.
     */
    private String wochentag;

    /*
     * Beginn und Ende.
     *
     * Gleiche Darstellung wie bei ANA,
     * beispielsweise "08:30".
     */
    private String beginn;

    private String ende;
}