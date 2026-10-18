package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.GebuehrenTarif;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface GebuehrenTarifRepository
        extends JpaRepository<GebuehrenTarif, Long> {

    List<GebuehrenTarif> findBySchuljahrOrderByBuchungsfaktorAsc(
            String schuljahr
    );

    Optional<GebuehrenTarif> findBySchuljahrAndBuchungsfaktor(
            String schuljahr,
            BigDecimal buchungsfaktor
    );
}