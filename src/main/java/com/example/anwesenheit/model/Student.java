package com.example.anwesenheit.model;
import com.fasterxml.jackson.annotation.JsonIgnore;

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

    @JsonIgnore
    @OneToMany(mappedBy = "student")
    private List<Buchung> buchungen;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String vorname;

    private String nachname;

    private Integer jahrgang;

    private String klasse;

    private Boolean fotoFreigabe;

    private String email1;

    private String telefon1;

    private String mobil1;

    private String email2;

    private String telefon2;

    private String mobil2;
}