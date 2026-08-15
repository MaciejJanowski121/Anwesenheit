package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Student;

import com.example.anwesenheit.repository.BuchungRepository;
import com.example.anwesenheit.repository.KursRepository;
import com.example.anwesenheit.repository.StudentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BuchungService {

    private final BuchungRepository buchungRepository;
    private final StudentRepository studentRepository;
    private final KursRepository kursRepository;

    public BuchungService(
            BuchungRepository buchungRepository,
            StudentRepository studentRepository,
            KursRepository kursRepository
    ) {
        this.buchungRepository =
                buchungRepository;

        this.studentRepository =
                studentRepository;

        this.kursRepository =
                kursRepository;
    }

    /* =====================================================
       EINZELNEN SCHÜLER EINEM KURS ZUORDNEN
       ===================================================== */

    @Transactional
    public Buchung createBuchung(
            Long studentId,
            Long kursId
    ) {

        Student student =
                studentRepository
                        .findById(studentId)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Student nicht gefunden"
                                        )
                        );

        Kurs kurs =
                kursRepository
                        .findById(kursId)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Kurs nicht gefunden"
                                        )
                        );

        boolean exists =
                buchungRepository
                        .existsByStudentIdAndKursId(
                                studentId,
                                kursId
                        );

        if (exists) {
            throw new RuntimeException(
                    "Der Schüler ist bereits diesem Kurs zugeordnet."
            );
        }

        Buchung buchung =
                new Buchung();

        buchung.setStudent(
                student
        );

        buchung.setKurs(
                kurs
        );

        buchung.setBuchungsdatum(
                LocalDate.now()
        );

        return buchungRepository.save(
                buchung
        );
    }

    /* =====================================================
       MEHRERE SCHÜLER EINEM KURS ZUORDNEN
       ===================================================== */

    @Transactional
    public int addStudentsToKurs(
            Long kursId,
            List<Long> studentIds
    ) {

        if (
                studentIds == null ||
                        studentIds.isEmpty()
        ) {
            return 0;
        }

        Kurs kurs =
                kursRepository
                        .findById(kursId)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Kurs nicht gefunden"
                                        )
                        );

        int hinzugefuegt = 0;

        /*
         * Doppelte IDs in der Anfrage entfernen.
         */
        List<Long> uniqueStudentIds =
                studentIds
                        .stream()
                        .distinct()
                        .toList();

        for (
                Long studentId :
                uniqueStudentIds
        ) {

            if (studentId == null) {
                continue;
            }

            /*
             * Bereits vorhandene Buchung überspringen.
             */
            boolean exists =
                    buchungRepository
                            .existsByStudentIdAndKursId(
                                    studentId,
                                    kursId
                            );

            if (exists) {
                continue;
            }

            Student student =
                    studentRepository
                            .findById(studentId)
                            .orElseThrow(
                                    () ->
                                            new RuntimeException(
                                                    "Student mit ID "
                                                            + studentId
                                                            + " nicht gefunden"
                                            )
                            );

            Buchung buchung =
                    new Buchung();

            buchung.setStudent(
                    student
            );

            buchung.setKurs(
                    kurs
            );

            buchung.setBuchungsdatum(
                    LocalDate.now()
            );

            buchungRepository.save(
                    buchung
            );

            hinzugefuegt++;
        }

        return hinzugefuegt;
    }

    /* =====================================================
       BUCHUNGEN EINES SCHÜLERS
       ===================================================== */

    public List<Buchung> getBuchungenByStudentId(
            Long studentId
    ) {

        return buchungRepository
                .findByStudentId(
                        studentId
                );
    }

    /* =====================================================
       BUCHUNGEN EINES KURSES
       ===================================================== */

    public List<Buchung> getBuchungenByKursId(
            Long kursId
    ) {

        return buchungRepository
                .findByKursId(
                        kursId
                );
    }

    /* =====================================================
       BUCHUNG LÖSCHEN
       ===================================================== */

    @Transactional
    public void deleteBuchung(
            Long id
    ) {

        buchungRepository
                .deleteById(
                        id
                );
    }

    /* =====================================================
       GANZEN JAHRGANG EINEM KURS ZUORDNEN
       ===================================================== */

    @Transactional
    public int addJahrgangToKurs(
            Long kursId,
            Integer jahrgang
    ) {

        Kurs kurs =
                kursRepository
                        .findById(kursId)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Kurs nicht gefunden"
                                        )
                        );

        List<Student> students =
                studentRepository
                        .findByJahrgang(
                                jahrgang
                        );

        int hinzugefuegt = 0;

        for (
                Student student :
                students
        ) {

            boolean exists =
                    buchungRepository
                            .existsByStudentIdAndKursId(
                                    student.getId(),
                                    kursId
                            );

            if (exists) {
                continue;
            }

            Buchung buchung =
                    new Buchung();

            buchung.setStudent(
                    student
            );

            buchung.setKurs(
                    kurs
            );

            buchung.setBuchungsdatum(
                    LocalDate.now()
            );

            buchungRepository.save(
                    buchung
            );

            hinzugefuegt++;
        }

        return hinzugefuegt;
    }
}