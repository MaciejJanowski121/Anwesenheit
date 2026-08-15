package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(
            StudentRepository studentRepository
    ) {
        this.studentRepository =
                studentRepository;
    }

    /* =====================================================
       ALLE SCHÜLER
       ===================================================== */

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    /* =====================================================
       SCHÜLER NACH ID
       ===================================================== */

    public Student getStudentById(
            Long id
    ) {
        return studentRepository
                .findById(id)
                .orElseThrow(
                        () ->
                                new RuntimeException(
                                        "Student not found"
                                )
                );
    }

    /* =====================================================
       SCHÜLER ERSTELLEN
       ===================================================== */

    public Student createStudent(
            Student student
    ) {
        return studentRepository.save(
                student
        );
    }

    /* =====================================================
       SCHÜLER AKTUALISIEREN
       ===================================================== */

    public Student updateStudent(
            Long id,
            Student updatedStudent
    ) {
        Student student =
                studentRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Student not found"
                                        )
                        );

        /*
         * ID_Kind wird hier absichtlich NICHT geändert.
         *
         * Die ID_Kind wird beim Excel-Import gesetzt
         * und dient als dauerhafte fachliche ID des Kindes.
         *
         * Eine normale Bearbeitung über die Anwendung
         * soll diese ID weder ändern noch löschen können.
         */

        student.setVorname(
                updatedStudent.getVorname()
        );

        student.setNachname(
                updatedStudent.getNachname()
        );

        student.setJahrgang(
                updatedStudent.getJahrgang()
        );

        student.setKlasse(
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

        student.setGehtUm1530(
                updatedStudent.getGehtUm1530()
        );

        return studentRepository.save(
                student
        );
    }

    /* =====================================================
       SCHÜLER LÖSCHEN
       ===================================================== */

    public void deleteStudent(
            Long id
    ) {
        studentRepository.deleteById(
                id
        );
    }
}