package com.example.anwesenheit.repository;

import com.example.anwesenheit.model.Klasse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KlasseRepository extends JpaRepository<Klasse, Long> {

    Optional<Klasse> findByName(String name);
}