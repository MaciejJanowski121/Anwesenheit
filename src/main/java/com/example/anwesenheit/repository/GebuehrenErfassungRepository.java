package com.example.anwesenheit.repository;



import com.example.anwesenheit.model.GebuehrenErfassung;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GebuehrenErfassungRepository extends JpaRepository<GebuehrenErfassung, Long> {

    Optional<GebuehrenErfassung> findByStudentIdAndSchuljahrAndHalbjahr(
            Long studentId,
            String schuljahr,
            Integer halbjahr
    );
}