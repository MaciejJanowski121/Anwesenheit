package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.StudentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final KlasseService klasseService;

    /* =====================================================
       KONSTRUKTOR
       ===================================================== */

    public StudentService(
            StudentRepository studentRepository,
            KlasseService klasseService
    ) {
        this.studentRepository = studentRepository;
        this.klasseService = klasseService;
    }

    /* =====================================================
       ALLE SCHÜLER
       ===================================================== */

    @Transactional(readOnly = true)
    public List<Student> getAllStudents() {

        return studentRepository.findAll();
    }

    /* =====================================================
       SCHÜLER NACH ID
       ===================================================== */

    @Transactional(readOnly = true)
    public Student getStudentById(
            Long id
    ) {

        return studentRepository
                .findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Student not found"
                        )
                );
    }

    /* =====================================================
       SCHÜLER ERSTELLEN
       ===================================================== */

    @Transactional
    public Student createStudent(
            Student student
    ) {

        /*
         * Klasse automatisch zuordnen.
         *
         * KlasseService aktualisiert:
         *
         * - student.klasse
         * - student.klasseEntity
         *
         * Falls die Klasse noch nicht existiert,
         * wird sie automatisch erstellt.
         */

        klasseService.assignKlasse(
                student,
                student.getKlasse()
        );

        return studentRepository.save(
                student
        );
    }

    /* =====================================================
       SCHÜLER AKTUALISIEREN
       ===================================================== */

    @Transactional
    public Student updateStudent(
            Long id,
            Student updatedStudent
    ) {

        Student student = studentRepository
                .findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Student not found"
                        )
                );

        /*
         * ID_Kind wird absichtlich NICHT geändert.
         *
         * Diese ID stammt aus dem Excel-Import
         * und bleibt dauerhaft erhalten.
         */

        /* =================================================
           ALLGEMEINE INFORMATIONEN
           ================================================= */

        student.setVorname(
                updatedStudent.getVorname()
        );

        student.setNachname(
                updatedStudent.getNachname()
        );

        student.setJahrgang(
                updatedStudent.getJahrgang()
        );

        /*
         * Klasse aktualisieren.
         *
         * Die neue Klasse wird über KlasseService
         * gesucht oder bei Bedarf erstellt.
         *
         * Beide Felder bleiben synchron:
         *
         * - klasse (String)
         * - klasseEntity (ManyToOne)
         */

        klasseService.assignKlasse(
                student,
                updatedStudent.getKlasse()
        );

        student.setFotoFreigabe(
                updatedStudent.getFotoFreigabe()
        );

        /* =================================================
           KONTAKT 1
           ================================================= */

        student.setEmail1(
                updatedStudent.getEmail1()
        );

        student.setTelefon1(
                updatedStudent.getTelefon1()
        );

        student.setMobil1(
                updatedStudent.getMobil1()
        );

        /* =================================================
           KONTAKT 2
           ================================================= */

        student.setEmail2(
                updatedStudent.getEmail2()
        );

        student.setTelefon2(
                updatedStudent.getTelefon2()
        );

        student.setMobil2(
                updatedStudent.getMobil2()
        );

        /* =================================================
           15:30
           ================================================= */

        /*
         * Bestehende Funktion bleibt erhalten.
         *
         * Später können wir diese Information
         * vollständig über Besonderheiten
         * oder Anwesenheitszeiten verwalten.
         */

        student.setGehtUm1530(
                updatedStudent.getGehtUm1530()
        );

        /* =================================================
           SPEICHERN
           ================================================= */

        return studentRepository.save(
                student
        );
    }

    /* =====================================================
       SCHÜLER LÖSCHEN
       ===================================================== */

    @Transactional
    public void deleteStudent(
            Long id
    ) {

        studentRepository.deleteById(
                id
        );
    }
}