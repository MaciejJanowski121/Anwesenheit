package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Angebot;
import com.example.anwesenheit.model.AngebotAnwesenheit;
import com.example.anwesenheit.model.Student;

import com.example.anwesenheit.repository.AngebotRepository;
import com.example.anwesenheit.repository.AngebotTeilnahmeRepository;
import com.example.anwesenheit.repository.AngebotAnwesenheitRepository;
import com.example.anwesenheit.repository.StudentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AngebotAnwesenheitService {

    private static final Set<String> ERLAUBTE_STATUS =
            Set.of("ANWESEND", "FEHLT", "ENTSCHULDIGT");

    private final AngebotAnwesenheitRepository anwesenheitRepository;
    private final AngebotTeilnahmeRepository teilnahmeRepository;
    private final AngebotRepository angebotRepository;
    private final StudentRepository studentRepository;

    public AngebotAnwesenheitService(
            AngebotAnwesenheitRepository anwesenheitRepository,
            AngebotTeilnahmeRepository teilnahmeRepository,
            AngebotRepository angebotRepository,
            StudentRepository studentRepository
    ) {
        this.anwesenheitRepository = anwesenheitRepository;
        this.teilnahmeRepository = teilnahmeRepository;
        this.angebotRepository = angebotRepository;
        this.studentRepository = studentRepository;
    }

    /* =====================================================
       ALLE ANWESENHEITEN
       ===================================================== */

    @Transactional(readOnly = true)
    public List<AngebotAnwesenheit> getAllAnwesenheiten() {
        return anwesenheitRepository.findAll();
    }

    /* =====================================================
       ANWESENHEIT ERSTELLEN / AKTUALISIEREN
       ===================================================== */

    @Transactional
    public AngebotAnwesenheit createAnwesenheit(
            AngebotAnwesenheit anwesenheit,
            Long studentId,
            Long angebotId
    ) {

        if (anwesenheit == null || anwesenheit.getDatum() == null) {
            throw new IllegalArgumentException(
                    "Das Datum muss angegeben werden."
            );
        }

        if (anwesenheit.getStatus() == null) {
            throw new IllegalArgumentException(
                    "Der Status muss angegeben werden."
            );
        }

        String status = anwesenheit.getStatus()
                .trim()
                .toUpperCase(java.util.Locale.ROOT);

        if (!ERLAUBTE_STATUS.contains(status)) {
            throw new IllegalArgumentException(
                    "Ungültiger Status. Erlaubt: ANWESEND, FEHLT, ENTSCHULDIGT."
            );
        }

        Student student = studentRepository
                .findById(studentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student nicht gefunden"
                        )
                );

        Angebot angebot = angebotRepository
                .findById(angebotId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Angebot nicht gefunden"
                        )
                );

        boolean istTeilnehmer = teilnahmeRepository
                .existsByStudentIdAndAngebotId(
                        studentId,
                        angebotId
                );

        if (!istTeilnehmer) {
            throw new IllegalArgumentException(
                    "Der Schüler ist diesem Angebot nicht zugeordnet."
            );
        }

        AngebotAnwesenheit existing = anwesenheitRepository
                .findByStudentIdAndAngebotIdAndDatum(
                        studentId,
                        angebotId,
                        anwesenheit.getDatum()
                )
                .orElse(null);

        if (existing != null) {

            existing.setStatus(status);
            existing.setBemerkung(anwesenheit.getBemerkung());

            return anwesenheitRepository.save(existing);
        }

        AngebotAnwesenheit neueAnwesenheit =
                new AngebotAnwesenheit();

        neueAnwesenheit.setDatum(anwesenheit.getDatum());
        neueAnwesenheit.setStatus(status);
        neueAnwesenheit.setBemerkung(anwesenheit.getBemerkung());
        neueAnwesenheit.setStudent(student);
        neueAnwesenheit.setAngebot(angebot);

        return anwesenheitRepository.save(neueAnwesenheit);
    }

    /* =====================================================
       ANWESENHEITEN EINES ANGEBOTS
       ===================================================== */

    @Transactional(readOnly = true)
    public List<AngebotAnwesenheit> getAnwesenheitenByAngebot(
            Long angebotId
    ) {

        getAngebot(angebotId);

        return anwesenheitRepository.findByAngebotId(angebotId);
    }

    /* =====================================================
       ANWESENHEITEN EINES SCHÜLERS
       ===================================================== */

    @Transactional(readOnly = true)
    public List<AngebotAnwesenheit> getAnwesenheitenByStudent(
            Long studentId
    ) {

        getStudent(studentId);

        return anwesenheitRepository.findByStudentId(studentId);
    }

    /* =====================================================
       ANWESENHEITEN IM ZEITRAUM
       ===================================================== */

    @Transactional(readOnly = true)
    public List<AngebotAnwesenheit> getAnwesenheitenByZeitraum(
            LocalDate von,
            LocalDate bis
    ) {

        validateZeitraum(von, bis);

        return anwesenheitRepository
                .findByDatumBetweenOrderByDatumAsc(von, bis);
    }

    /* =====================================================
       ANWESENHEITEN EINES ANGEBOTS IM ZEITRAUM
       ===================================================== */

    @Transactional(readOnly = true)
    public List<AngebotAnwesenheit> getAnwesenheitenByAngebotUndZeitraum(
            Long angebotId,
            LocalDate von,
            LocalDate bis
    ) {

        getAngebot(angebotId);
        validateZeitraum(von, bis);

        return anwesenheitRepository
                .findByAngebotIdAndDatumBetweenOrderByDatumAsc(
                        angebotId,
                        von,
                        bis
                );
    }

    /* =====================================================
       STATISTIK EINES ANGEBOTS
       ===================================================== */

    @Transactional(readOnly = true)
    public Map<String, Long> getStatistikByAngebot(
            Long angebotId
    ) {

        getAngebot(angebotId);

        long anwesend = anwesenheitRepository
                .countByAngebotIdAndStatusIgnoreCase(
                        angebotId,
                        "ANWESEND"
                );

        long entschuldigt = anwesenheitRepository
                .countByAngebotIdAndStatusIgnoreCase(
                        angebotId,
                        "ENTSCHULDIGT"
                );

        long fehlend = anwesenheitRepository
                .countByAngebotIdAndStatusIgnoreCase(
                        angebotId,
                        "FEHLT"
                );

        return Map.of(
                "anzahlAnwesend", anwesend,
                "anzahlEntschuldigt", entschuldigt,
                "anzahlFehlend", fehlend
        );
    }

    /* =====================================================
       STATISTIK EINES SCHÜLERS
       ===================================================== */

    @Transactional(readOnly = true)
    public Map<String, Long> getStatistikByStudent(
            Long studentId
    ) {

        getStudent(studentId);

        long anwesend = anwesenheitRepository
                .countByStudentIdAndStatusIgnoreCase(
                        studentId,
                        "ANWESEND"
                );

        long entschuldigt = anwesenheitRepository
                .countByStudentIdAndStatusIgnoreCase(
                        studentId,
                        "ENTSCHULDIGT"
                );

        long fehlend = anwesenheitRepository
                .countByStudentIdAndStatusIgnoreCase(
                        studentId,
                        "FEHLT"
                );

        return Map.of(
                "anzahlAnwesend", anwesend,
                "anzahlEntschuldigt", entschuldigt,
                "anzahlFehlend", fehlend
        );
    }

    /* =====================================================
       ANWESENHEIT LÖSCHEN
       ===================================================== */

    @Transactional
    public void deleteAnwesenheit(Long id) {

        AngebotAnwesenheit anwesenheit = anwesenheitRepository
                .findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Anwesenheit nicht gefunden"
                        )
                );

        anwesenheitRepository.delete(anwesenheit);
    }

    /* =====================================================
       HILFSMETHODEN
       ===================================================== */

    private Angebot getAngebot(Long angebotId) {

        return angebotRepository.findById(angebotId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Angebot nicht gefunden"
                        )
                );
    }

    private Student getStudent(Long studentId) {

        return studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student nicht gefunden"
                        )
                );
    }

    private void validateZeitraum(
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
    }
}