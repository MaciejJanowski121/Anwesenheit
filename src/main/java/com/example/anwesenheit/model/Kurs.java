package com.example.anwesenheit.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Kurs {

    @JsonIgnore
    @OneToMany(mappedBy = "kurs")
    private List<Buchung> buchungen;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String wochentag;

    private String uhrzeit;

    private String beschreibung;
}