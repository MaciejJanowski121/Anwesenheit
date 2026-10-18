package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.model.GebuehrenBerechnung;
import com.example.anwesenheit.model.GebuehrenErfassung;
import com.example.anwesenheit.model.GebuehrenTarif;
import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.BuchungRepository;
import com.example.anwesenheit.repository.GebuehrenErfassungRepository;
import com.example.anwesenheit.repository.GebuehrenTarifRepository;
import com.example.anwesenheit.repository.StudentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
public class GebuehrenBerechnungService {

    private static final BigDecimal NULL_BETRAG = BigDecimal.ZERO;

    private final StudentRepository studentRepository;
    private final BuchungRepository buchungRepository;
    private final GebuehrenTarifRepository tarifRepository;
    private final GebuehrenTarifService tarifService;
    private final GebuehrenErfassungRepository erfassungRepository;

    public GebuehrenBerechnungService(
            StudentRepository studentRepository,
            BuchungRepository buchungRepository,
            GebuehrenTarifRepository tarifRepository,
            GebuehrenTarifService tarifService,
            GebuehrenErfassungRepository erfassungRepository
    ) {
        this.studentRepository = studentRepository;
        this.buchungRepository = buchungRepository;
        this.tarifRepository = tarifRepository;
        this.tarifService = tarifService;
        this.erfassungRepository = erfassungRepository;
    }

    /**
     * Berechnet die Gebühren für alle Schüler.
     */
    @Transactional
    public List<GebuehrenBerechnung> berechneAlle(
            String schuljahr,
            Integer halbjahr
    ) {
        pruefeZeitraum(schuljahr, halbjahr);

        // Stellt sicher, dass Standardtarife vorhanden sind.
        tarifService.findBySchuljahr(schuljahr);

        return studentRepository.findAll()
                .stream()
                .map(student -> berechneStudentIntern(
                        student,
                        schuljahr,
                        halbjahr
                ))
                .toList();
    }

    /**
     * Berechnet die Gebühren eines einzelnen Schülers.
     */
    @Transactional
    public GebuehrenBerechnung berechneStudent(
            Long studentId,
            String schuljahr,
            Integer halbjahr
    ) {
        pruefeZeitraum(schuljahr, halbjahr);

        tarifService.findBySchuljahr(schuljahr);

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Schüler mit ID " + studentId
                                + " wurde nicht gefunden."
                ));

        return berechneStudentIntern(
                student,
                schuljahr,
                halbjahr
        );
    }

    private GebuehrenBerechnung berechneStudentIntern(
            Student student,
            String schuljahr,
            Integer halbjahr
    ) {
        List<Buchung> buchungen =
                buchungRepository.findByStudentId(student.getId());

        int kursbuchungen = 0;
        int musikbuchungen = 0;

        BigDecimal buchungsfaktor = BigDecimal.ZERO;
        BigDecimal musikgebuehren = BigDecimal.ZERO;

        for (Buchung buchung : buchungen) {

            if (buchung == null || buchung.getKurs() == null) {
                continue;
            }

            Kurs kurs = buchung.getKurs();

            String buchungsart = kurs.getBuchungsart() == null
                    ? ""
                    : kurs.getBuchungsart()
                      .trim()
                      .toUpperCase(Locale.ROOT);

            switch (buchungsart) {

                case "OGS" -> {
                    kursbuchungen++;
                    buchungsfaktor = buchungsfaktor.add(
                            BigDecimal.ONE
                    );
                }

                case "OGSH" -> {
                    kursbuchungen++;
                    buchungsfaktor = buchungsfaktor.add(
                            new BigDecimal("0.5")
                    );
                }

                case "M" -> {
                    musikbuchungen++;

                    if (kurs.getKursgebuehr() != null) {
                        musikgebuehren = musikgebuehren.add(
                                BigDecimal.valueOf(
                                        kurs.getKursgebuehr()
                                )
                        );
                    }
                }

                default -> {
                    // KURZ, OGSF, P und andere Buchungsarten
                    // verursachen keine Kursgebühren.
                }
            }
        }

        BigDecimal kursgebuehren =
                berechneKursgebuehren(
                        schuljahr,
                        buchungsfaktor
                );

        BigDecimal korrektur = erfassungRepository
                .findByStudentIdAndSchuljahrAndHalbjahr(
                        student.getId(),
                        schuljahr,
                        halbjahr
                )
                .map(GebuehrenErfassung::getGebuehrenkorrektur)
                .orElse(NULL_BETRAG);

        if (korrektur == null) {
            korrektur = NULL_BETRAG;
        }

        BigDecimal gesamtgebuehren =
                kursgebuehren
                        .add(musikgebuehren)
                        .add(korrektur);

        return new GebuehrenBerechnung(
                student.getId(),
                student.getNachname(),
                student.getVorname(),
                kursbuchungen,
                musikbuchungen,
                buchungsfaktor,
                kursgebuehren,
                musikgebuehren,
                korrektur,
                gesamtgebuehren
        );
    }

    /**
     * Pobiera kwotę z tabeli zamiast mnożyć faktor przez 150.
     */
    private BigDecimal berechneKursgebuehren(
            String schuljahr,
            BigDecimal buchungsfaktor
    ) {
        if (buchungsfaktor.signum() == 0) {
            return BigDecimal.ZERO;
        }

        GebuehrenTarif tarif = tarifRepository
                .findBySchuljahrAndBuchungsfaktor(
                        schuljahr,
                        buchungsfaktor
                )
                .orElseThrow(() -> new IllegalArgumentException(
                        "Kein Gebührentarif für "
                                + buchungsfaktor
                                + " Kursbuchungen im Schuljahr "
                                + schuljahr
                                + " vorhanden."
                ));

        return tarif.getBetrag();
    }

    private void pruefeZeitraum(
            String schuljahr,
            Integer halbjahr
    ) {
        if (schuljahr == null || schuljahr.isBlank()) {
            throw new IllegalArgumentException(
                    "Das Schuljahr darf nicht leer sein."
            );
        }

        if (halbjahr == null || (halbjahr != 1 && halbjahr != 2)) {
            throw new IllegalArgumentException(
                    "Das Halbjahr muss 1 oder 2 sein."
            );
        }
    }
}