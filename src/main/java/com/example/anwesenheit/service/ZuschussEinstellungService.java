package com.example.anwesenheit.service;

import com.example.anwesenheit.model.ZuschussEinstellung;
import com.example.anwesenheit.repository.ZuschussEinstellungRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ZuschussEinstellungService {

    private final ZuschussEinstellungRepository repository;

    public ZuschussEinstellungService(
            ZuschussEinstellungRepository repository
    ) {
        this.repository = repository;
    }

    public List<ZuschussEinstellung> findAll() {
        return repository.findAll();
    }

    public ZuschussEinstellung findBySchuljahr(String schuljahr) {
        return repository.findBySchuljahr(schuljahr)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Keine Zuschusseinstellungen für das Schuljahr "
                                + schuljahr + " gefunden."
                ));
    }

    public ZuschussEinstellung save(
            ZuschussEinstellung einstellung
    ) {
        pruefeSchuljahr(einstellung.getSchuljahr());

        repository.findBySchuljahr(einstellung.getSchuljahr())
                .ifPresent(vorhanden -> {
                    throw new IllegalArgumentException(
                            "Für das Schuljahr "
                                    + einstellung.getSchuljahr()
                                    + " existieren bereits Zuschusseinstellungen."
                    );
                });

        return repository.save(einstellung);
    }

    public ZuschussEinstellung update(
            Long id,
            ZuschussEinstellung neueEinstellung
    ) {
        ZuschussEinstellung vorhanden = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Zuschusseinstellung mit ID "
                                + id + " wurde nicht gefunden."
                ));

        pruefeSchuljahr(neueEinstellung.getSchuljahr());

        repository.findBySchuljahr(neueEinstellung.getSchuljahr())
                .filter(einstellung ->
                        !einstellung.getId().equals(id)
                )
                .ifPresent(einstellung -> {
                    throw new IllegalArgumentException(
                            "Für das Schuljahr "
                                    + neueEinstellung.getSchuljahr()
                                    + " existieren bereits Zuschusseinstellungen."
                    );
                });

        vorhanden.setSchuljahr(neueEinstellung.getSchuljahr());
        vorhanden.setKurzgruppeBetrag(
                neueEinstellung.getKurzgruppeBetrag()
        );
        vorhanden.setLanggruppe12Betrag(
                neueEinstellung.getLanggruppe12Betrag()
        );
        vorhanden.setLanggruppe14Betrag(
                neueEinstellung.getLanggruppe14Betrag()
        );
        vorhanden.setLanggruppe510Betrag(
                neueEinstellung.getLanggruppe510Betrag()
        );

        return repository.save(vorhanden);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException(
                    "Zuschusseinstellung mit ID "
                            + id + " wurde nicht gefunden."
            );
        }

        repository.deleteById(id);
    }

    private void pruefeSchuljahr(String schuljahr) {
        if (schuljahr == null || schuljahr.isBlank()) {
            throw new IllegalArgumentException(
                    "Das Schuljahr darf nicht leer sein."
            );
        }
    }
}