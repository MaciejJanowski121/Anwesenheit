package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Anwesenheit;
import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.AnwesenheitRepository;
import com.example.anwesenheit.repository.KursRepository;
import com.example.anwesenheit.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class AnwesenheitService {

    private final AnwesenheitRepository anwesenheitRepository;
    private final StudentRepository studentRepository;
    private final KursRepository kursRepository;

    public AnwesenheitService(
            AnwesenheitRepository anwesenheitRepository,
            StudentRepository studentRepository,
            KursRepository kursRepository
    ) {
        this.anwesenheitRepository = anwesenheitRepository;
        this.studentRepository = studentRepository;
        this.kursRepository = kursRepository;
    }

    public List<Anwesenheit> getAllAnwesenheiten() {
        return anwesenheitRepository.findAll();
    }

    public List<Anwesenheit> getAnwesenheitenByZeitraum(
            LocalDate von,
            LocalDate bis
    ) {
        if (von == null || bis == null) {
            throw new IllegalArgumentException(
                    "Von- und Bis-Datum müssen angegeben werden."
            );
        }

        if (von.isAfter(bis)) {
            throw new IllegalArgumentException(
                    "Das Von-Datum darf nicht nach dem Bis-Datum liegen."
            );
        }

        return anwesenheitRepository
                .findByDatumBetweenOrderByDatumAsc(
                        von,
                        bis
                );
    }

    public Anwesenheit createAnwesenheit(
            Anwesenheit anwesenheit,
            Long studentId,
            Long kursId
    ) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student nicht gefunden"
                        )
                );

        Kurs kurs = kursRepository.findById(kursId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Kurs nicht gefunden"
                        )
                );

        Anwesenheit existing = anwesenheitRepository
                .findByStudentIdAndKursIdAndDatum(
                        studentId,
                        kursId,
                        anwesenheit.getDatum()
                )
                .orElse(null);

        if (existing != null) {

            existing.setStatus(
                    anwesenheit.getStatus()
            );

            existing.setBemerkung(
                    anwesenheit.getBemerkung()
            );

            return anwesenheitRepository.save(
                    existing
            );
        }

        anwesenheit.setStudent(student);
        anwesenheit.setKurs(kurs);

        return anwesenheitRepository.save(
                anwesenheit
        );
    }

    public Map<String, Long> getStatistikByStudent(
            Long studentId
    ) {

        long anwesend =
                anwesenheitRepository
                        .countByStudentIdAndStatusIgnoreCase(
                                studentId,
                                "ANWESEND"
                        );

        long entschuldigt =
                anwesenheitRepository
                        .countByStudentIdAndStatusIgnoreCase(
                                studentId,
                                "ENTSCHULDIGT"
                        );

        long fehlend =
                anwesenheitRepository
                        .countByStudentIdAndStatusIgnoreCase(
                                studentId,
                                "FEHLT"
                        );

        return Map.of(
                "anzahlAnwesend",
                anwesend,

                "anzahlEntschuldigt",
                entschuldigt,

                "anzahlFehlend",
                fehlend
        );
    }

    public void deleteAnwesenheit(Long id) {
        anwesenheitRepository.deleteById(id);
    }

    public List<Anwesenheit> getAnwesenheitenByStudent(
            Long studentId
    ) {
        return anwesenheitRepository
                .findByStudentId(studentId);
    }

    public List<Anwesenheit> getAnwesenheitenByKurs(
            Long kursId
    ) {
        return anwesenheitRepository
                .findByKursId(kursId);
    }
}