package com.example.anwesenheit.service;

import com.example.anwesenheit.model.GebuehrenErfassung;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.GebuehrenErfassungRepository;
import com.example.anwesenheit.repository.StudentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class GebuehrenErfassungService {

    private final GebuehrenErfassungRepository gebuehrenErfassungRepository;
    private final StudentRepository studentRepository;

    public GebuehrenErfassungService(
            GebuehrenErfassungRepository gebuehrenErfassungRepository,
            StudentRepository studentRepository
    ) {
        this.gebuehrenErfassungRepository = gebuehrenErfassungRepository;
        this.studentRepository = studentRepository;
    }

    /*
     * Odczytuje status Gebühren.
     *
     * Jeśli wpis nie istnieje, zwraca domyślny obiekt,
     * ale NIE zapisuje go do bazy danych.
     */
    @Transactional(readOnly = true)
    public GebuehrenErfassung getStatus(
            Long studentId,
            String schuljahr,
            Integer halbjahr
    ) {
        pruefeZeitraum(schuljahr, halbjahr);

        return gebuehrenErfassungRepository
                .findByStudentIdAndSchuljahrAndHalbjahr(
                        studentId,
                        schuljahr,
                        halbjahr
                )
                .orElseGet(() ->
                        erstelleNeueErfassung(
                                studentId,
                                schuljahr,
                                halbjahr
                        )
                );
    }

    /*
     * Zmienia status Erfasst / Nicht erfasst.
     *
     * Jeśli wpis nie istnieje, tworzy go przy zapisie.
     */
    @Transactional
    public GebuehrenErfassung toggleErfasst(
            Long studentId,
            String schuljahr,
            Integer halbjahr
    ) {
        GebuehrenErfassung erfassung =
                getStatus(studentId, schuljahr, halbjahr);

        erfassung.setErfasst(
                !Boolean.TRUE.equals(erfassung.getErfasst())
        );

        return gebuehrenErfassungRepository.save(erfassung);
    }

    /*
     * Speichert eine manuelle Gebührenkorrektur.
     *
     * Positive Beträge erhöhen die Gebühr.
     * Negative Beträge reduzieren die Gebühr.
     */
    @Transactional
    public GebuehrenErfassung updateKorrektur(
            Long studentId,
            String schuljahr,
            Integer halbjahr,
            BigDecimal betrag
    ) {
        if (betrag == null) {
            throw new IllegalArgumentException(
                    "Der Korrekturbetrag darf nicht leer sein."
            );
        }

        if (betrag.scale() > 2) {
            throw new IllegalArgumentException(
                    "Der Korrekturbetrag darf maximal zwei Nachkommastellen haben."
            );
        }

        GebuehrenErfassung erfassung =
                getStatus(studentId, schuljahr, halbjahr);

        erfassung.setGebuehrenkorrektur(betrag);

        return gebuehrenErfassungRepository.save(erfassung);
    }

    /*
     * Tworzy nowy obiekt GebührenErfassung.
     *
     * UWAGA: Nie zapisuje go do bazy danych.
     */
    private GebuehrenErfassung erstelleNeueErfassung(
            Long studentId,
            String schuljahr,
            Integer halbjahr
    ) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Schüler nicht gefunden."
                        )
                );

        GebuehrenErfassung erfassung =
                new GebuehrenErfassung();

        erfassung.setStudent(student);
        erfassung.setSchuljahr(schuljahr);
        erfassung.setHalbjahr(halbjahr);
        erfassung.setErfasst(false);
        erfassung.setGebuehrenkorrektur(BigDecimal.ZERO);

        return erfassung;
    }

    /*
     * Sprawdza poprawność roku szkolnego i półrocza.
     */
    private void pruefeZeitraum(
            String schuljahr,
            Integer halbjahr
    ) {
        if (schuljahr == null || schuljahr.isBlank()) {
            throw new IllegalArgumentException(
                    "Das Schuljahr darf nicht leer sein."
            );
        }

        if (halbjahr == null || (halbjahr != 1 && halbjahr != 2)) {
            throw new IllegalArgumentException(
                    "Das Halbjahr muss 1 oder 2 sein."
            );
        }
    }
}