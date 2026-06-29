package com.example.anwesenheit.service;

import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudentById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    public Student createStudent(Student student) {
        return studentRepository.save(student);
    }

    public Student updateStudent(Long id, Student updatedStudent) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        student.setVorname(updatedStudent.getVorname());
        student.setNachname(updatedStudent.getNachname());
        student.setJahrgang(updatedStudent.getJahrgang());
        student.setKlasse(updatedStudent.getKlasse());

        student.setFotoFreigabe(updatedStudent.getFotoFreigabe());

        student.setEmail1(updatedStudent.getEmail1());
        student.setTelefon1(updatedStudent.getTelefon1());
        student.setMobil1(updatedStudent.getMobil1());

        student.setEmail2(updatedStudent.getEmail2());
        student.setTelefon2(updatedStudent.getTelefon2());
        student.setMobil2(updatedStudent.getMobil2());

        return studentRepository.save(student);
    }

    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }
}