package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Buchung;
import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.BuchungRepository;
import com.example.anwesenheit.repository.KursRepository;
import com.example.anwesenheit.repository.StudentRepository;
import org.springframework.stereotype.Service;

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
        this.buchungRepository = buchungRepository;
        this.studentRepository = studentRepository;
        this.kursRepository = kursRepository;
    }

    public Buchung createBuchung(Long studentId, Long kursId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student nicht gefunden"));

        Kurs kurs = kursRepository.findById(kursId)
                .orElseThrow(() -> new RuntimeException("Kurs nicht gefunden"));

        Buchung buchung = new Buchung();
        buchung.setStudent(student);
        buchung.setKurs(kurs);
        buchung.setBuchungsstatus("Aktiv");

        return buchungRepository.save(buchung);
    }

    public List<Buchung> getBuchungenByStudentId(Long studentId) {
        return buchungRepository.findByStudentId(studentId);
    }

    public void deleteBuchung(Long id) {
        buchungRepository.deleteById(id);
    }
}