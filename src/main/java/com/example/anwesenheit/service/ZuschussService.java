package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.model.StudentZuschuss;
import com.example.anwesenheit.repository.BuchungRepository;
import com.example.anwesenheit.repository.StudentRepository;
import org.springframework.stereotype.Service;
import com.example.anwesenheit.model.ZuschussBerechnung;
import com.example.anwesenheit.model.ZuschussEinstellung;
import com.example.anwesenheit.repository.ZuschussEinstellungRepository;

import java.util.List;

@Service
public class ZuschussService {

    private static final double KURZ_FAKTOR = 0.5;
    private static final double LANG_FAKTOR = 0.25;

    private final BuchungRepository buchungRepository;
    private final StudentRepository studentRepository;
    private final ZuschussEinstellungRepository zuschussEinstellungRepository;

    public ZuschussService(
            BuchungRepository buchungRepository,
            StudentRepository studentRepository,
            ZuschussEinstellungRepository zuschussEinstellungRepository
    ) {
        this.buchungRepository = buchungRepository;
        this.studentRepository = studentRepository;
        this.zuschussEinstellungRepository = zuschussEinstellungRepository;
    }

    /**
     * Berechnet die Zuschusswerte für einen einzelnen Schüler.
     */
    public StudentZuschuss berechneStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student mit ID " + studentId + " wurde nicht gefunden."
                        )
                );

        List<Buchung> buchungen =
                buchungRepository.findByStudentId(studentId);

        int anzahlKurzBuchungen = 0;
        int anzahlLangBuchungen = 0;
        int anzahlPBuchungen = 0;

        for (Buchung buchung : buchungen) {
            if (buchung == null
                    || buchung.getKurs() == null
                    || buchung.getKurs().getBuchungsart() == null) {
                continue;
            }

            String buchungsart = buchung.getKurs()
                    .getBuchungsart()
                    .trim();

            if (buchungsart.isBlank()) {
                continue;
            }

            if ("Kurz".equalsIgnoreCase(buchungsart)) {
                anzahlKurzBuchungen++;
            } else if (istNormaleLangBuchung(buchungsart)) {
                anzahlLangBuchungen++;
            } else if ("P".equalsIgnoreCase(buchungsart)) {
                anzahlPBuchungen++;
            }

            /*
             * M und Zuschussfrei erhöhen keinen Zuschuss-Zähler.
             */
        }

        double kurzZaehler =
                berechneKurzZaehler(anzahlKurzBuchungen);

        double langZaehler =
                berechneLangZaehler(
                        anzahlLangBuchungen,
                        anzahlPBuchungen
                );

        double kurzZaehlschueler =
                berechneKurzZaehlschueler(
                        student.getJahrgang(),
                        anzahlKurzBuchungen
                );

        double langZaehlschueler =
                berechneLangZaehlschueler(
                        student.getJahrgang(),
                        anzahlLangBuchungen,
                        anzahlPBuchungen,
                        langZaehler
                );

        return new StudentZuschuss(
                student,
                anzahlKurzBuchungen,
                anzahlLangBuchungen,
                anzahlPBuchungen,
                kurzZaehler,
                langZaehler,
                kurzZaehlschueler,
                langZaehlschueler
        );
    }

    /**
     * Berechnet die Zuschusswerte für alle Schüler.
     */
    public List<StudentZuschuss> berechneAlleStudenten() {
        return studentRepository.findAll()
                .stream()
                .map(student -> berechneStudent(student.getId()))
                .toList();
    }

    /**
     * OGS, OGSH und OGSF zählen jeweils 0,25
     * für die Langgruppenberechnung.
     */
    private boolean istNormaleLangBuchung(String buchungsart) {
        return "OGS".equalsIgnoreCase(buchungsart)
                || "OGSH".equalsIgnoreCase(buchungsart)
                || "OGSF".equalsIgnoreCase(buchungsart);
    }

    /**
     * Jede Kurz-Buchung zählt 0,5.
     */
    private double berechneKurzZaehler(int anzahlKurzBuchungen) {
        return anzahlKurzBuchungen * KURZ_FAKTOR;
    }

    public ZuschussBerechnung berechneZuschuss(String schuljahr) {
        ZuschussEinstellung einstellung =
                zuschussEinstellungRepository.findBySchuljahr(schuljahr)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Keine Zuschusseinstellungen für das Schuljahr "
                                        + schuljahr + " gefunden."
                        ));

        List<StudentZuschuss> studenten = berechneAlleStudenten();

        double kurzZaehlschueler = studenten.stream()
                .mapToDouble(StudentZuschuss::getKurzZaehlschueler)
                .sum();

        double langZaehlschueler12 = studenten.stream()
                .filter(studentZuschuss ->
                        istJahrgangZwischen(
                                studentZuschuss.getStudent().getJahrgang(),
                                1,
                                2
                        )
                )
                .mapToDouble(StudentZuschuss::getLangZaehlschueler)
                .sum();

        double langZaehlschueler14Gesamt = studenten.stream()
                .filter(studentZuschuss ->
                        istJahrgangZwischen(
                                studentZuschuss.getStudent().getJahrgang(),
                                1,
                                4
                        )
                )
                .mapToDouble(StudentZuschuss::getLangZaehlschueler)
                .sum();

        double langZaehlschueler510 = studenten.stream()
                .filter(studentZuschuss ->
                        istJahrgangZwischen(
                                studentZuschuss.getStudent().getJahrgang(),
                                5,
                                10
                        )
                )
                .mapToDouble(StudentZuschuss::getLangZaehlschueler)
                .sum();

        int kurzgruppen = berechneKurzgruppen(kurzZaehlschueler);

        int langgruppen14Gesamt =
                berechneLanggruppen(langZaehlschueler14Gesamt);

        int langgruppen12 =
                berechneLanggruppen(langZaehlschueler12);

        /*
         * Die Gruppen 1-2 werden von der Gesamtanzahl
         * der Langgruppen 1-4 abgezogen.
         */
        int langgruppen14 =
                Math.max(0, langgruppen14Gesamt - langgruppen12);

        int langgruppen510 =
                berechneLanggruppen(langZaehlschueler510);

        double kurzgruppeGesamt =
                kurzgruppen * einstellung.getKurzgruppeBetrag();

        double langgruppe12Gesamt =
                langgruppen12 * einstellung.getLanggruppe12Betrag();

        double langgruppe14Gesamt =
                langgruppen14 * einstellung.getLanggruppe14Betrag();

        double langgruppe510Gesamt =
                langgruppen510 * einstellung.getLanggruppe510Betrag();

        double gesamtZuschuss =
                kurzgruppeGesamt
                        + langgruppe12Gesamt
                        + langgruppe14Gesamt
                        + langgruppe510Gesamt;

        return new ZuschussBerechnung(
                schuljahr,

                kurzZaehlschueler,
                kurzgruppen,
                einstellung.getKurzgruppeBetrag(),
                kurzgruppeGesamt,

                langZaehlschueler12,
                langgruppen12,
                einstellung.getLanggruppe12Betrag(),
                langgruppe12Gesamt,

                langZaehlschueler14Gesamt,
                langgruppen14,
                einstellung.getLanggruppe14Betrag(),
                langgruppe14Gesamt,

                langZaehlschueler510,
                langgruppen510,
                einstellung.getLanggruppe510Betrag(),
                langgruppe510Gesamt,

                gesamtZuschuss,
                studenten
        );
    }

    /**
     * OGS, OGSH und OGSF zählen jeweils 0,25.
     *
     * P-Regel:
     * - keine normale Lang-Buchung: P zählt nicht
     * - mindestens 1 normale Lang-Buchung: P zählt maximal 0,25
     * - mindestens 2 normale Lang-Buchungen und mindestens 2x P:
     *   P zählt maximal 0,5
     */
    private double berechneLangZaehler(
            int anzahlLangBuchungen,
            int anzahlPBuchungen
    ) {
        double zaehler =
                anzahlLangBuchungen * LANG_FAKTOR;

        zaehler += berechnePZaehler(
                anzahlLangBuchungen,
                anzahlPBuchungen
        );

        return zaehler;
    }

    private double berechnePZaehler(
            int anzahlLangBuchungen,
            int anzahlPBuchungen
    ) {
        if (anzahlPBuchungen == 0) {
            return 0;
        }

        /*
         * Ohne OGS, OGSH oder OGSF wird P nicht berücksichtigt.
         */
        if (anzahlLangBuchungen == 0) {
            return 0;
        }

        /*
         * Mindestens zwei normale Lang-Buchungen und mindestens zwei P:
         * P zählt insgesamt 0,5.
         */
        if (anzahlLangBuchungen >= 2 && anzahlPBuchungen >= 2) {
            return 0.5;
        }

        /*
         * In allen anderen gültigen Fällen zählt P insgesamt 0,25.
         */
        return 0.25;
    }

    /**
     * Kurzgruppen gibt es nur für die Jahrgänge 1 bis 4.
     *
     * Der Schüler wird erst bei mindestens zwei Kurz-Buchungen
     * als ein Zählschüler berücksichtigt.
     */
    private double berechneKurzZaehlschueler(
            Integer jahrgang,
            int anzahlKurzBuchungen
    ) {
        if (!istGrundschule(jahrgang)) {
            return 0;
        }

        if (anzahlKurzBuchungen < 2) {
            return 0;
        }

        return 1;
    }

    /**
     * Langgruppe Grundschule:
     * 2 Buchungen = 0,5
     * 3 Buchungen = 0,75
     * 4 Buchungen = 1
     * 5 oder mehr Buchungen = maximal 1,25
     *
     * Langgruppe Hauptschule:
     * 2 Buchungen = 0,5
     * 3 Buchungen = 0,75
     * 4 oder mehr Buchungen = maximal 1
     */
    private double berechneLangZaehlschueler(
            Integer jahrgang,
            int anzahlLangBuchungen,
            int anzahlPBuchungen,
            double langZaehler
    ) {
        if (jahrgang == null) {
            return 0;
        }

        int anzahlRelevanteBuchungen =
                anzahlLangBuchungen + anzahlPBuchungen;

        /*
         * Mindestens zwei relevante Lang-Buchungen erforderlich.
         */
        if (anzahlRelevanteBuchungen < 2) {
            return 0;
        }

        /*
         * Trotz mindestens zwei Buchungen kann der Zähler 0 sein,
         * zum Beispiel bei Buchungen, die ausschließlich aus P bestehen.
         */
        if (langZaehler <= 0) {
            return 0;
        }

        if (istGrundschule(jahrgang)) {
            return Math.min(langZaehler, 1.25);
        }

        if (istHauptschule(jahrgang)) {
            return Math.min(langZaehler, 1.0);
        }

        return 0;
    }

    private boolean istGrundschule(Integer jahrgang) {
        return jahrgang != null
                && jahrgang >= 1
                && jahrgang <= 4;
    }

    private boolean istHauptschule(Integer jahrgang) {
        return jahrgang != null
                && jahrgang >= 5
                && jahrgang <= 10;
    }

    private boolean istJahrgangZwischen(
            Integer jahrgang,
            int von,
            int bis
    ) {
        return jahrgang != null
                && jahrgang >= von
                && jahrgang <= bis;
    }

    private int berechneKurzgruppen(double zaehlschueler) {
        if (zaehlschueler < 12) {
            return 0;
        }

        if (zaehlschueler <= 23) {
            return 1;
        }

        if (zaehlschueler <= 35) {
            return 2;
        }

        if (zaehlschueler <= 47) {
            return 3;
        }

        if (zaehlschueler <= 59) {
            return 4;
        }

        if (zaehlschueler <= 71) {
            return 5;
        }

        if (zaehlschueler <= 83) {
            return 6;
        }

        if (zaehlschueler <= 95) {
            return 7;
        }

        return 8;
    }

    private int berechneLanggruppen(double zaehlschueler) {
        if (zaehlschueler < 14) {
            return 0;
        }

        if (zaehlschueler <= 25) {
            return 1;
        }

        if (zaehlschueler <= 45) {
            return 2;
        }

        if (zaehlschueler <= 65) {
            return 3;
        }

        if (zaehlschueler <= 85) {
            return 4;
        }

        if (zaehlschueler <= 105) {
            return 5;
        }

        if (zaehlschueler <= 125) {
            return 6;
        }

        return 7;
    }
}