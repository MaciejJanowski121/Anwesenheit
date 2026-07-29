package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class ZuschussEinstellung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String schuljahr;

    private Double kurzgruppeBetrag;

    private Double langgruppe12Betrag;

    private Double langgruppe14Betrag;

    private Double langgruppe510Betrag;
}