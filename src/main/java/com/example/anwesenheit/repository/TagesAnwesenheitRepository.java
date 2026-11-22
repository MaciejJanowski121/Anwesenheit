package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.TagesAnwesenheit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TagesAnwesenheitRepository
        extends JpaRepository<TagesAnwesenheit, Long> {

    /*
     * Anwesenheit eines Schülers
     * an einem bestimmten Datum.
     */
    Optional<TagesAnwesenheit> findByStudentIdAndDatum(
            Long studentId,
            LocalDate datum
    );

    /*
     * Alle Anwesenheiten eines Tages.
     */
    List<TagesAnwesenheit> findByDatum(
            LocalDate datum
    );

    /*
     * Alle Anwesenheiten eines Schülers.
     */
    List<TagesAnwesenheit> findByStudentIdOrderByDatumDesc(
            Long studentId
    );

    /*
     * Alle Anwesenheiten eines Zeitraums.
     */
    List<TagesAnwesenheit> findByDatumBetweenOrderByDatumAsc(
            LocalDate von,
            LocalDate bis
    );

    /*
     * Anwesenheiten eines Schülers
     * innerhalb eines Zeitraums.
     */
    List<TagesAnwesenheit>
    findByStudentIdAndDatumBetweenOrderByDatumAsc(
            Long studentId,
            LocalDate von,
            LocalDate bis
    );

    /*
     * Anwesenheiten ausgewählter Schüler
     * an einem bestimmten Tag.
     */
    List<TagesAnwesenheit> findByDatumAndStudentIdIn(
            LocalDate datum,
            List<Long> studentIds
    );

    /*
     * Alle Anwesenheiten ausgewählter Schüler.
     *
     * Wird für die Anwesenheitsstatistiken
     * von ANA und Angeboten verwendet.
     */
    List<TagesAnwesenheit> findByStudentIdIn(
            List<Long> studentIds
    );

    /*
     * Anwesenheiten ausgewählter Schüler
     * innerhalb eines bestimmten Zeitraums.
     *
     * Wird für die Sammelerfassung
     * über mehrere Tage verwendet.
     */
    List<TagesAnwesenheit>
    findByStudentIdInAndDatumBetween(
            List<Long> studentIds,
            LocalDate von,
            LocalDate bis
    );

    /*
     * Statistik eines Schülers.
     */
    long countByStudentIdAndStatusIgnoreCase(
            Long studentId,
            String status
    );
}