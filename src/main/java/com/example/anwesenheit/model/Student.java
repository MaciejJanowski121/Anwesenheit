package com.example.anwesenheit.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class Student {

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