package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.repository.KursRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KursService {

    private final KursRepository kursRepository;

    public KursService(
            KursRepository kursRepository
    ) {
        this.kursRepository =
                kursRepository;
    }

    public List<Kurs> getAllKurse() {
        return kursRepository.findAll();
    }

    public Kurs getKursById(
            Long id
    ) {
        return kursRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Kurs nicht gefunden"
                        )
                );
    }

    public Kurs createKurs(
            Kurs kurs
    ) {

        /*
         * AG ist ausschließlich eine zusätzliche
         * Schülereinteilung.
         *
         * Für AG dürfen keine Kurskosten
         * gespeichert werden.
         */
        if (istAG(
                kurs.getBuchungsart()
        )) {
            kurs.setKursgebuehr(null);
        }

        return kursRepository.save(kurs);
    }

    public Kurs updateKurs(
            Long id,
            Kurs updatedKurs
    ) {

        Kurs kurs =
                kursRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Kurs nicht gefunden"
                                )
                        );

        kurs.setName(
                updatedKurs.getName()
        );

        kurs.setWochentag(
                updatedKurs.getWochentag()
        );

        /*
         * Beginn des Kurses.
         */
        kurs.setUhrzeit(
                updatedKurs.getUhrzeit()
        );

        /*
         * Ende des Kurses.
         */
        kurs.setUhrzeitEnde(
                updatedKurs.getUhrzeitEnde()
        );

        kurs.setKursleitung(
                updatedKurs.getKursleitung()
        );

        kurs.setBuchungsart(
                updatedKurs.getBuchungsart()
        );

        /*
         * AG hat keine Kursgebühr.
         *
         * Auch wenn vom Frontend versehentlich
         * eine Gebühr gesendet wird, wird sie
         * nicht gespeichert.
         */
        if (istAG(
                updatedKurs.getBuchungsart()
        )) {

            kurs.setKursgebuehr(null);

        } else {

            kurs.setKursgebuehr(
                    updatedKurs.getKursgebuehr()
            );
        }

        return kursRepository.save(kurs);
    }

    public void deleteKurs(
            Long id
    ) {
        kursRepository.deleteById(id);
    }

    /**
     * Prüft, ob es sich um die
     * Buchungsart AG handelt.
     */
    private boolean istAG(
            String buchungsart
    ) {

        return buchungsart != null
                && "AG".equalsIgnoreCase(
                buchungsart.trim()
        );
    }
}