package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.Kurs;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KursRepository extends JpaRepository <Kurs, Long> {
}
