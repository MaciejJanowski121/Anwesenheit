package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.model.Zahlung;
import com.example.anwesenheit.repository.BuchungRepository;
import com.example.anwesenheit.repository.ZahlungRepository;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.LocalDate;
import java.util.List;

@Service
public class ZahlungService {

    private final ZahlungRepository zahlungRepository;
    private final BuchungRepository buchungRepository;

    public ZahlungService(
            ZahlungRepository zahlungRepository,
            BuchungRepository buchungRepository
    ) {
        this.zahlungRepository = zahlungRepository;
        this.buchungRepository = buchungRepository;
    }

    public List<Zahlung> getZahlungenByStudent(Long studentId) {
        return zahlungRepository.findByBuchungStudentId(studentId);
    }

    public List<Zahlung> getZahlungenByBuchung(Long buchungId) {
        return zahlungRepository.findByBuchungId(buchungId);
    }

    public Zahlung createZahlung(Long buchungId, Zahlung zahlung) {
        Buchung buchung = buchungRepository.findById(buchungId)
                .orElseThrow(() -> new RuntimeException("Buchung nicht gefunden"));

        zahlung.setBuchung(buchung);

        if (zahlung.getZahlungsdatum() == null) {
            zahlung.setZahlungsdatum(LocalDate.now());
        }

        if (zahlung.getAbrechnungsmonat() == null) {
            zahlung.setAbrechnungsmonat(
                    YearMonth.from(zahlung.getZahlungsdatum())
            );
        }

        return zahlungRepository.save(zahlung);
    }

    public Zahlung bezahleKurs(Long buchungId, YearMonth abrechnungsmonat) {

        Buchung buchung = buchungRepository.findById(buchungId)
                .orElseThrow(() -> new RuntimeException("Buchung nicht gefunden"));

        if (zahlungRepository.findByBuchungIdAndAbrechnungsmonat(
                buchungId,
                abrechnungsmonat
        ).isPresent()) {

            throw new RuntimeException("Kurs wurde für diesen Monat bereits bezahlt.");
        }

        Zahlung zahlung = new Zahlung();

        zahlung.setBuchung(buchung);
        zahlung.setBetrag(buchung.getKurs().getKursgebuehr());
        zahlung.setZahlungsdatum(LocalDate.now());
        zahlung.setAbrechnungsmonat(abrechnungsmonat);

        return zahlungRepository.save(zahlung);
    }

    public void deleteZahlung(Long id) {
        zahlungRepository.deleteById(id);
    }
}