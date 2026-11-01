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
@Table(
        name = "angebot_teilnahme",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_angebot_teilnahme_student",
                columnNames = {"angebot_id", "student_id"}
        )
)
public class AngebotTeilnahme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Zugeordneter Schüler.
     */
    @ManyToOne(optional = false)
    @JoinColumn(
            name = "student_id",
            nullable = false
    )
    private Student student;

    /*
     * Zugeordnetes Angebot.
     */
    @ManyToOne(optional = false)
    @JoinColumn(
            name = "angebot_id",
            nullable = false
    )
    private Angebot angebot;

    /*
     * Datum der Zuordnung.
     */
    private LocalDate buchungsdatum;

    /*
     * Zusätzlicher Hinweis zur Teilnahme.
     */
    @Column(length = 50)
    private String besonderheiten;
}