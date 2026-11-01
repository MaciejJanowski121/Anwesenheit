package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.AngebotTeilnahme;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AngebotTeilnahmeRepository
        extends JpaRepository<AngebotTeilnahme, Long> {

    /*
     * Alle Teilnehmer eines Angebots.
     */
    List<AngebotTeilnahme> findByAngebotId(
            Long angebotId
    );

    /*
     * Alle Angebote eines Schülers.
     */
    List<AngebotTeilnahme> findByStudentId(
            Long studentId
    );

    /*
     * Prüft, ob ein Schüler bereits
     * einem Angebot zugeordnet ist.
     */
    boolean existsByStudentIdAndAngebotId(
            Long studentId,
            Long angebotId
    );

    /*
     * Anzahl der Teilnehmer.
     */
    long countByAngebotId(
            Long angebotId
    );
}