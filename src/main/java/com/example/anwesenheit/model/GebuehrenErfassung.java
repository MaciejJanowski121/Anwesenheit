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
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"student_id", "schuljahr", "halbjahr"}
        )
)
public class GebuehrenErfassung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    private String schuljahr;

    private Integer halbjahr;

    private Boolean erfasst;

    /*
     * Manuelle Gebührenkorrektur.
     *
     * Positive Werte erhöhen die Gesamtgebühr.
     * Negative Werte reduzieren die Gesamtgebühr.
     *
     * Beispiel:
     * Kursgebühren: 300,00 €
     * Korrektur:    -50,00 €
     * Ergebnis:     250,00 €
     *
     * BigDecimal verhindert Rundungsfehler
     * bei Geldbeträgen.
     */
    @Column(
            name = "gebuehrenkorrektur",
            precision = 12,
            scale = 2
    )
    private BigDecimal gebuehrenkorrektur = BigDecimal.ZERO;
}