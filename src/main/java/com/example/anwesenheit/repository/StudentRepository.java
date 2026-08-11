package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository
        extends JpaRepository<Student, Long> {

    List<Student> findByJahrgang(Integer jahrgang);
}