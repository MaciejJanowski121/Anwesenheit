package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Buchung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "kurs_id")
    private Kurs kurs;

    private LocalDate buchungsdatum;

    /*
     * Zusätzlicher Hinweis für diese konkrete Kursbuchung.
     *
     * Beispiele:
     * - "Geht um 13:30 Uhr"
     * - "Kommt ca. 20 Min. später"
     * - "Wird von Oma abgeholt"
     *
     * Der Hinweis wird später auch bei der
     * Anwesenheitserfassung angezeigt.
     */
    @Column(length = 50)
    private String besonderheiten;
}