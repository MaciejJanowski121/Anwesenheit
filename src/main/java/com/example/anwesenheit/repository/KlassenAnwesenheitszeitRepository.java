package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.KlassenAnwesenheitszeit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface KlassenAnwesenheitszeitRepository
        extends JpaRepository<KlassenAnwesenheitszeit, Long> {

    List<KlassenAnwesenheitszeit> findByKlasseIdAndJahrgangOrderByWochentagAsc(
            Long klasseId,
            Integer jahrgang
    );

    Optional<KlassenAnwesenheitszeit> findByKlasseIdAndJahrgangAndWochentag(
            Long klasseId,
            Integer jahrgang,
            DayOfWeek wochentag
    );

    List<KlassenAnwesenheitszeit> findByKlasseId(
            Long klasseId
    );

    void deleteByKlasseId(
            Long klasseId
    );
}