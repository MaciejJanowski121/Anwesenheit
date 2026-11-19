package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "tages_anwesenheit",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_tages_anwesenheit_student_datum",
                columnNames = {
                        "student_id",
                        "datum"
                }
        ),
        indexes = {
                @Index(
                        name = "idx_tages_anwesenheit_datum",
                        columnList = "datum"
                )
        }
)
public class TagesAnwesenheit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Datum der Anwesenheit.
     */
    @Column(nullable = false)
    private LocalDate datum;

    /*
     * Mögliche Werte:
     *
     * ANWESEND
     * FEHLT
     *
     * null = noch nicht erfasst
     */
    @Column(length = 20)
    private String status;

    /*
     * Beginn einer Abwesenheit.
     */
    private LocalTime abwesendAb;

    /*
     * Ende einer Abwesenheit.
     */
    private LocalTime abwesendBis;

    /*
     * Grund der Abwesenheit.
     */
    @Column(length = 50)
    private String grundAbwesenheit;

    /*
     * Bestätigung der Anwesenheitskontrolle
     * durch die ANA-Leitung.
     *
     * Hat keinen Einfluss auf SOLL und IST.
     */
    @Column(nullable = false)
    private Boolean anaAnwesenheitskontrolle = false;

    /*
     * Zusätzliche Bemerkung.
     */
    @Column(columnDefinition = "TEXT")
    private String bemerkung;

    /*
     * Zugeordneter Schüler.
     *
     * Pro Schüler und Datum darf nur
     * ein Anwesenheitseintrag existieren.
     */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(
            name = "student_id",
            nullable = false
    )
    private Student student;
}