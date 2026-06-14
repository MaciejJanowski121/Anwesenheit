package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;


@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class Student {

    @OneToMany(mappedBy = "student")
    private List<Buchung> buchungen;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Integer jahrgang;

    private String klasse;

    private String klassenkuerzel;

    private String email1;

    private String email2;

    private Boolean mittagessen;

    private Boolean gehtUm1530;

    private String rueckmeldung;

    private String anaBuchung;


}