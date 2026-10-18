package com.example.anwesenheit.service;

import com.example.anwesenheit.model.GebuehrenTarif;
import com.example.anwesenheit.repository.GebuehrenTarifRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class GebuehrenTarifService {

    private final GebuehrenTarifRepository repository;

    public GebuehrenTarifService(
            GebuehrenTarifRepository repository
    ) {
        this.repository = repository;
    }

    // Standardgebühren für neue Schuljahre.
    private static final BigDecimal[][] STANDARD_TARIFE = {
            {new BigDecimal("0.5"), new BigDecimal("75.00")},
            {new BigDecimal("1.0"), new BigDecimal("150.00")},
            {new BigDecimal("1.5"), new BigDecimal("187.50")},
            {new BigDecimal("2.0"), new BigDecimal("225.00")},
            {new BigDecimal("2.5"), new BigDecimal("262.50")},
            {new BigDecimal("3.0"), new BigDecimal("300.00")},
            {new BigDecimal("3.5"), new BigDecimal("337.50")},
            {new BigDecimal("4.0"), new BigDecimal("375.00")},
            {new BigDecimal("4.5"), new BigDecimal("412.50")},
            {new BigDecimal("5.0"), new BigDecimal("450.00")}
    };

    @Transactional
    public List<GebuehrenTarif> findBySchuljahr(String schuljahr) {
        pruefeSchuljahr(schuljahr);

        // Fehlende Standardwerte werden einmalig angelegt.
        for (BigDecimal[] tarif : STANDARD_TARIFE) {
            repository.findBySchuljahrAndBuchungsfaktor(
                    schuljahr,
                    tarif[0]
            ).orElseGet(() -> {
                GebuehrenTarif neu = new GebuehrenTarif();
                neu.setSchuljahr(schuljahr);
                neu.setBuchungsfaktor(tarif[0]);
                neu.setBetrag(tarif[1]);

                return repository.save(neu);
            });
        }

        return repository.findBySchuljahrOrderByBuchungsfaktorAsc(
                schuljahr
        );
    }

    @Transactional
    public GebuehrenTarif update(
            Long id,
            BigDecimal betrag
    ) {
        if (betrag == null || betrag.signum() < 0) {
            throw new IllegalArgumentException(
                    "Die Gebühr darf nicht negativ sein."
            );
        }

        GebuehrenTarif tarif = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Gebührentarif wurde nicht gefunden."
                ));

        tarif.setBetrag(betrag);

        return repository.save(tarif);
    }

    private void pruefeSchuljahr(String schuljahr) {
        if (schuljahr == null || schuljahr.isBlank()) {
            throw new IllegalArgumentException(
                    "Das Schuljahr darf nicht leer sein."
            );
        }
    }
}