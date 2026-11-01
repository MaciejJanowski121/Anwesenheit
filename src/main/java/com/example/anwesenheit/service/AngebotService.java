package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Angebot;
import com.example.anwesenheit.repository.AngebotRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AngebotService {

    private final AngebotRepository angebotRepository;

    public AngebotService(
            AngebotRepository angebotRepository
    ) {
        this.angebotRepository = angebotRepository;
    }

    /* =====================================================
       ALLE ANGEBOTE
       ===================================================== */

    public List<Angebot> getAllAngebote() {
        return angebotRepository.findAll();
    }

    /* =====================================================
       EIN ANGEBOT
       ===================================================== */

    public Angebot getAngebotById(
            Long id
    ) {
        return angebotRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Angebot nicht gefunden"
                        )
                );
    }

    /* =====================================================
       ANGEBOT ERSTELLEN
       ===================================================== */

    @Transactional
    public Angebot createAngebot(
            Angebot angebot
    ) {

        if (angebot == null) {
            throw new IllegalArgumentException(
                    "Angebot darf nicht leer sein."
            );
        }

        validateAngebot(angebot);

        /*
         * Die ID wird automatisch generiert.
         */
        angebot.setId(null);

        return angebotRepository.save(angebot);
    }

    /* =====================================================
       ANGEBOT AKTUALISIEREN
       ===================================================== */

    @Transactional
    public Angebot updateAngebot(
            Long id,
            Angebot updatedAngebot
    ) {

        if (updatedAngebot == null) {
            throw new IllegalArgumentException(
                    "Angebot darf nicht leer sein."
            );
        }

        validateAngebot(updatedAngebot);

        Angebot angebot = getAngebotById(id);

        angebot.setName(
                updatedAngebot.getName()
        );

        angebot.setAngebotsart(
                updatedAngebot.getAngebotsart()
        );

        angebot.setAngebotsleitung(
                updatedAngebot.getAngebotsleitung()
        );

        angebot.setWochentag(
                updatedAngebot.getWochentag()
        );

        angebot.setBeginn(
                updatedAngebot.getBeginn()
        );

        angebot.setEnde(
                updatedAngebot.getEnde()
        );

        return angebotRepository.save(angebot);
    }

    /* =====================================================
       ANGEBOT LÖSCHEN
       ===================================================== */

    @Transactional
    public void deleteAngebot(
            Long id
    ) {

        Angebot angebot = getAngebotById(id);

        angebotRepository.delete(angebot);
    }

    /* =====================================================
       VALIDIERUNG
       ===================================================== */

    private void validateAngebot(
            Angebot angebot
    ) {

        if (
                angebot.getName() == null ||
                        angebot.getName().isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Der Angebotsname darf nicht leer sein."
            );
        }

        angebot.setName(
                angebot.getName().trim()
        );
    }
}