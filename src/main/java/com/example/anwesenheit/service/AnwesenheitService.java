package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Anwesenheit;
import com.example.anwesenheit.model.Kurs;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.AnwesenheitRepository;
import com.example.anwesenheit.repository.KursRepository;
import com.example.anwesenheit.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public Anwesenheit createAnwesenheit(
            Anwesenheit anwesenheit,
            Long studentId,
            Long kursId
    ) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student nicht gefunden"));

        Kurs kurs = kursRepository.findById(kursId)
                .orElseThrow(() -> new RuntimeException("Kurs nicht gefunden"));

        Anwesenheit existing = anwesenheitRepository
                .findByStudentIdAndKursIdAndDatum(
                        studentId,
                        kursId,
                        anwesenheit.getDatum()
                )
                .orElse(null);

        if (existing != null) {

            existing.setStatus(anwesenheit.getStatus());
            existing.setBemerkung(anwesenheit.getBemerkung());

            return anwesenheitRepository.save(existing);
        }

        anwesenheit.setStudent(student);
        anwesenheit.setKurs(kurs);

        return anwesenheitRepository.save(anwesenheit);
    }

    public void deleteAnwesenheit(Long id) {
        anwesenheitRepository.deleteById(id);
    }

    public List<Anwesenheit> getAnwesenheitenByStudent(Long studentId) {
        return anwesenheitRepository.findByStudentId(studentId);
    }

    public List<Anwesenheit> getAnwesenheitenByKurs(Long kursId) {
        return anwesenheitRepository.findByKursId(kursId);
    }
}