package com.example.anwesenheit.repository;


import com.example.anwesenheit.model.Zahlung;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

public interface ZahlungRepository extends JpaRepository<Zahlung, Long> {

    List<Zahlung> findByBuchungId(Long buchungId);

    List<Zahlung> findByBuchungStudentId(Long studentId);

    Optional<Zahlung> findByBuchungIdAndAbrechnungsmonat(

            Long buchungId,

            YearMonth abrechnungsmonat

    );
}