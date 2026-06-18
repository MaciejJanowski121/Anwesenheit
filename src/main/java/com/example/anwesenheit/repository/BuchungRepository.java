package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.Buchung;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BuchungRepository extends JpaRepository<Buchung, Long> {

    List<Buchung> findByStudentId(Long studentId);

    List<Buchung> findByKursId(Long kursId);
}