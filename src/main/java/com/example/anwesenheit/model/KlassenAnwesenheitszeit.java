package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(
        name = "klassen_anwesenheitszeiten",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_klasse_jahrgang_wochentag",
                columnNames = {
                        "klasse_id",
                        "jahrgang",
                        "wochentag"
                }
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KlassenAnwesenheitszeit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "klasse_id", nullable = false)
    private Klasse klasse;

    @Column(nullable = false)
    private Integer jahrgang;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private DayOfWeek wochentag;

    private LocalTime beginn;

    private LocalTime ende;
}