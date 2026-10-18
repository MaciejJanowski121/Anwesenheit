package com.example.anwesenheit.controller;

import com.example.anwesenheit.dto.SchuelerinfoResponse;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.service.StudentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schuelerinfos")
public class SchuelerinfoController {

    private final StudentService studentService;

    public SchuelerinfoController(
            StudentService studentService
    ) {
        this.studentService = studentService;
    }

    /* =====================================================
       ALLE SCHÜLER LESEN
       ===================================================== */

    @GetMapping
    public List<SchuelerinfoResponse> getAll() {

        return studentService
                .getAllStudents()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /* =====================================================
       EINZELNEN SCHÜLER LESEN
       ===================================================== */

    @GetMapping("/{id}")
    public ResponseEntity<SchuelerinfoResponse> getById(
            @PathVariable Long id
    ) {

        Student student =
                studentService.getStudentById(id);

        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                toResponse(student)
        );
    }

    /* =====================================================
       DTO – NUR FREIGEGEBENE DATEN
       ===================================================== */

    private SchuelerinfoResponse toResponse(
            Student student
    ) {

        return new SchuelerinfoResponse(
                student.getId(),
                student.getNachname(),
                student.getVorname(),
                student.getJahrgang(),
                student.getKlasse(),
                student.getFotoFreigabe(),
                student.getEmail1(),
                student.getTelefon1(),
                student.getMobil1(),
                student.getEmail2(),
                student.getTelefon2(),
                student.getMobil2(),
                student.getGehtUm1530()
        );
    }
}