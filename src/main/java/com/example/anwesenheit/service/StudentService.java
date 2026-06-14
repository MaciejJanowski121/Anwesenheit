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

    public Student createStudent(Student student) {
        return studentRepository.save(student);
    }

    public Student updateStudent(Long id, Student updatedStudent) {
        Student student = studentRepository.findById(id)

                .orElseThrow(() -> new RuntimeException("Student not found"));
        student.setName(updatedStudent.getName());

        student.setJahrgang(updatedStudent.getJahrgang());

        student.setKlasse(updatedStudent.getKlasse());

        student.setKlassenkuerzel(updatedStudent.getKlassenkuerzel());

        student.setEmail1(updatedStudent.getEmail1());

        student.setEmail2(updatedStudent.getEmail2());

        student.setMittagessen(updatedStudent.getMittagessen());

        student.setGehtUm1530(updatedStudent.getGehtUm1530());

        student.setRueckmeldung(updatedStudent.getRueckmeldung());

        student.setAnaBuchung(updatedStudent.getAnaBuchung());

        return studentRepository.save(student);
    }

    public void deleteStudent(Long id) {

        studentRepository.deleteById(id);

    }

    public Student getStudentById(Long id) {
        return studentRepository.findById(id).orElseThrow(() -> new RuntimeException("Student not found"));
    }


}
