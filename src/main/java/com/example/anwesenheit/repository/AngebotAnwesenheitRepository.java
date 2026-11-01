package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.AngebotAnwesenheit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AngebotAnwesenheitRepository
        extends JpaRepository<AngebotAnwesenheit, Long> {

    List<AngebotAnwesenheit> findByStudentId(
            Long studentId
    );

    List<AngebotAnwesenheit> findByAngebotId(
            Long angebotId
    );

    Optional<AngebotAnwesenheit>
    findByStudentIdAndAngebotIdAndDatum(
            Long studentId,
            Long angebotId,
            LocalDate datum
    );

    List<AngebotAnwesenheit>
    findByDatumBetweenOrderByDatumAsc(
            LocalDate von,
            LocalDate bis
    );

    List<AngebotAnwesenheit>
    findByAngebotIdAndDatumBetweenOrderByDatumAsc(
            Long angebotId,
            LocalDate von,
            LocalDate bis
    );

    long countByAngebotIdAndStatusIgnoreCase(
            Long angebotId,
            String status
    );

    long countByStudentIdAndStatusIgnoreCase(
            Long studentId,
            String status
    );
}