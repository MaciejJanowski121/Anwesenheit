package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "angebot_anwesenheit",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_angebot_anwesenheit_student_datum",
                columnNames = {"angebot_id", "student_id", "datum"}
        )
)
public class AngebotAnwesenheit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate datum;

    @Column(nullable = false)
    private String status;

    private String bemerkung;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(optional = false)
    @JoinColumn(name = "angebot_id", nullable = false)
    private Angebot angebot;
}