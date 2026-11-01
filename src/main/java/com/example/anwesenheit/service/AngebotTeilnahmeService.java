package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Angebot;
import com.example.anwesenheit.model.AngebotTeilnahme;
import com.example.anwesenheit.model.Student;

import com.example.anwesenheit.repository.AngebotRepository;
import com.example.anwesenheit.repository.AngebotTeilnahmeRepository;
import com.example.anwesenheit.repository.StudentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class AngebotTeilnahmeService {

    private static final int MAX_BESONDERHEITEN_LENGTH = 50;

    private final AngebotTeilnahmeRepository teilnahmeRepository;
    private final AngebotRepository angebotRepository;
    private final StudentRepository studentRepository;

    public AngebotTeilnahmeService(
            AngebotTeilnahmeRepository teilnahmeRepository,
            AngebotRepository angebotRepository,
            StudentRepository studentRepository
    ) {
        this.teilnahmeRepository = teilnahmeRepository;
        this.angebotRepository = angebotRepository;
        this.studentRepository = studentRepository;
    }

    /* =====================================================
       EINZELNEN SCHÜLER HINZUFÜGEN
       ===================================================== */

    @Transactional
    public AngebotTeilnahme createTeilnahme(
            Long studentId,
            Long angebotId
    ) {

        Angebot angebot = getAngebot(angebotId);
        Student student = getStudent(studentId);

        boolean exists = teilnahmeRepository
                .existsByStudentIdAndAngebotId(
                        studentId,
                        angebotId
                );

        if (exists) {
            throw new IllegalArgumentException(
                    "Der Schüler ist bereits diesem Angebot zugeordnet."
            );
        }

        AngebotTeilnahme teilnahme = new AngebotTeilnahme();

        teilnahme.setStudent(student);
        teilnahme.setAngebot(angebot);
        teilnahme.setBuchungsdatum(LocalDate.now());

        return teilnahmeRepository.save(teilnahme);
    }

    /* =====================================================
       MEHRERE SCHÜLER HINZUFÜGEN
       ===================================================== */

    @Transactional
    public int addStudentsToAngebot(
            Long angebotId,
            List<Long> studentIds
    ) {

        Angebot angebot = getAngebot(angebotId);

        if (studentIds == null || studentIds.isEmpty()) {
            return 0;
        }

        int hinzugefuegt = 0;

        List<Long> uniqueStudentIds = studentIds
                .stream()
                .filter(id -> id != null)
                .distinct()
                .toList();

        for (Long studentId : uniqueStudentIds) {

            boolean exists = teilnahmeRepository
                    .existsByStudentIdAndAngebotId(
                            studentId,
                            angebotId
                    );

            if (exists) {
                continue;
            }

            Student student = getStudent(studentId);

            AngebotTeilnahme teilnahme = new AngebotTeilnahme();

            teilnahme.setStudent(student);
            teilnahme.setAngebot(angebot);
            teilnahme.setBuchungsdatum(LocalDate.now());

            teilnahmeRepository.save(teilnahme);

            hinzugefuegt++;
        }

        return hinzugefuegt;
    }

    /* =====================================================
       GANZEN JAHRGANG HINZUFÜGEN
       ===================================================== */

    @Transactional
    public int addJahrgangToAngebot(
            Long angebotId,
            Integer jahrgang
    ) {

        Angebot angebot = getAngebot(angebotId);

        if (jahrgang == null) {
            throw new IllegalArgumentException(
                    "Jahrgang muss angegeben werden."
            );
        }

        List<Student> students = studentRepository
                .findByJahrgang(jahrgang);

        int hinzugefuegt = 0;

        for (Student student : students) {

            boolean exists = teilnahmeRepository
                    .existsByStudentIdAndAngebotId(
                            student.getId(),
                            angebotId
                    );

            if (exists) {
                continue;
            }

            AngebotTeilnahme teilnahme = new AngebotTeilnahme();

            teilnahme.setStudent(student);
            teilnahme.setAngebot(angebot);
            teilnahme.setBuchungsdatum(LocalDate.now());

            teilnahmeRepository.save(teilnahme);

            hinzugefuegt++;
        }

        return hinzugefuegt;
    }

    /* =====================================================
       TEILNEHMER EINES ANGEBOTS
       ===================================================== */

    @Transactional(readOnly = true)
    public List<AngebotTeilnahme> getTeilnahmenByAngebot(
            Long angebotId
    ) {

        getAngebot(angebotId);

        return teilnahmeRepository
                .findByAngebotId(angebotId);
    }

    /* =====================================================
       ANGEBOTE EINES SCHÜLERS
       ===================================================== */

    @Transactional(readOnly = true)
    public List<AngebotTeilnahme> getTeilnahmenByStudent(
            Long studentId
    ) {

        getStudent(studentId);

        return teilnahmeRepository
                .findByStudentId(studentId);
    }

    /* =====================================================
       TEILNEHMERZAHL
       ===================================================== */

    @Transactional(readOnly = true)
    public Map<String, Long> getTeilnehmerStatistik(
            Long angebotId
    ) {

        getAngebot(angebotId);

        long teilnehmer = teilnahmeRepository
                .countByAngebotId(angebotId);

        return Map.of(
                "anzahlTeilnehmer",
                teilnehmer
        );
    }

    /* =====================================================
       BESONDERHEITEN AKTUALISIEREN
       ===================================================== */

    @Transactional
    public AngebotTeilnahme updateBesonderheiten(
            Long teilnahmeId,
            String besonderheiten
    ) {

        AngebotTeilnahme teilnahme = teilnahmeRepository
                .findById(teilnahmeId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Teilnahme nicht gefunden"
                        )
                );

        if (besonderheiten != null) {
            besonderheiten = besonderheiten.trim();

            if (besonderheiten.isEmpty()) {
                besonderheiten = null;
            }
        }

        if (
                besonderheiten != null &&
                        besonderheiten.length() > MAX_BESONDERHEITEN_LENGTH
        ) {
            throw new IllegalArgumentException(
                    "Besonderheiten dürfen maximal 50 Zeichen enthalten."
            );
        }

        teilnahme.setBesonderheiten(besonderheiten);

        return teilnahmeRepository.save(teilnahme);
    }

    /* =====================================================
       TEILNAHME LÖSCHEN
       ===================================================== */

    @Transactional
    public void deleteTeilnahme(
            Long teilnahmeId
    ) {

        AngebotTeilnahme teilnahme = teilnahmeRepository
                .findById(teilnahmeId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Teilnahme nicht gefunden"
                        )
                );

        teilnahmeRepository.delete(teilnahme);
    }

    /* =====================================================
       HILFSMETHODEN
       ===================================================== */

    private Angebot getAngebot(Long angebotId) {

        return angebotRepository
                .findById(angebotId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Angebot nicht gefunden"
                        )
                );
    }

    private Student getStudent(Long studentId) {

        return studentRepository
                .findById(studentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Student nicht gefunden"
                        )
                );
    }
}