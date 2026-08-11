package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.Anwesenheit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

import java.util.List;

import java.util.Optional;

public interface AnwesenheitRepository

        extends JpaRepository<Anwesenheit, Long> {

    List<Anwesenheit> findByStudentId(Long studentId);

    List<Anwesenheit> findByKursId(Long kursId);

    Optional<Anwesenheit> findByStudentIdAndKursIdAndDatum(

            Long studentId,

            Long kursId,

            LocalDate datum

    );

    long countByStudentIdAndStatusIgnoreCase(

            Long studentId,

            String status

    );

    /*

     * Liefert alle Anwesenheiten innerhalb eines Zeitraums.

     */

    List<Anwesenheit> findByDatumBetweenOrderByDatumAsc(

            LocalDate von,

            LocalDate bis

    );

    /*

     * Liefert alle Anwesenheiten eines Kurses

     * innerhalb eines Zeitraums.

     */

    List<Anwesenheit> findByKursIdAndDatumBetweenOrderByDatumAsc(

            Long kursId,

            LocalDate von,

            LocalDate bis

    );

}