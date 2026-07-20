package com.example.anwesenheit.service;



import com.example.anwesenheit.model.GebuehrenErfassung;
import com.example.anwesenheit.model.Student;
import com.example.anwesenheit.repository.GebuehrenErfassungRepository;
import com.example.anwesenheit.repository.StudentRepository;
import org.springframework.stereotype.Service;

@Service
public class GebuehrenErfassungService {

    private final GebuehrenErfassungRepository gebuehrenErfassungRepository;
    private final StudentRepository studentRepository;

    public GebuehrenErfassungService(
            GebuehrenErfassungRepository gebuehrenErfassungRepository,
            StudentRepository studentRepository
    ) {
        this.gebuehrenErfassungRepository = gebuehrenErfassungRepository;
        this.studentRepository = studentRepository;
    }

    public GebuehrenErfassung getStatus(
            Long studentId,
            String schuljahr,
            Integer halbjahr
    ) {
        return gebuehrenErfassungRepository
                .findByStudentIdAndSchuljahrAndHalbjahr(
                        studentId,
                        schuljahr,
                        halbjahr
                )
                .orElseGet(() -> {
                    Student student = studentRepository.findById(studentId)
                            .orElseThrow(() -> new RuntimeException("Student nicht gefunden"));

                    GebuehrenErfassung erfassung = new GebuehrenErfassung();
                    erfassung.setStudent(student);
                    erfassung.setSchuljahr(schuljahr);
                    erfassung.setHalbjahr(halbjahr);
                    erfassung.setErfasst(false);

                    return gebuehrenErfassungRepository.save(erfassung);
                });
    }

    public GebuehrenErfassung toggleErfasst(
            Long studentId,
            String schuljahr,
            Integer halbjahr
    ) {
        GebuehrenErfassung erfassung = getStatus(
                studentId,
                schuljahr,
                halbjahr
        );

        erfassung.setErfasst(!erfassung.getErfasst());

        return gebuehrenErfassungRepository.save(erfassung);
    }
}