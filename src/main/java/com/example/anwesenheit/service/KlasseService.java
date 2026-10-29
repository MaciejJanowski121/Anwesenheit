package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Klasse;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.KlasseRepository;
import com.example.anwesenheit.repository.StudentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class KlasseService {

    private final KlasseRepository klasseRepository;
    private final StudentRepository studentRepository;

    public KlasseService(
            KlasseRepository klasseRepository,
            StudentRepository studentRepository
    ) {
        this.klasseRepository = klasseRepository;
        this.studentRepository = studentRepository;
    }

    /* =====================================================
       ALLE KLASSEN
       ===================================================== */

    @Transactional(readOnly = true)
    public List<Klasse> getAllKlassen() {

        return klasseRepository.findAll();
    }

    /* =====================================================
       KLASSE NACH ID
       ===================================================== */

    @Transactional(readOnly = true)
    public Klasse getKlasseById(Long id) {

        return klasseRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Klasse nicht gefunden"
                        )
                );
    }

    /* =====================================================
       KLASSE ERSTELLEN
       ===================================================== */

    @Transactional
    public Klasse createKlasse(Klasse klasse) {

        String name = normalizeName(klasse.getName());

        if (klasseRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException(
                    "Diese Klasse existiert bereits."
            );
        }

        klasse.setId(null);
        klasse.setName(name);

        return klasseRepository.save(klasse);
    }

    /* =====================================================
       KLASSE AKTUALISIEREN
       ===================================================== */

    @Transactional
    public Klasse updateKlasse(
            Long id,
            Klasse updatedKlasse
    ) {

        Klasse klasse = getKlasseById(id);

        String neuerName = normalizeName(
                updatedKlasse.getName()
        );

        klasseRepository.findByName(neuerName)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new IllegalArgumentException(
                                "Diese Klasse existiert bereits."
                        );
                    }
                });

        klasse.setName(neuerName);

        klasse.setKlassenpaedagoge1(
                updatedKlasse.getKlassenpaedagoge1()
        );

        klasse.setKlassenpaedagoge2(
                updatedKlasse.getKlassenpaedagoge2()
        );

        /*
         * Das bisherige Textfeld Student.klasse
         * bleibt während der Übergangsphase synchron.
         */
        List<Student> schueler =
                studentRepository.findAll()
                        .stream()
                        .filter(student ->
                                student.getKlasseEntity() != null
                                        && id.equals(
                                        student.getKlasseEntity().getId()
                                )
                        )
                        .toList();

        for (Student student : schueler) {
            student.setKlasse(neuerName);
        }

        studentRepository.saveAll(schueler);

        return klasseRepository.save(klasse);
    }

    /* =====================================================
       KLASSE LÖSCHEN
       ===================================================== */

    @Transactional
    public void deleteKlasse(Long id) {

        Klasse klasse = getKlasseById(id);

        boolean hasStudents = studentRepository.findAll()
                .stream()
                .anyMatch(student ->
                        student.getKlasseEntity() != null
                                && id.equals(
                                student.getKlasseEntity().getId()
                        )
                );

        if (hasStudents) {
            throw new IllegalStateException(
                    "Die Klasse kann nicht gelöscht werden, " +
                            "solange Schüler zugeordnet sind."
            );
        }

        klasseRepository.delete(klasse);
    }

    /* =====================================================
       SCHÜLER EINER KLASSE
       ===================================================== */

    @Transactional(readOnly = true)
    public List<Student> getSchuelerByKlasse(Long klasseId) {

        getKlasseById(klasseId);

        return studentRepository.findAll()
                .stream()
                .filter(student ->
                        student.getKlasseEntity() != null
                                && klasseId.equals(
                                student.getKlasseEntity().getId()
                        )
                )
                .toList();
    }

    /* =====================================================
       KLASSE ZUORDNEN
       ===================================================== */

    @Transactional
    public void assignKlasse(
            Student student,
            String klassenName
    ) {

        if (
                klassenName == null ||
                        klassenName.isBlank()
        ) {
            student.setKlasse(null);
            student.setKlasseEntity(null);
            return;
        }

        String name = klassenName.trim();

        Klasse klasse = klasseRepository
                .findByName(name)
                .orElseGet(() -> {

                    Klasse neueKlasse = new Klasse();
                    neueKlasse.setName(name);

                    return klasseRepository.save(neueKlasse);
                });

        student.setKlasse(name);
        student.setKlasseEntity(klasse);
    }

    /* =====================================================
       KLASSENNAME VALIDIEREN
       ===================================================== */

    private String normalizeName(String name) {

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException(
                    "Der Klassenname darf nicht leer sein."
            );
        }

        return name.trim();
    }

    /* =====================================================
   SCHÜLER EINER KLASSE ZUORDNEN
   ===================================================== */

    @Transactional
    public int addStudentsToKlasse(
            Long klasseId,
            List<Long> studentIds
    ) {

        Klasse klasse = getKlasseById(klasseId);

        if (studentIds == null || studentIds.isEmpty()) {
            return 0;
        }

        List<Student> students =
                studentRepository.findAllById(studentIds);

        if (students.size() != new java.util.HashSet<>(studentIds).size()) {
            throw new IllegalArgumentException(
                    "Mindestens ein Schüler wurde nicht gefunden."
            );
        }

        int hinzugefuegt = 0;

        for (Student student : students) {

            if (
                    student.getKlasseEntity() != null &&
                            klasseId.equals(
                                    student.getKlasseEntity().getId()
                            )
            ) {
                continue;
            }

            student.setKlasseEntity(klasse);
            student.setKlasse(klasse.getName());

            hinzugefuegt++;
        }

        studentRepository.saveAll(students);

        return hinzugefuegt;
    }

/* =====================================================
   SCHÜLER AUS KLASSE ENTFERNEN
   ===================================================== */

    @Transactional
    public void removeStudentFromKlasse(
            Long klasseId,
            Long studentId
    ) {

        getKlasseById(klasseId);

        Student student = studentRepository
                .findById(studentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Schüler nicht gefunden."
                        )
                );

        if (
                student.getKlasseEntity() == null ||
                        !klasseId.equals(
                                student.getKlasseEntity().getId()
                        )
        ) {
            throw new IllegalArgumentException(
                    "Der Schüler gehört nicht zu dieser Klasse."
            );
        }

        student.setKlasseEntity(null);
        student.setKlasse(null);

        studentRepository.save(student);
    }
}