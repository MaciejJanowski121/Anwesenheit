package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "gebuehren_tarif",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"schuljahr", "buchungsfaktor"}
        )
)
public class GebuehrenTarif {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Schuljahr, für das der Tarif gilt.
    @Column(nullable = false)
    private String schuljahr;

    // Anzahl kostenpflichtiger Kursbuchungen, z. B. 0.5, 1.0, 1.5.
    @Column(
            nullable = false,
            precision = 3,
            scale = 1
    )
    private BigDecimal buchungsfaktor;

    // Gebühr pro Halbjahr.
    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal betrag;
}